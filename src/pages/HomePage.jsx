import { useState } from 'react'
import { Link } from 'react-router'

function loadWorkoutRecord() {
  try {
    const record = JSON.parse(
      localStorage.getItem('demo-workout-record')
    )

    if (
      record?.planId !== 'demo-plan-1' ||
      !Array.isArray(record.exercises) ||
      record.exercises.length === 0 ||
      !record.exercises.every(
        (exercise) =>
          exercise &&
          typeof exercise.completed === 'boolean'
      )
    ) {
      return null
    }

    return record
  } catch {
    return null
  }
}

function loadApprovedPlan() {
  try {
    const plan = JSON.parse(
      localStorage.getItem('demo-approved-plan')
    )

    if (
      plan?.id !== 'demo-weekly-plan-1' ||
      typeof plan.approvedAt !== 'string' ||
      !Array.isArray(plan.sessions) ||
      plan.sessions.length === 0 ||
      !plan.sessions.every(
        (session) =>
          session &&
          typeof session.id === 'string' &&
          typeof session.day === 'string' &&
          typeof session.time === 'string' &&
          typeof session.title === 'string' &&
          Number.isFinite(session.duration) &&
          session.duration > 0
      )
    ) {
      return null
    }

    return plan
  } catch {
    return null
  }
}

function loadUpcomingSchedules() {
  try {
    const schedules = JSON.parse(
      localStorage.getItem('demo-schedules')
    )

    if (!Array.isArray(schedules)) return []

    const now = Date.now()

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
          ).getTime() > now
      )
      .sort((a, b) =>
        `${a.date}T${a.startTime}`.localeCompare(
          `${b.date}T${b.startTime}`
        )
      )
      .slice(0, 3)
  } catch {
    return []
  }
}

export default function HomePage() {
  const [record] = useState(loadWorkoutRecord)
  const [plan] = useState(loadApprovedPlan)
  const [schedules, setSchedules] = useState(loadUpcomingSchedules)

  const completedCount = record
    ? record.exercises.filter((exercise) => exercise.completed).length
    : 0

  const totalCount = record ? record.exercises.length : 0

  const status = !record
    ? '기록 없음'
    : completedCount === totalCount
      ? '완료'
      : completedCount > 0
        ? '부분 완료'
        : '미수행'

  const savedDate = record ? new Date(record.savedAt) : null

  const savedDateText =
    savedDate && !Number.isNaN(savedDate.getTime())
      ? savedDate.toLocaleString('ko-KR')
      : '저장 시각 정보 없음'

  const totalMinutes = plan
    ? plan.sessions.reduce(
        (total, session) => total + session.duration,
        0
      )
    : 0

  return (
    <section>
      <h1>홈 화면</h1>
      <p>내 일정에 맞는 운동을 시작해 보세요.</p>

      <section>
        <h2>승인한 운동 계획</h2>

        {plan ? (
          <div>
            <p>
              주 {plan.sessions.length}회 · 총 {totalMinutes}분
            </p>

            <ul>
              {plan.sessions.map((session) => (
                <li key={session.id}>
                  <strong>{session.day} · {session.title}</strong>
                  <p>
                    {session.time} 시작 · {session.duration}분
                  </p>
                </li>
              ))}
            </ul>

            <p>현재는 예시 주간 계획입니다.</p>
            <Link to="/plan">계획 자세히 보기</Link>
          </div>
        ) : (
          <div>
            <p>아직 승인한 운동 계획이 없어요.</p>
            <Link to="/plan">운동 계획 확인하기</Link>
          </div>
        )}
      </section>

      <section>
        <h2>운동하기</h2>
        <p>예시 운동 목록을 확인하고 수행한 종목을 체크하세요.</p>
        <Link to="/workout">운동 화면으로 이동</Link>
      </section>

      <section>
        <h2>최근 저장한 운동 결과</h2>

        {record ? (
          <div>
            <p>상태: {status}</p>
            <p>
              완료한 종목: {completedCount} / {totalCount}개
            </p>
            <p>저장 시각: {savedDateText}</p>
          </div>
        ) : (
          <p>아직 저장된 운동 기록이 없어요.</p>
        )}

        <p>현재는 예시 운동 기록 하나를 표시합니다.</p>
      </section>

      <section>
        <h2>다가오는 생활 일정</h2>
        <p>아직 끝나지 않은 일정을 시간순으로 최대 3개 표시해요.</p>

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