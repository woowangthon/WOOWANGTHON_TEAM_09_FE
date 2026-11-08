import { useState } from 'react'
import { Link } from 'react-router'

function readStorage(key, fallback) {
  try {
    const saved = localStorage.getItem(key)
    return saved ? JSON.parse(saved) : fallback
  } catch {
    return fallback
  }
}

function loadPlan() {
  const plan = readStorage('demo-approved-plan', null)

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

function loadRecords() {
  const records = readStorage('demo-session-records', {})

  return records && typeof records === 'object' && !Array.isArray(records)
    ? records
    : {}
}

function getValidRecord(records, planId, sessionId) {
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

function getStatus(record) {
  if (!record) return '기록 없음'

  const count = record.exercises.filter(
    (exercise) => exercise.completed
  ).length

  if (count === record.exercises.length) return '완료'
  if (count > 0) return '부분 완료'
  return '미수행'
}

function loadUpcomingSchedules() {
  const schedules = readStorage('demo-schedules', [])

  if (!Array.isArray(schedules)) return []

  return schedules
    .filter(
      (schedule) =>
        schedule &&
        typeof schedule.id === 'string' &&
        typeof schedule.title === 'string' &&
        typeof schedule.date === 'string' &&
        typeof schedule.startTime === 'string' &&
        typeof schedule.endTime === 'string' &&
        new Date(
          `${schedule.date}T${schedule.endTime}`
        ).getTime() > Date.now()
    )
    .sort((a, b) =>
      `${a.date}T${a.startTime}`.localeCompare(
        `${b.date}T${b.startTime}`
      )
    )
    .slice(0, 3)
}

export default function HomePage() {
  const [plan] = useState(loadPlan)
  const [records] = useState(loadRecords)
  const [schedules, setSchedules] = useState(loadUpcomingSchedules)

  const sessions = plan
    ? plan.sessions.map((session) => {
        const record = getValidRecord(records, plan.id, session.id)

        return {
          ...session,
          record,
          status: getStatus(record),
        }
      })
    : []

  const completedSessions = sessions.filter(
    (session) => session.status === '완료'
  ).length

  const partialSessions = sessions.filter(
    (session) => session.status === '부분 완료'
  ).length

  const completionRate = sessions.length
    ? Math.round((completedSessions / sessions.length) * 100)
    : 0

  const totalMinutes = sessions.reduce(
    (total, session) => total + session.duration,
    0
  )

  const latestSession = sessions
    .filter((session) => session.record)
    .sort(
      (a, b) =>
        new Date(b.record.savedAt).getTime() -
        new Date(a.record.savedAt).getTime()
    )[0]

  return (
    <section>
      <h1>홈 화면</h1>
      <p>내 일정에 맞는 운동을 시작해 보세요.</p>

      <section>
        <h2>승인한 운동 계획</h2>

        {plan ? (
          <div>
            <p>주 {sessions.length}회 · 총 {totalMinutes}분</p>

            <ul>
              {sessions.map((session) => (
                <li key={session.id}>
                  <h3>{session.day} · {session.title}</h3>
                  <p>
                    {session.time} 시작 · {session.duration}분
                  </p>
                  <p>상태: {session.status}</p>
                </li>
              ))}
            </ul>

            <Link to="/plan">계획 자세히 보기</Link>
          </div>
        ) : (
          <div>
            <p>아직 승인한 운동 계획이 없어요.</p>
            <Link to="/plan">운동 계획 확인하기</Link>
          </div>
        )}
      </section>

      {plan && (
        <section>
          <h2>예시 계획 진행 현황</h2>
          <p>전체 완료: {completedSessions} / {sessions.length}회</p>
          <p>부분 완료: {partialSessions}회</p>
          <p>계획 수행률: {completionRate}%</p>
          <p>부분 완료는 전체 완료 횟수에 포함하지 않아요.</p>
        </section>
      )}

      <section>
        <h2>운동하기</h2>
        <Link to="/workout">운동 선택 및 기록하기</Link>
      </section>

      <section>
        <h2>최근 저장한 운동 결과</h2>

        {latestSession ? (
          <div>
            <h3>{latestSession.day} · {latestSession.title}</h3>
            <p>상태: {latestSession.status}</p>
            <p>
              완료한 종목:{' '}
              {latestSession.record.exercises.filter(
                (exercise) => exercise.completed
              ).length}
              {' / '}
              {latestSession.record.exercises.length}개
            </p>
            <p>
              저장 시각:{' '}
              {new Date(
                latestSession.record.savedAt
              ).toLocaleString('ko-KR')}
            </p>
          </div>
        ) : (
          <p>현재 계획에 저장된 운동 기록이 없어요.</p>
        )}
      </section>

      <section>
        <h2>다가오는 생활 일정</h2>

        <button
          type="button"
          onClick={() => setSchedules(loadUpcomingSchedules())}
        >
          저장된 일정 다시 불러오기
        </button>

        {schedules.length === 0 ? (
          <p>예정된 생활 일정이 없어요.</p>
        ) : (
          <ul>
            {schedules.map((schedule) => (
              <li key={schedule.id}>
                <h3>{schedule.title}</h3>
                <p>
                  {schedule.date}
                  {' · '}
                  {schedule.startTime} ~ {schedule.endTime}
                </p>
              </li>
            ))}
          </ul>
        )}

        <Link to="/schedule">전체 일정 보기 및 추가</Link>
      </section>
    </section>
  )
}