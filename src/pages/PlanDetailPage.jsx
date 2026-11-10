import { useState } from 'react'
import { Link, useParams } from 'react-router'
import ExerciseIcon from '../components/ExerciseIcon.jsx'
import { loadCurrentPlan } from '../planDraft.js'
import { readStorage } from '../workoutPlan.js'
import { exampleRoutines } from '../workoutRoutines.js'
import './PlanPage.css'

const levelLabels = {
  beginner: '초보자 루틴',
  intermediate: '중급자 루틴',
  advanced: '숙련자 루틴',
}

export default function PlanDetailPage() {
  const { sessionId } = useParams()
  const [{ plan }] = useState(loadCurrentPlan)
  const [level] = useState(() => levelLabels[readStorage('demo-profile', null)?.experience] ?? '기본 루틴')

  const session = plan.sessions.find((item) => item.id === sessionId)
  const routine = exampleRoutines[sessionId] ?? []

  if (!session) {
    return (
      <div className="fit-plan">
        <Link className="fit-plan__back" to="/plan">‹ 이번 주 운동 계획</Link>
        <h1>운동을 찾을 수 없어요</h1>
      </div>
    )
  }

  return (
    <div className="fit-plan">
      <Link className="fit-plan__back" to="/plan">‹ 이번 주 운동 계획</Link>

      <header className="fit-plan__header">
        <h1>{session.day} {session.title}</h1>
        <p>약 {session.duration}분 · {level}</p>
      </header>

      <ul className="fit-plan__exercises" aria-label="운동 종목">
        {routine.map((exercise) => (
          <li key={exercise.id}>
            <ExerciseIcon type={exercise.icon} />
            <span>
              <strong>{exercise.name}</strong>
              <small>{exercise.part} · {exercise.sets}세트 x {exercise.reps}회</small>
            </span>
          </li>
        ))}
      </ul>

      <div className="fit-plan__actions fit-plan__actions--bottom">
        <Link className="fit-plan__button" to="/plan">이전으로</Link>
      </div>
    </div>
  )
}
