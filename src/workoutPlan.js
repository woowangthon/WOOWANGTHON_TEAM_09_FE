const APPROVED_PLAN_KEY = 'demo-approved-plan'

export const weekdays = ['일', '월', '화', '수', '목', '금', '토']

export function readStorage(key, fallback) {
  try {
    const saved = localStorage.getItem(key)
    return saved ? JSON.parse(saved) : fallback
  } catch {
    return fallback
  }
}

export function loadPlan() {
  const plan = readStorage(APPROVED_PLAN_KEY, null)

  if (
    plan?.id !== 'demo-weekly-plan-1' ||
    !Array.isArray(plan.sessions) ||
    plan.sessions.length === 0 ||
    !plan.sessions.every(
      (session) =>
        session &&
        typeof session.id === 'string' &&
        typeof session.day === 'string' &&
        typeof session.title === 'string' &&
        typeof session.time === 'string' &&
        Number.isFinite(session.duration) &&
        session.duration > 0
    )
  ) {
    return null
  }

  return plan
}

export function savePlan(plan) {
  localStorage.setItem(APPROVED_PLAN_KEY, JSON.stringify(plan))
}

export function loadRecords() {
  const records = readStorage('demo-session-records', {})

  return records && typeof records === 'object' && !Array.isArray(records)
    ? records
    : {}
}

export function getValidRecord(records, planId, sessionId) {
  const record = records[`${planId}:${sessionId}`]

  if (
    record?.planId !== planId ||
    record.sessionId !== sessionId ||
    !Array.isArray(record.exercises) ||
    record.exercises.length === 0 ||
    !record.exercises.every(
      (exercise) =>
        exercise && typeof exercise.completed === 'boolean'
    ) ||
    typeof record.savedAt !== 'string' ||
    Number.isNaN(new Date(record.savedAt).getTime())
  ) {
    return null
  }

  return record
}

export function getStatus(record) {
  if (!record) return '기록 없음'

  const count = record.exercises.filter(
    (exercise) => exercise.completed
  ).length

  if (count === record.exercises.length) return '완료'
  if (count > 0) return '부분 완료'
  return '미수행'
}

export function getPlanSessions(plan, records) {
  if (!plan) return []

  return plan.sessions.map((session) => {
    const record = getValidRecord(records, plan.id, session.id)
    return { ...session, record, status: getStatus(record) }
  })
}

export function getPlanProgress(sessions) {
  const completed = sessions.filter((session) => session.status === '완료').length
  const partial = sessions.filter((session) => session.status === '부분 완료').length
  const missed = sessions.filter((session) => session.status === '미수행').length

  return {
    completed,
    partial,
    missed,
    unrecorded: sessions.length - completed - partial - missed,
    rate: sessions.length ? Math.round((completed / sessions.length) * 100) : 0,
  }
}

// AI 연결 전 화면 확인용 기본 주간 계획
export const examplePlan = {
  id: 'demo-weekly-plan-1',
  sessions: [
    { id: 'session-1', day: '월요일', time: '17:00', duration: 40, title: '상체 운동' },
    { id: 'session-2', day: '수요일', time: '18:00', duration: 40, title: '하체 운동' },
    { id: 'session-3', day: '금요일', time: '16:00', duration: 30, title: '전신 운동' },
  ],
}

const DAY_START = 6 * 60
const DAY_END = 23 * 60

function toMinutes(time) {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

function toTime(minutes) {
  const hours = String(Math.floor(minutes / 60)).padStart(2, '0')
  return `${hours}:${String(minutes % 60).padStart(2, '0')}`
}

// 운동하기 어려운 시간과 겹치는 세션을 그 시간 직후(불가하면 직전)로 옮겨요.
export function createPlan(unavailablePeriod) {
  if (!unavailablePeriod) return examplePlan

  const blockedDay = `${weekdays[Number(unavailablePeriod.weekday)]}요일`
  const blockedStart = toMinutes(unavailablePeriod.startTime)
  const blockedEnd = toMinutes(unavailablePeriod.endTime)

  return {
    ...examplePlan,
    sessions: examplePlan.sessions.map((session) => {
      const start = toMinutes(session.time)
      const end = start + session.duration

      if (session.day !== blockedDay || end <= blockedStart || start >= blockedEnd) {
        return session
      }

      if (blockedEnd + session.duration <= DAY_END) {
        return { ...session, time: toTime(blockedEnd), adjusted: true }
      }

      if (blockedStart - session.duration >= DAY_START) {
        return { ...session, time: toTime(blockedStart - session.duration), adjusted: true }
      }

      return session
    }),
  }
}
