import { api } from './client.js'
import { deleteSchedule, getSchedule, listSchedules } from './schedule.js'
import { dateKey, parseDateKey, readStorage, weekdays, weekRange } from '../workoutPlan.js'

export const goalText = {
  muscle: '근력 및 근육량 향상',
  fat: '체지방 관리',
  fitness: '기초 체력 및 심폐지구력 향상',
  unsure: '기본 운동 계획 추천',
  general: '기본 운동 계획 추천',
}

export function loadGoalText() {
  return goalText[readStorage('demo-profile', null)?.goal] ?? goalText.general
}

const timeOf = (term) => term.slice(11, 16)
const minutesBetween = (start, end) => Math.round((new Date(end) - new Date(start)) / 60000)

function exerciseDetail(exercise) {
  if (exercise.sets && exercise.reps) return `${exercise.sets}세트 x ${exercise.reps}회`
  if (exercise.duration_seconds) {
    const seconds = exercise.duration_seconds
    return seconds >= 60 ? `${Math.round(seconds / 60)}분` : `${seconds}초`
  }
  return `약 ${exercise.estimated_minutes}분`
}

// 서버 운동 일정(+종목) → 화면용 운동 객체
export function toSession(schedule, todayKey = dateKey(new Date())) {
  const date = schedule.start_term.slice(0, 10)
  const exercises = (schedule.exercises ?? [])
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((exercise) => ({
      id: exercise.id,
      name: exercise.name,
      detail: exerciseDetail(exercise),
      sets: exercise.sets,
      reps: exercise.reps,
      completed: exercise.completed,
    }))
  const completedCount = exercises.filter((exercise) => exercise.completed).length

  let status = '기록 없음'
  if (exercises.length > 0 && completedCount === exercises.length) status = '완료'
  else if (completedCount > 0) status = '부분 완료'
  else if (date < todayKey) status = '미수행'

  return {
    id: schedule.id,
    name: schedule.name,
    // AI가 붙이는 '운동: ' 접두어는 빼고 보여줘요. 예: '운동: 하체 (저강도)' → '하체 (저강도)'
    title: schedule.name?.replace(/^운동\s*[:：]\s*/, '').trim() || '운동',
    date,
    day: `${weekdays[parseDateKey(date).getDay()]}요일`,
    time: timeOf(schedule.start_term),
    endTime: timeOf(schedule.end_term),
    duration: minutesBetween(schedule.start_term, schedule.end_term),
    exercises,
    completedCount,
    status,
  }
}

// 기간의 일정: AI 운동 일정은 종목까지 불러와 sessions로, 나머지는 생활 일정(life)으로 나눠요.
export async function loadPeriod(start, end) {
  const schedules = await listSchedules(dateKey(start), dateKey(end))
  const workouts = schedules.filter((schedule) => schedule.created_by_ai)
  const details = await Promise.all(workouts.map((schedule) => getSchedule(schedule.id)))

  return {
    sessions: details.map((detail) => toSession(detail)).sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)),
    life: schedules.filter((schedule) => !schedule.created_by_ai),
  }
}

export function loadWeek(date = new Date()) {
  const { start, end } = weekRange(date)
  return loadPeriod(start, end)
}

export async function loadSession(id) {
  return toSession(await getSchedule(id))
}


// AI 생성은 수십 초 걸리고 비용이 들어서, 같은 주 요청이 진행 중이면 그 요청을 같이 기다려요.
const pending = new Map()

export function generatePlan(goal, week) {
  const key = week ?? 'this-week'
  if (!pending.has(key)) {
    const request = api('/plan', { method: 'POST', body: { goal, week } }).finally(() => pending.delete(key))
    pending.set(key, request)
  }
  return pending.get(key)
}

// 「다른 계획 추천 받기」: 아직 하지 않은 오늘 이후 운동 일정만 지워요.
export async function clearUpcomingWorkouts(sessions, todayKey = dateKey(new Date())) {
  await Promise.all(
    sessions
      .filter((session) => session.date >= todayKey && session.completedCount === 0)
      .map((session) => deleteSchedule(session.id))
  )
}

// 종목 하나를 체크하거나 해제한 뒤 세션 상태를 다시 계산해요.
export function withExerciseChecked(sessions, sessionId, exerciseId, completed) {
  return sessions.map((session) => {
    if (session.id !== sessionId) return session
    const exercises = session.exercises.map((exercise) => (exercise.id === exerciseId ? { ...exercise, completed } : exercise))
    const completedCount = exercises.filter((exercise) => exercise.completed).length
    let status = session.status === '미수행' ? '미수행' : '기록 없음'
    if (completedCount > 0) status = completedCount === exercises.length ? '완료' : '부분 완료'
    return { ...session, exercises, completedCount, status }
  })
}
