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
