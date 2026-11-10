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

// AI 연결 전 화면 확인용 예시 주간 계획. 「다른 계획 추천 받기」를 누르면 다음 예시로 바뀌어요.
export const planTemplates = [
  {
    id: 'demo-weekly-plan-1',
    sessions: [
      { id: 'session-2', day: '월요일', time: '18:00', duration: 40, title: '하체 운동' },
      { id: 'session-1', day: '수요일', time: '17:30', duration: 40, title: '상체 운동' },
      { id: 'session-3', day: '토요일', time: '11:00', duration: 40, title: '전신 운동' },
    ],
  },
  {
    id: 'demo-weekly-plan-1',
    sessions: [
      { id: 'session-1', day: '화요일', time: '19:00', duration: 40, title: '상체 운동' },
      { id: 'session-2', day: '목요일', time: '19:00', duration: 40, title: '하체 운동' },
      { id: 'session-3', day: '일요일', time: '10:00', duration: 40, title: '전신 운동' },
    ],
  },
]

export const examplePlan = planTemplates[0]

// '18:00' → '오후 6:00'
export function formatKoreanTime(time) {
  const [hour, minute] = time.split(':').map(Number)
  const period = hour < 12 ? '오전' : '오후'
  const displayHour = hour % 12 === 0 ? 12 : hour % 12

  return `${period} ${displayHour}:${String(minute).padStart(2, '0')}`
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

// 운동하기 어려운 시간·수업 시간과 겹치는 세션을 같은 날 가장 가까운 빈 시간으로 옮겨요.
export function createPlan(blockedPeriods = [], variant = 0) {
  const template = planTemplates[variant % planTemplates.length]

  // weekday가 없는 구간은 매일 적용돼요.
  const blocks = blockedPeriods.filter(Boolean).map((period) => ({
    day: period.weekday === undefined ? null : `${weekdays[Number(period.weekday)]}요일`,
    start: toMinutes(period.startTime),
    end: toMinutes(period.endTime),
  }))

  if (blocks.length === 0) return template

  return {
    ...template,
    sessions: template.sessions.map((session) => {
      const dayBlocks = blocks.filter((block) => block.day === null || block.day === session.day)
      const isFree = (start) =>
        start >= DAY_START &&
        start + session.duration <= DAY_END &&
        dayBlocks.every((block) => start + session.duration <= block.start || start >= block.end)
      const start = toMinutes(session.time)

      if (isFree(start)) return session

      const candidates = dayBlocks
        .flatMap((block) => [block.end, block.start - session.duration])
        .filter(isFree)
        .sort((a, b) => Math.abs(a - start) - Math.abs(b - start) || b - a)

      return candidates.length
        ? { ...session, time: toTime(candidates[0]), adjusted: true }
        : session
    }),
  }
}

const RECORDS_KEY = 'demo-session-records'

// 종목 체크 상태로 운동 기록을 저장하고 저장한 기록을 돌려줘요. (운동 기록 화면과 같은 형식)
export function saveSessionRecord(planId, session, exercises) {
  const completedIds = exercises.filter((exercise) => exercise.completed).map((exercise) => exercise.id)
  const record = {
    planId,
    sessionId: session.id,
    title: session.title,
    status: getStatus({ exercises }),
    completedIds,
    exercises,
    savedAt: new Date().toISOString(),
  }

  localStorage.setItem(RECORDS_KEY, JSON.stringify({ ...loadRecords(), [`${planId}:${session.id}`]: record }))
  return record
}

// 계획 안 순서대로 Day A, Day B ...
export function getDayLabel(plan, sessionId) {
  const index = plan.sessions.findIndex((session) => session.id === sessionId)
  return `Day ${String.fromCharCode(65 + Math.max(index, 0))}`
}

export function moveSession(plan, sessionId, day, time) {
  return {
    ...plan,
    sessions: plan.sessions.map((session) => (session.id === sessionId ? { ...session, day, time } : session)),
  }
}
