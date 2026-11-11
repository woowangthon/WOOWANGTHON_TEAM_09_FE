import { useState } from 'react'
import { Link } from 'react-router'
import { dayLabel, loadWeek, withExerciseChecked } from '../api/plan.js'
import { conflictMessage, replaceSchedule } from '../api/schedule.js'
import FitNavigation from '../components/FitNavigation.jsx'
import MissedWorkoutCard from '../components/MissedWorkoutCard.jsx'
import WorkoutChecklist from '../components/WorkoutChecklist.jsx'
import WorkoutWeek from '../components/WorkoutWeek.jsx'
import { getBusyPeriods, getFreeSlots, toTime } from '../freeTime.js'
import { useAsync } from '../hooks/useAsync.js'
import { addDays, dateKey, formatKoreanTime, readStorage } from '../workoutPlan.js'
import './HomePage.css'

const dateFormat = new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' })

function greeting(hour) {
  if (hour >= 5 && hour < 12) return '좋은 아침이에요'
  if (hour >= 12 && hour < 18) return '좋은 오후예요'
  return '좋은 저녁이에요'
}

function RoutineSummary({ exercises }) {
  return (
    <p className="fit-home__summary">
      {exercises.slice(0, 2).map((exercise) => <span key={exercise.id}>{exercise.name} {exercise.detail}</span>)}
      {exercises.length > 2 && <span>외 {exercises.length - 2}개</span>}
    </p>
  )
}

function TodayCard({ session, label, isToday, onExerciseChange }) {
  return (
    <div className="fit-home__card">
      <h3>{label} - {session.title}</h3>
      <p className="fit-home__when">
        {isToday ? '오늘' : session.day} {formatKoreanTime(session.time)} · {session.duration}분
      </p>
      <RoutineSummary exercises={session.exercises} />

      {isToday ? (
        <WorkoutChecklist session={session} onExerciseChange={onExerciseChange} />
      ) : (
        <Link className="fit-home__button" to={`/plan/${session.id}`}>운동 상세 보기</Link>
      )}
    </div>
  )
}

export default function HomePage() {
  const [today] = useState(() => new Date())
  const { data, error, loading, reload, setData } = useAsync(() => loadWeek(today), [today])
  const [name] = useState(() => readStorage('demo-profile', null)?.name?.trim() ?? '')
  const [message, setMessage] = useState('')

  const sessions = data?.sessions ?? []
  const life = data?.life ?? []
  const todayKey = dateKey(today)
  const yesterdayKey = dateKey(addDays(today, -1))

  const todaySessions = sessions.filter((session) => session.date === todayKey)
  const todaySession = todaySessions.find((session) => session.status !== '완료') ?? todaySessions[0]
  const nextSession = todaySession ?? sessions.find((session) => session.date > todayKey)
  const missed = !todaySession
    ? sessions.find((session) => session.date === yesterdayKey && session.status === '미수행')
    : null

  // 오늘 빈 시간: 어려운 시간 · 수업 · 오늘 일정을 피해요.
  const todayPeriods = [
    ...life
      .filter((item) => item.start_term.startsWith(todayKey))
      .map((item) => ({ startTime: item.start_term.slice(11, 16), endTime: item.end_term.slice(11, 16) })),
    ...todaySessions.map((session) => ({ startTime: session.time, endTime: session.endTime })),
  ]
  const freeSlots = missed
    ? getFreeSlots(getBusyPeriods(today, todayPeriods), missed.duration, today.getHours() * 60 + today.getMinutes() + 30)
    : []

  function updateExercise(sessionId, exerciseId, completed) {
    setData((previous) => ({ ...previous, sessions: withExerciseChecked(previous.sessions, sessionId, exerciseId, completed) }))
  }

  async function moveToToday(minutes) {
    const start = toTime(minutes)
    const end = toTime(minutes + missed.duration)

    try {
      await replaceSchedule(missed.id, { name: missed.name, start_term: `${todayKey}T${start}`, end_term: `${todayKey}T${end}` })
      setMessage(`${dayLabel(sessions, missed.id)}를 오늘 ${formatKoreanTime(start)}로 옮겼어요.`)
      reload()
    } catch (caught) {
      setMessage(caught.status === 409 ? conflictMessage(caught) : caught.message)
    }
  }

  let todayCard
  if (loading && !data) {
    todayCard = <div className="fit-home__card"><p className="fit-home__desc" role="status">운동 계획을 불러오는 중이에요...</p></div>
  } else if (error) {
    todayCard = (
      <div className="fit-home__card">
        <p className="fit-home__desc" role="alert">{error.message}</p>
        <button className="fit-home__button" type="button" onClick={reload}>다시 불러오기</button>
      </div>
    )
  } else if (sessions.length === 0) {
    todayCard = (
      <div className="fit-home__card">
        <h3>이번 주 운동 계획이 없어요</h3>
        <p className="fit-home__desc">AI가 캠퍼스 일정에 맞춰 이번 주 운동을 짜 드려요.</p>
        <Link className="fit-home__button" to="/plan/generate">맞춤 계획 만들기</Link>
      </div>
    )
  } else if (missed) {
    todayCard = (
      <div className="fit-home__card">
        <MissedWorkoutCard title="어제는 쉬어가셨네요," session={missed} label={dayLabel(sessions, missed.id)} slots={freeSlots} onMove={moveToToday} />
      </div>
    )
  } else if (nextSession) {
    todayCard = (
      <TodayCard
        key={nextSession.id}
        session={nextSession}
        label={dayLabel(sessions, nextSession.id)}
        isToday={nextSession.date === todayKey}
        onExerciseChange={updateExercise}
      />
    )
  } else {
    todayCard = (
      <div className="fit-home__card">
        <h3>이번 주 운동을 모두 마쳤어요</h3>
        <p className="fit-home__desc">다음 주 계획은 리포트에서 만들 수 있어요.</p>
        <Link className="fit-home__button" to="/report">리포트 보기</Link>
      </div>
    )
  }

  return (
    <div className="fit-home">
      <header className="fit-home__header">
        <p>{dateFormat.format(today)}</p>
        <h1>
          {name && <>{greeting(today.getHours())}, {name}님!<br /></>}
          오늘도 시작해볼까요?
        </h1>
      </header>

      <section aria-labelledby="today-plan">
        <h2 id="today-plan">{todaySession || missed || !nextSession ? "Today's Plan" : 'Next Plan'}</h2>
        {todayCard}
        <p className="fit-home__status" role="status">{message}</p>
      </section>

      {sessions.length > 0 && (
        <div className="fit-home__week">
          <WorkoutWeek sessions={sessions} today={today} />
        </div>
      )}

      <FitNavigation />
    </div>
  )
}
