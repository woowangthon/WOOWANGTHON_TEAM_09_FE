import { useState } from 'react'
import { Link } from 'react-router'
import ExerciseIcon from '../components/ExerciseIcon.jsx'
import MissedWorkoutCard from '../components/MissedWorkoutCard.jsx'
import FitNavigation from '../components/FitNavigation.jsx'
import WorkoutWeek from '../components/WorkoutWeek.jsx'
import { feedbackReasons, loadFeedback, saveFeedback } from '../feedback.js'
import { getBusyPeriods, getFreeSlots, toTime } from '../freeTime.js'
import {
  formatKoreanTime,
  getDayLabel,
  getPlanSessions,
  loadPlan,
  loadRecords,
  moveSession,
  readStorage,
  savePlan,
  saveSessionRecord,
  weekdays,
} from '../workoutPlan.js'
import { exampleRoutines, getRoutineTitle } from '../workoutRoutines.js'
import './HomePage.css'

const dateFormat = new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' })

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function greeting(hour) {
  if (hour >= 5 && hour < 12) return '좋은 아침이에요'
  if (hour >= 12 && hour < 18) return '좋은 오후예요'
  return '좋은 저녁이에요'
}

function loadApprovedPlan() {
  const plan = loadPlan()
  return typeof plan?.approvedAt === 'string' ? plan : null
}

// 이번 주에서 그 운동이 있는 날짜
function sessionDate(session, today) {
  const index = weekdays.findIndex((day) => `${day}요일` === session.day)
  return new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay() + index)
}

function exerciseLine(exercise) {
  return `${exercise.name} ${exercise.sets}세트 x ${exercise.reps}`
}

function RoutineSummary({ routine }) {
  return (
    <p className="fit-home__summary">
      {routine.slice(0, 2).map((exercise) => <span key={exercise.id}>{exerciseLine(exercise)}</span>)}
      {routine.length > 2 && <span>외 {routine.length - 2}개</span>}
    </p>
  )
}

function TodayCard({ plan, session, label, isToday, onRecordSaved }) {
  const routine = exampleRoutines[session.id] ?? []
  const [isOpen, setIsOpen] = useState(false)
  const [completedIds, setCompletedIds] = useState(() => session.record?.completedIds ?? [])
  const [message, setMessage] = useState('')

  function toggle(exercise) {
    const nextIds = completedIds.includes(exercise.id)
      ? completedIds.filter((id) => id !== exercise.id)
      : [...completedIds, exercise.id]
    const exercises = routine.map((item) => ({ ...item, completed: nextIds.includes(item.id) }))

    try {
      saveSessionRecord(plan.id, session, exercises)
      setCompletedIds(nextIds)
      setMessage(nextIds.length === routine.length ? '오늘 운동을 모두 완료했어요!' : `${nextIds.length}/${routine.length} 종목 완료`)
      onRecordSaved()
    } catch {
      setMessage('기록을 저장하지 못했어요. 다시 시도해 주세요.')
    }
  }

  return (
    <div className="fit-home__card">
      <h3>{label} - {getRoutineTitle(session)}</h3>
      <p className="fit-home__when">
        {isToday ? '오늘' : session.day} {formatKoreanTime(session.time)} · {session.duration}분
      </p>
      <RoutineSummary routine={routine} />

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
          {routine.map((exercise) => {
            const done = completedIds.includes(exercise.id)

            return (
              <li key={exercise.id}>
                <button type="button" className="fit-home__exercise" aria-pressed={done} onClick={() => toggle(exercise)}>
                  <ExerciseIcon type={exercise.icon} />
                  <span>
                    <strong>{exercise.name}</strong>
                    <small>{exercise.part} · {exercise.sets}세트 x {exercise.reps}회</small>
                  </span>
                  <span className="fit-home__check" aria-hidden="true" />
                </button>
              </li>
            )
          })}
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
  const [plan, setPlan] = useState(loadApprovedPlan)
  const [records, setRecords] = useState(loadRecords)
  const [feedback, setFeedback] = useState(loadFeedback)
  const [submittedKey, setSubmittedKey] = useState('')
  const [name] = useState(() => readStorage('demo-profile', null)?.name?.trim() ?? '')
  const [message, setMessage] = useState('')

  const sessions = getPlanSessions(plan, records)
  const labelOf = (session) => getDayLabel(plan, session.id)
  const todayStart = startOfDay(today)
  const yesterday = new Date(todayStart.getFullYear(), todayStart.getMonth(), todayStart.getDate() - 1)
  const approvedStart = plan ? startOfDay(new Date(plan.approvedAt)) : null

  // 승인 이후 이번 주에 지나간 운동 중 완료하지 못한 것
  const pastUnfinished = sessions
    .map((session) => ({ session, date: sessionDate(session, today) }))
    .filter(({ session, date }) => date < todayStart && date >= approvedStart && session.status !== '완료')
    .sort((a, b) => b.date - a.date)

  const todaySession = sessions.find((session) => session.day === `${weekdays[today.getDay()]}요일`)
  const nextSession = todaySession ?? [1, 2, 3, 4, 5, 6]
    .map((offset) => sessions.find((session) => session.day === `${weekdays[(today.getDay() + offset) % 7]}요일`))
    .find(Boolean)

  const missed = !todaySession
    ? pastUnfinished.find(({ session, date }) =>
        date.getTime() === yesterday.getTime() && ['기록 없음', '미수행'].includes(session.status)
      )?.session
    : null

  const freeSlots = missed
    ? getFreeSlots(getBusyPeriods(today), missed.duration, today.getHours() * 60 + today.getMinutes() + 30)
    : []

  const feedbackTarget = pastUnfinished.find(({ session }) => !feedback[`${plan.id}:${session.id}`])?.session

  function moveToToday(minutes) {
    const updated = moveSession(plan, missed.id, `${weekdays[today.getDay()]}요일`, toTime(minutes))

    try {
      savePlan(updated)
      setPlan(updated)
      setMessage(`${labelOf(missed)}를 오늘 ${formatKoreanTime(toTime(minutes))}로 옮겼어요.`)
    } catch {
      setMessage('운동 시간을 바꾸지 못했어요. 다시 시도해 주세요.')
    }
  }

  function submitFeedback(reason) {
    try {
      setFeedback(saveFeedback(plan.id, feedbackTarget.id, reason))
      setSubmittedKey(feedbackTarget.id)
    } catch {
      setMessage('피드백을 저장하지 못했어요. 다시 시도해 주세요.')
    }
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
        <h2 id="today-plan">{missed || todaySession || !nextSession ? "Today's Plan" : 'Next Plan'}</h2>

        {!plan ? (
          <div className="fit-home__card">
            <h3>시작한 운동 계획이 없어요</h3>
            <p className="fit-home__desc">맞춤 운동 계획을 확인하고 시작해 보세요.</p>
            <Link className="fit-home__button" to="/plan">운동 계획 확인하기</Link>
          </div>
        ) : missed ? (
          <div className="fit-home__card">
            <MissedWorkoutCard title="어제는 쉬어가셨네요," session={missed} label={labelOf(missed)} slots={freeSlots} onMove={moveToToday} />
          </div>
        ) : nextSession ? (
          <TodayCard
            key={`${nextSession.id}-${nextSession.day}`}
            plan={plan}
            session={nextSession}
            label={labelOf(nextSession)}
            isToday={nextSession === todaySession}
            onRecordSaved={() => setRecords(loadRecords())}
          />
        ) : null}

        <p className="fit-home__status" role="status">{message}</p>
      </section>

      {plan && (
        <Link className="fit-home__week" to="/report" aria-label="주간 운동 리포트 보기">
          <WorkoutWeek sessions={sessions} pastDays={today.getDay()} />
        </Link>
      )}

      {plan && feedbackTarget && !submittedKey && (
        <FeedbackCard key={feedbackTarget.id} onSubmit={submitFeedback} />
      )}

      {submittedKey && (
        <div className="fit-home__card fit-home__feedback">
          <p className="fit-home__feedback-title">계획한 운동을 모두 완료하지 못한<br />이유가 있나요?</p>
          <p className="fit-home__done" role="status">피드백 완료</p>
        </div>
      )}

      <FitNavigation />
    </div>
  )
}
