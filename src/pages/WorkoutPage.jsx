import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { exampleRoutines } from '../workoutRoutines.js'
import FitNavigation from '../components/FitNavigation.jsx'
import './WorkoutPage.css'

const RECORDS_KEY = 'demo-session-records'

function loadPlan() {
  try {
    const plan = JSON.parse(
      localStorage.getItem('demo-approved-plan')
    )

    if (
      plan?.id !== 'demo-weekly-plan-1' ||
      !Array.isArray(plan.sessions) ||
      plan.sessions.length === 0 ||
      !plan.sessions.every(
        (session) =>
          session &&
          Object.hasOwn(exampleRoutines, session.id) &&
          typeof session.day === 'string' &&
          typeof session.title === 'string' &&
          typeof session.time === 'string' &&
          Number.isFinite(session.duration)
      )
    ) {
      return null
    }

    return plan
  } catch {
    return null
  }
}

function readRecords() {
  const saved = localStorage.getItem(RECORDS_KEY)

  if (!saved) return {}

  const records = JSON.parse(saved)

  if (!records || typeof records !== 'object' || Array.isArray(records)) {
    throw new Error('운동 기록 형식 오류')
  }

  return records
}

function loadExercises(recordKey, routine) {
  try {
    const record = readRecords()[recordKey]
    const completedIds = Array.isArray(record?.completedIds)
      ? record.completedIds
      : []

    return routine.map((exercise) => ({
      ...exercise,
      completed: completedIds.includes(exercise.id),
    }))
  } catch {
    return routine.map((exercise) => ({
      ...exercise,
      completed: false,
    }))
  }
}

function WorkoutSession({ planId, session }) {
  const recordKey = `${planId}:${session.id}`
  const routine = exampleRoutines[session.id]

  const [exercises, setExercises] = useState(() =>
    loadExercises(recordKey, routine)
  )
  const [message, setMessage] = useState('')

  const completedCount = exercises.filter(
    (exercise) => exercise.completed
  ).length

  function toggleExercise(id) {
    setExercises((previous) =>
      previous.map((exercise) =>
        exercise.id === id
          ? { ...exercise, completed: !exercise.completed }
          : exercise
      )
    )

    setMessage('')
  }

  function saveWorkout() {
    const status =
      completedCount === exercises.length
        ? '완료'
        : completedCount > 0
          ? '부분 완료'
          : '미수행'

    const record = {
      planId,
      sessionId: session.id,
      title: session.title,
      status,
      completedIds: exercises
        .filter((exercise) => exercise.completed)
        .map((exercise) => exercise.id),
      exercises,
      savedAt: new Date().toISOString(),
    }

    try {
      const records = readRecords()

      localStorage.setItem(
        RECORDS_KEY,
        JSON.stringify({
          ...records,
          [recordKey]: record,
        })
      )

      setMessage(`${session.day} 운동을 ${status} 상태로 저장했어요.`)
    } catch {
      setMessage('기록을 읽거나 저장하지 못했어요. 다시 시도해 주세요.')
    }
  }

  return (
    <section aria-labelledby="workout-session-title">
      <div className="fit-workout__card fit-workout__overview">
        <p>{session.day} {session.time} · {session.duration}분</p>
        <h2 id="workout-session-title">{session.title}</h2>
        <div className="fit-workout__progress">
          <label htmlFor="workout-progress">완료한 종목</label>
          <strong>{completedCount} / {exercises.length}</strong>
        </div>
        <progress id="workout-progress" value={completedCount} max={exercises.length} />
      </div>

      <h3 className="fit-workout__list-title">운동 종목</h3>
      <ul className="fit-workout__exercises">
        {exercises.map((exercise, index) => (
          <li key={exercise.id}>
            <label className="fit-workout__card fit-workout__exercise" data-completed={exercise.completed}>
              <span className="fit-workout__number" aria-hidden="true">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="fit-workout__exercise-info">
                <strong>{exercise.name}</strong>
                <small>{exercise.sets}세트 × {exercise.reps}회</small>
              </span>
              <input
                type="checkbox"
                checked={exercise.completed}
                onChange={() => toggleExercise(exercise.id)}
              />
            </label>
          </li>
        ))}
      </ul>

      <button className="fit-workout__action" type="button" onClick={saveWorkout}>
        운동 종료 및 저장
      </button>

      <p className="fit-workout__message" role="status">{message}</p>
      <p className="fit-workout__note">다른 운동으로 이동하기 전에 저장해 주세요.</p>
    </section>
  )
}

export default function WorkoutPage() {
  const [plan] = useState(loadPlan)
  const [searchParams, setSearchParams] = useSearchParams()

  const selectedSession = plan?.sessions.find(
    (session) => session.id === searchParams.get('session')
  ) ?? plan?.sessions[0]

  return (
    <div className="fit-workout">
      <h1>운동 기록</h1>

      {selectedSession ? (
        <>
          <label className="fit-workout__select">
            운동 선택
            <select
              value={selectedSession.id}
              onChange={(event) => setSearchParams({ session: event.target.value }, { replace: true })}
            >
              {plan.sessions.map((session) => (
                <option key={session.id} value={session.id}>
                  {session.day} · {session.title}
                </option>
              ))}
            </select>
          </label>

          <WorkoutSession
            key={`${plan.id}:${selectedSession.id}`}
            planId={plan.id}
            session={selectedSession}
          />
        </>
      ) : (
        <section className="fit-workout__card fit-workout__overview">
          <h2>승인한 운동 계획이 없어요</h2>
          <p>먼저 운동 계획을 확인하고 승인해 주세요.</p>
          <Link className="fit-workout__action" to="/plan">운동 계획 확인하기</Link>
        </section>
      )}

      <FitNavigation />
    </div>
  )
}
