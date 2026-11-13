import { workoutTitle } from './plan.js'
import { listSchedules, replaceSchedule } from './schedule.js'
import { listBlocks } from './weeklyBlocks.js'
import { addDays, dateKey, formatKoreanTime, parseDateKey, weekdays } from '../workoutPlan.js'

// 운동 일정과 다른 일정이 겹칠 때 운동을 빈 시간으로 옮겨요.
// 이 기기 사본이 아니라 서버(DB)의 일정·반복 일정(수업, 운동하기 어려운 시간)을 기준으로 빈 시간을 찾아요.

const DAY_START = 8 * 60 // 서버 AI 계획과 같이 08:00~22:00 사이에만 운동을 넣어요.
const DAY_END = 22 * 60
const STEP = 30
const LOOK_AHEAD_DAYS = 6 // 그날 빈 시간이 없으면 이후 6일 중 운동 없는 날로

const toMinutes = (time) => {
  const [hour, minute] = time.slice(0, 5).split(':').map(Number)
  return hour * 60 + minute
}
const toTime = (minutes) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
const nextKey = (key) => dateKey(addDays(parseDateKey(key), 1))
const serverWeekday = (key) => parseDateKey(key).getDay() || 7

// 일정 하나가 그날 차지하는 구간(분). 그날과 겹치지 않으면 null
function spanOn(key, item) {
  const dayStart = `${key}T00:00`
  const dayEnd = `${nextKey(key)}T00:00`
  if (item.start_term >= dayEnd || item.end_term <= dayStart) return null
  return {
    start: item.start_term < dayStart ? 0 : toMinutes(item.start_term.slice(11)),
    end: item.end_term >= dayEnd ? 24 * 60 : toMinutes(item.end_term.slice(11)),
  }
}

// 반복 일정이 그 요일에 차지하는 구간(분). 23:59로 끝나면 자정까지로 봐요.
function blockSpans(key, blocks) {
  return blocks
    .filter((block) => block.weekday === serverWeekday(key))
    .map((block) => ({
      start: toMinutes(block.start_time),
      end: block.end_time.startsWith('23:59') ? 24 * 60 : toMinutes(block.end_time),
    }))
}

const titles = (workouts) => workouts.map((workout) => `「${workoutTitle(workout.name)}」`).join(', ')
const overlaps = (a, b) => a.start < b.end && a.end > b.start

// 서버에서 반복 일정과 그 기간의 일정을 한 번에 받아와요.
async function loadContext(fromKey, toKey) {
  const [blocks, schedules] = await Promise.all([listBlocks(), listSchedules(fromKey, toKey)])
  return { blocks, schedules }
}

// workouts(서버 운동 일정)를 옮길 자리를 정해요. extra: 곧 추가할 일정 (아직 서버에 없는 것)
// 1순위: 같은 날 원래 시간과 가장 가까운 빈 시간 / 2순위: 이후 며칠 중 운동 없는 날
function placeMoves(workouts, extra, { blocks, schedules }, now) {
  const todayKey = dateKey(now)
  const nowMinutes = now.getHours() * 60 + now.getMinutes() + STEP
  const movingIds = new Set(workouts.map((workout) => workout.id))
  const placed = []
  const failed = []

  function busyOn(key, workoutId) {
    return [
      ...blockSpans(key, blocks),
      ...schedules.filter((item) => item.id !== workoutId).map((item) => spanOn(key, item)),
      ...extra.map((item) => spanOn(key, item)),
      ...placed.map((move) => (move.key === key ? { start: move.start, end: move.end } : null)),
    ].filter(Boolean)
  }

  const hasWorkout = (key) =>
    schedules.some((item) => item.created_by_ai && !movingIds.has(item.id) && item.start_term.startsWith(key)) ||
    placed.some((move) => move.key === key)

  function bestStart(key, duration, busy, prefer) {
    const first = Math.max(DAY_START, key === todayKey ? Math.ceil(nowMinutes / STEP) * STEP : 0)
    let best = null
    for (let start = first; start + duration <= DAY_END; start += STEP) {
      if (busy.some((span) => overlaps(span, { start, end: start + duration }))) continue
      if (best === null || Math.abs(start - prefer) < Math.abs(best - prefer)) best = start
    }
    return best
  }

  for (const workout of workouts) {
    const key = workout.start_term.slice(0, 10)
    const prefer = toMinutes(workout.start_term.slice(11))
    const duration = Math.max(STEP, Math.round((new Date(workout.end_term) - new Date(workout.start_term)) / 60000))

    let move = null
    for (let offset = 0; offset <= LOOK_AHEAD_DAYS && !move; offset += 1) {
      const day = dateKey(addDays(parseDateKey(key), offset))
      if (day < todayKey || (offset > 0 && hasWorkout(day))) continue
      const start = bestStart(day, duration, busyOn(day, workout.id), prefer)
      if (start !== null) move = { workout, key: day, start, end: start + duration }
    }

    if (move) placed.push(move)
    else failed.push(workout)
  }

  return { moves: placed, failed }
}

// 곧 추가할 일정(extra)과 겹치는 운동들을 어디로 옮길지 정해요. (아직 저장하지 않아요)
export async function planWorkoutMoves(workouts, extra = [], now = new Date()) {
  const keys = workouts.map((workout) => workout.start_term.slice(0, 10)).sort()
  const context = await loadContext(keys[0], dateKey(addDays(parseDateKey(keys.at(-1)), LOOK_AHEAD_DAYS)))
  const { moves, failed } = placeMoves(workouts, extra, context, now)
  if (failed.length) return { error: `${titles(failed)} 운동을 옮길 빈 시간이 없어요. 일정 시간을 바꿔 주세요.` }
  return { moves }
}

// 정해 둔 자리로 운동 일정을 옮겨요. (운동 목록과 이수 기록은 서버가 그대로 둬요)
export async function applyWorkoutMoves(moves) {
  for (const { workout, key, start, end } of moves) {
    await replaceSchedule(workout.id, { name: workout.name, start_term: `${key}T${toTime(start)}`, end_term: `${key}T${toTime(end)}` })
  }
}

// 「하체」 운동은 오후 3:00로 · 「상체」 운동은 11월 14일(금) 오전 9:00로
export function describeMoves(moves) {
  return moves
    .map(({ workout, key, start }) => {
      const sameDay = workout.start_term.startsWith(key)
      const date = parseDateKey(key)
      const when = sameDay ? '' : `${date.getMonth() + 1}월 ${date.getDate()}일(${weekdays[date.getDay()]}) `
      return `「${workoutTitle(workout.name)}」 운동은 ${when}${formatKoreanTime(toTime(start))}로`
    })
    .join(', ')
}

// 수업·운동하기 어려운 시간(반복 일정)을 바꾼 뒤: 앞으로 할 운동 중 그 시간과 겹치는 것을 빈 시간으로 옮겨요.
// 돌려주는 값: 사용자에게 보여줄 문장 (옮길 게 없으면 빈 문자열)
export async function moveWorkoutsOutOfBlocks(now = new Date()) {
  const todayKey = dateKey(now)
  const context = await loadContext(todayKey, dateKey(addDays(now, 13 + LOOK_AHEAD_DAYS)))
  const nowTerm = `${todayKey}T${toTime(now.getHours() * 60 + now.getMinutes())}`

  const clashing = context.schedules.filter((item) => {
    if (!item.created_by_ai || item.start_term <= nowTerm) return false
    const key = item.start_term.slice(0, 10)
    const span = spanOn(key, item)
    return blockSpans(key, context.blocks).some((block) => overlaps(block, span))
  })
  if (!clashing.length) return ''

  const { moves, failed } = placeMoves(clashing, [], context, now)
  await applyWorkoutMoves(moves)

  const notes = []
  if (moves.length) notes.push(`겹치는 운동을 옮겼어요. ${describeMoves(moves)} 옮겼어요.`)
  if (failed.length) notes.push(`${titles(failed)} 운동은 옮길 빈 시간이 없어요. 캘린더에서 확인해 주세요.`)
  return notes.join(' ')
}

// 반복 일정을 바꾼 뒤 부르는 용도: 실패해도 저장 자체는 성공이니 안내 문장만 돌려줘요.
export async function moveWorkoutsOutOfBlocksSafely() {
  try {
    return await moveWorkoutsOutOfBlocks()
  } catch {
    return '겹치는 운동이 있는지 확인하지 못했어요. 캘린더에서 확인해 주세요.'
  }
}
