import { useState } from 'react'
import { Link } from 'react-router'
import { exampleRoutines } from '../workoutRoutines.js'
import { getPlanSessions, getPlanProgress, loadPlan, loadRecords, readStorage, weekdays } from '../workoutPlan.js'
import FitNavigation from '../components/FitNavigation.jsx'
import WorkoutWeek from '../components/WorkoutWeek.jsx'
import './HomePage.css'

const dateFormat = new Intl.DateTimeFormat('ko-KR', {
  month: 'long',
  day: 'numeric',
  weekday: 'long',
})

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

function getFeaturedSession(sessions, todayIndex) {
  for (let offset = 0; offset < weekdays.length; offset += 1) {
    const weekday = weekdays[(todayIndex + offset) % weekdays.length]
    const session = sessions.find((item) => item.day === `${weekday}요일`)

    if (session) return session
  }

  return null
}

export default function HomePage() {
  const [plan] = useState(loadPlan)
  const [records] = useState(loadRecords)
  const [schedules, setSchedules] = useState(loadUpcomingSchedules)
  const [today] = useState(() => new Date())

  const sessions = getPlanSessions(plan, records)

  const featured = getFeaturedSession(sessions, today.getDay())
  const isToday = featured?.day === `${weekdays[today.getDay()]}요일`
  const routine = featured ? exampleRoutines[featured.id] ?? [] : []
  const { completed, partial, rate } = getPlanProgress(sessions)
  const totalMinutes = sessions.reduce((total, session) => total + session.duration, 0)

  const latestSession = sessions
    .filter((session) => session.record)
    .sort((a, b) => Date.parse(b.record.savedAt) - Date.parse(a.record.savedAt))[0]

  return (
    <div className="fit-home">
      <div className="fit-home__overview">
        <header className="fit-home__header">
          <p>{dateFormat.format(today)}</p>
          <h1>오늘도 시작해볼까요?</h1>
        </header>

        <section aria-labelledby="featured-workout-heading">
          <h2 id="featured-workout-heading">{featured && !isToday ? 'Next Plan' : "Today's Plan"}</h2>
          <div className="fit-home__card">
            {featured ? (
              <>
                <h3>{featured.title}</h3>
                <p>{featured.day} {featured.time} · {featured.duration}분</p>
                <ul className="fit-home__routine">
                  {routine.map((exercise) => (
                    <li key={exercise.id}>
                      {exercise.name} {exercise.sets}세트 × {exercise.reps}회
                    </li>
                  ))}
                </ul>
                <Link className="fit-home__button" to={`/workout?session=${encodeURIComponent(featured.id)}`}>
                  운동 완료 기록
                </Link>
              </>
            ) : (
              <>
                <h3>승인한 운동 계획이 없어요</h3>
                <p>운동 계획을 확인하고 승인해 주세요.</p>
                <Link className="fit-home__button" to="/plan">
                  운동 계획 확인하기
                </Link>
              </>
            )}
          </div>
        </section>

        <Link className="fit-home__week-link" to="/report" aria-label="주간 운동 리포트 보기">
          <WorkoutWeek sessions={sessions} />
        </Link>
      </div>

      <div className="fit-home__details">
        <section id="home-progress" className="fit-home__card">
          <h2>운동 계획 진행 현황</h2>
          {plan ? (
            <>
              <p>주 {sessions.length}회 · 총 {totalMinutes}분</p>
              <p>완료 {completed}/{sessions.length}회 · 부분 완료 {partial}회</p>
              <p>계획 수행률 {rate}%</p>
              <progress aria-label="계획 수행률" value={rate} max="100" />
              <ul>
                {sessions.map((session) => (
                  <li key={session.id}>
                    {session.day} {session.time} · {session.title} · {session.status}
                  </li>
                ))}
              </ul>
              <p>부분 완료는 전체 완료 횟수에 포함하지 않아요.</p>
            </>
          ) : (
            <p>계획을 승인하면 운동 현황을 볼 수 있어요.</p>
          )}
          <Link to="/plan">운동 계획 보기</Link>
        </section>

        <section className="fit-home__card">
          <h2>최근 저장한 운동 결과</h2>
          {latestSession ? (
            <>
              <h3>{latestSession.day} · {latestSession.title}</h3>
              <p>상태: {latestSession.status}</p>
              <p>
                완료한 종목: {latestSession.record.exercises.filter((exercise) => exercise.completed).length}
                {' / '}{latestSession.record.exercises.length}개
              </p>
              <p>저장 시각: {new Date(latestSession.record.savedAt).toLocaleString('ko-KR')}</p>
            </>
          ) : (
            <p>현재 계획에 저장된 운동 기록이 없어요.</p>
          )}
        </section>

        <section className="fit-home__card">
          <h2>다가오는 생활 일정</h2>
          <button type="button" onClick={() => setSchedules(loadUpcomingSchedules())}>
            일정 다시 불러오기
          </button>

          {schedules.length ? (
            <ul>
              {schedules.map((schedule) => (
                <li key={schedule.id}>
                  <strong>{schedule.title}</strong>
                  <p>{schedule.date} · {schedule.startTime} ~ {schedule.endTime}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p>예정된 생활 일정이 없어요.</p>
          )}

          <Link to="/schedule">전체 일정 보기 및 추가</Link>
        </section>

        <Link to="/signup">초기 정보 입력 및 수정</Link>
      </div>

      <FitNavigation />
    </div>
  )
}
