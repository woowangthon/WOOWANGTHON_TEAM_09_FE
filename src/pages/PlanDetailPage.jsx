import { Link, useParams } from 'react-router'
import { loadSession } from '../api/plan.js'
import ExerciseIcon from '../components/ExerciseIcon.jsx'
import { useAsync } from '../hooks/useAsync.js'
import { readStorage } from '../workoutPlan.js'
import './PlanPage.css'

const levelLabels = {
  beginner: '초보자 루틴',
  intermediate: '중급자 루틴',
  advanced: '숙련자 루틴',
}

export default function PlanDetailPage() {
  const { sessionId } = useParams()
  const { data: session, error, loading } = useAsync(() => loadSession(sessionId), [sessionId])
  const level = levelLabels[readStorage('demo-profile', null)?.experience] ?? '맞춤 루틴'

  return (
    <div className="fit-plan">
      <Link className="fit-plan__back" to="/plan">‹ 이번 주 운동 계획</Link>

      {loading && <p className="fit-plan__state" role="status">운동을 불러오는 중이에요...</p>}
      {error && <p className="fit-plan__state" role="alert">{error.status === 404 ? '운동을 찾을 수 없어요.' : error.message}</p>}

      {session && (
        <>
          <header className="fit-plan__header">
            <h1>{session.day} {session.title}</h1>
            <p>약 {session.duration}분 · {level}</p>
          </header>

          <ul className="fit-plan__exercises" aria-label="운동 종목">
            {session.exercises.map((exercise) => (
              <li key={exercise.id}>
                <ExerciseIcon name={exercise.name} />
                <span>
                  <strong>{exercise.name}</strong>
                  <small>{exercise.detail}</small>
                </span>
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="fit-plan__actions">
        <Link className="fit-plan__button" to="/plan">이전으로</Link>
      </div>
    </div>
  )
}
