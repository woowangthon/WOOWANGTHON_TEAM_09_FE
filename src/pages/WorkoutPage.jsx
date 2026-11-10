import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { exampleRoutines } from '../workoutRoutines.js'

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
    <section>
      <h2>{session.title}</h2>
      <p>
        {session.day} {session.time} · {session.duration}분
      </p>
      <p>동작 확인용 예시 루틴입니다.</p>
      <p>완료: {completedCount} / {exercises.length}개</p>

      <ul>
        {exercises.map((exercise) => (
          <li key={exercise.id}>
            <label>
              <input
                type="checkbox"
                checked={exercise.completed}
                onChange={() => toggleExercise(exercise.id)}
              />
              {exercise.name} — {exercise.sets}세트 × {exercise.reps}회
            </label>
          </li>
        ))}
      </ul>

      <button type="button" onClick={saveWorkout}>
        운동 종료 및 저장
      </button>

      <p role="status">{message}</p>
      <p>다른 운동으로 이동하기 전에 저장해 주세요.</p>
    </section>
  )
}

export default function WorkoutPage() {
  const [plan] = useState(loadPlan)
  const [searchParams, setSearchParams] = useSearchParams()

  if (!plan) {
    return (
      <section>
        <h1>운동</h1>
        <p>먼저 운동 계획을 확인하고 승인해 주세요.</p>
        <Link to="/plan">운동 계획 확인하기</Link>
      </section>
    )
  }

  const selectedSession = plan.sessions.find(
    (session) => session.id === searchParams.get('session')
  ) ?? plan.sessions[0]

  return (
    <section>
      <h1>운동</h1>

      <label>
        운동 선택{' '}
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

      {selectedSession && (
        <WorkoutSession
          key={`${plan.id}:${selectedSession.id}`}
          planId={plan.id}
          session={selectedSession}
        />
      )}
    </section>
  )
}