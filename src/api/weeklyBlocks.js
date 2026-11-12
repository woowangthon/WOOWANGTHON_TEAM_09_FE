import { api } from './client.js'
import { loadTimetable, saveTimetable } from '../timetable.js'
import { DEFAULT_PERIOD_LABEL, daysText, getUnavailablePeriods, getUnavailableSegments, loadUnavailablePeriods } from '../workoutAvailability.js'
import { weekdays as dayNames } from '../workoutPlan.js'

// 서버 반복 일정 중 '운동하기 어려운 시간'은 이 이름으로 시작해요.
// 이름 뒤에 그 구간을 만든 시간대들을 적어 두어 다른 기기에서도 복원할 수 있게 해요.
// 예: 운동하기 어려운 시간 · 취침 (매일 23:00~07:00) · 동아리 (월·수 18:00~20:00)
// 예전 형식(운동하기 어려운 시간 (매일 22:00~07:00))도 읽을 수 있어요.
export const UNAVAILABLE_NAME = '운동하기 어려운 시간'
const periodsInName = /(?:·\s*([^·(]+?)\s*)?\((매일|[일월화수목금토](?:·[일월화수목금토])*) (\d{2}:\d{2})~(\d{2}:\d{2})\)/g
const NAME_LIMIT = 100

// 앱 요일(0=일 ~ 6=토) ↔ 서버 요일(1=월 ~ 7=일)
export const toServerWeekday = (weekday) => (Number(weekday) === 0 ? 7 : Number(weekday))
export const fromServerWeekday = (weekday) => String(weekday === 7 ? 0 : weekday)

const toMinutes = (time) => {
  const [hour, minute] = time.split(':').map(Number)
  return hour * 60 + minute
}
const toTime = (minutes) => {
  const clamped = Math.min(minutes, 23 * 60 + 59)
  return `${String(Math.floor(clamped / 60)).padStart(2, '0')}:${String(clamped % 60).padStart(2, '0')}`
}

function isUnavailable(block) {
  return block.name?.startsWith(UNAVAILABLE_NAME) ?? false
}

// 반복 일정 이름에서 어려운 시간대 목록을 읽어요.
export function readUnavailablePeriods(blocks) {
  const found = new Map()
  for (const block of blocks.filter(isUnavailable)) {
    for (const [, label, days, startTime, endTime] of block.name.matchAll(periodsInName)) {
      const weekdays = days === '매일' ? null : days.split('·').map((day) => String(dayNames.indexOf(day)))
      const item = { label: label?.trim() || DEFAULT_PERIOD_LABEL, startTime, endTime, weekdays }
      found.set(`${item.label}|${days}|${startTime}|${endTime}`, item)
    }
  }
  return getUnavailablePeriods([...found.values()])
}

function toClass(block) {
  return {
    id: String(block.id),
    title: block.name ?? '수업',
    weekday: fromServerWeekday(block.weekday),
    startTime: block.start_time.slice(0, 5),
    endTime: block.end_time.slice(0, 5),
  }
}

export function listBlocks() {
  return api('/weekly-block')
}

// 서버의 수업 목록을 받아 이 기기 캐시에 저장하고 돌려줘요.
export async function refreshTimetable(knownBlocks) {
  const blocks = knownBlocks ?? (await listBlocks())
  const classes = blocks.filter((block) => !isUnavailable(block)).map(toClass)
  saveTimetable(classes)
  return loadTimetable()
}

// 그 요일의 시간대 구간을 펼친 뒤 겹치거나 맞닿는 것끼리 합쳐요. (서버는 같은 요일 겹침을 거부해요)
function mergedSegments(periods, weekday) {
  const segments = getUnavailableSegments(periods, weekday)
    .map((segment) => ({
      start: toMinutes(segment.startTime),
      end: segment.endTime === '24:00' ? 24 * 60 : toMinutes(segment.endTime),
      period: segment.period,
    }))
    .sort((a, b) => a.start - b.start)

  const merged = []
  for (const segment of segments) {
    const last = merged.at(-1)
    if (last && segment.start <= last.end) {
      last.end = Math.max(last.end, segment.end)
      if (!last.periods.includes(segment.period)) last.periods.push(segment.period)
    } else {
      merged.push({ start: segment.start, end: segment.end, periods: [segment.period] })
    }
  }
  return merged
}

function pieceName(periods) {
  const name = [UNAVAILABLE_NAME, ...periods.map((period) => `${period.label} (${daysText(period.weekdays)} ${period.startTime}~${period.endTime})`)].join(' · ')
  return name.slice(0, NAME_LIMIT)
}

// 어려운 시간대들을 요일별 구간으로 나누고, 수업 시간은 빼요.
export function unavailablePieces(periods, classes) {
  const pieces = []

  for (let weekday = 0; weekday < 7; weekday += 1) {
    const groups = mergedSegments(periods, weekday)
    const busy = classes
      .filter((item) => item.weekday === String(weekday))
      .map((item) => [toMinutes(item.startTime), toMinutes(item.endTime)])

    for (const group of groups) {
      let parts = [[group.start, group.end]]
      for (const [busyStart, busyEnd] of busy) {
        parts = parts.flatMap(([partStart, partEnd]) =>
          busyEnd <= partStart || busyStart >= partEnd
            ? [[partStart, partEnd]]
            : [[partStart, busyStart], [busyEnd, partEnd]].filter(([a, b]) => b - a >= 1)
        )
      }
      parts
        .filter(([a, b]) => toTime(b) > toTime(a))
        .forEach(([a, b]) => pieces.push({ weekday: toServerWeekday(weekday), start_time: toTime(a), end_time: toTime(b), name: pieceName(group.periods) }))
    }
  }

  return pieces
}

// 어려운 시간 구간을 지우고 operation(수업 추가·삭제 등)을 한 뒤, 현재 수업을 피해 다시 만들어요.
export async function withUnavailableRebuilt(periods, operation) {
  const blocks = await listBlocks()
  await Promise.all(blocks.filter(isUnavailable).map((block) => api(`/weekly-block/${block.id}`, { method: 'DELETE' })))

  try {
    if (operation) await operation()
  } finally {
    const classes = await refreshTimetable()
    await Promise.all(unavailablePieces(periods, classes).map((piece) => api('/weekly-block', { method: 'POST', body: piece })))
  }
}

export function saveUnavailablePeriods(periods) {
  return withUnavailableRebuilt(periods)
}

export async function addClass(item) {
  await withUnavailableRebuilt(loadUnavailablePeriods(), () =>
    api('/weekly-block', {
      method: 'POST',
      body: { weekday: toServerWeekday(item.weekday), start_time: item.startTime, end_time: item.endTime, name: item.title },
    })
  )
}

export async function deleteClass(id) {
  await withUnavailableRebuilt(loadUnavailablePeriods(), () => api(`/weekly-block/${id}`, { method: 'DELETE' }))
}
