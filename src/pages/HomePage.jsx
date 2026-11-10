import { useState } from 'react'
import { Link } from 'react-router'
import { dayLabel, loadWeek } from '../api/plan.js'
import { conflictMessage, replaceSchedule, setExerciseCompleted } from '../api/schedule.js'
import ExerciseIcon from '../components/ExerciseIcon.jsx'
import FitNavigation from '../components/FitNavigation.jsx'
import MissedWorkoutCard from '../components/MissedWorkoutCard.jsx'
import WorkoutWeek from '../components/WorkoutWeek.jsx'
import { feedbackReasons, loadFeedback, saveFeedback } from '../feedback.js'
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

function sessionStatus(exercises) {
  const completedCount = exercises.filter((exercise) => exercise.completed).length
  if (exercises.length > 0 && completedCount === exercises.length) return { completedCount, status: '완료' }
  return { completedCount, status: completedCount > 0 ? '부분 완료' : '기록 없음' }
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
  const [isOpen, setIsOpen] = useState(false)
  const [savingId, setSavingId] = useState(null)
  const [message, setMessage] = useState('')
  const total = session.exercises.length

  async function toggle(exercise) {
    setSavingId(exercise.id)
    try {
      await setExerciseCompleted(exercise.id, !exercise.completed)
      const done = session.completedCount + (exercise.completed ? -1 : 1)
      onExerciseChange(session.id, exercise.id, !exercise.completed)
      setMessage(done === total ? '오늘 운동을 모두 완료했어요!' : `${done}/${total} 종목 완료`)
    } catch (error) {
      setMessage(error.message)
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div className="fit-home__card">
      <h3>{label} - {session.title}</h3>
      <p className="fit-home__when">
        {isToday ? '오늘' : session.day} {formatKoreanTime(session.time)} · {session.duration}분
      </p>
      <RoutineSummary exercises={session.exercises} />

      {isToday ? (
        <button
          className={`fit-home__button${isOpen ? ' fit-home__button--outline' : ''}`}
          type="button"
          aria-expanded={isOpen}
          onClick={() => setIsOpen((open) => !open)}
        >
          {isOpen ? '접기' : '운동 완료 기록'}
        </button>
      ) : (
        <Link className="fit-home__button" to={`/plan/${session.id}`}>운동 상세 보기</Link>
      )}

      {isOpen && (
        <ul className="fit-home__exercises" aria-label="운동 종목 체크">
          {session.exercises.map((exercise) => (
            <li key={exercise.id}>
              <button
                type="button"
                className="fit-home__exercise"
                aria-pressed={exercise.completed}
                disabled={savingId === exercise.id}
                onClick={() => toggle(exercise)}
              >
                <ExerciseIcon name={exercise.name} />
                <span>
                  <strong>{exercise.name}</strong>
                  <small>{exercise.detail}</small>
                </span>
                <span className="fit-home__check" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="fit-home__status" role="status">{message}</p>
    </div>
  )
}

function FeedbackCard({ onSubmit }) {
  const [reason, setReason] = useState('')

  return (
    <form
      className="fit-home__card fit-home__feedback"
      onSubmit={(event) => {
        event.preventDefault()
        if (reason) onSubmit(reason)
      }}
    >
      <fieldset>
        <legend>계획한 운동을 모두 완료하지 못한<br />이유가 있나요?</legend>
        {feedbackReasons.map((item) => (
          <label key={item.value}>
            <input type="radio" name="feedback" value={item.value} checked={reason === item.value} onChange={() => setReason(item.value)} />
            <span>{item.label}</span>
          </label>
        ))}
      </fieldset>
      <button className="fit-home__mint" type="submit" disabled={!reason}>피드백 완료</button>
    </form>
  )
}

export default function HomePage() {
  const [today] = useState(() => new Date())
  const { data, error, loading, reload, setData } = useAsync(() => loadWeek(today), [today])
  const [feedback, setFeedback] = useState(loadFeedback)
  const [submittedId, setSubmittedId] = useState(null)
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
  const feedbackTarget = [...sessions]
    .reverse()
    .find((session) => session.date < todayKey && session.status !== '완료' && !feedback[session.id])

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
    setData((previous) => ({
      ...previous,
      sessions: previous.sessions.map((session) => {
        if (session.id !== sessionId) return session
        const exercises = session.exercises.map((exercise) => (exercise.id === exerciseId ? { ...exercise, completed } : exercise))
        return { ...session, exercises, ...sessionStatus(exercises) }
      }),
    }))
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

  function submitFeedback(reason) {
    try {
      setFeedback(saveFeedback(feedbackTarget.id, reason))
      setSubmittedId(feedbackTarget.id)
    } catch {
      setMessage('피드백을 저장하지 못했어요. 다시 시도해 주세요.')
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
        <Link className="fit-home__week" to="/report" aria-label="주간 운동 리포트 보기">
          <WorkoutWeek sessions={sessions} today={today} />
        </Link>
      )}

      {feedbackTarget && !submittedId && <FeedbackCard key={feedbackTarget.id} onSubmit={submitFeedback} />}

      {submittedId && (
        <div className="fit-home__card fit-home__feedback">
          <p className="fit-home__feedback-title">계획한 운동을 모두 완료하지 못한<br />이유가 있나요?</p>
          <p className="fit-home__done" role="status">피드백 완료</p>
        </div>
      )}

      <FitNavigation />
    </div>
  )
}
