import { useState } from 'react'
import { Link } from 'react-router'
import FitNavigation from '../components/FitNavigation.jsx'
import { createPlan, loadPlan, savePlan } from '../workoutPlan.js'
import { getUnavailableTimeLabel, loadUnavailablePeriod } from '../workoutAvailability.js'
import { exampleRoutines } from '../workoutRoutines.js'
import './PlanPage.css'

export default function PlanPage() {
  const [approvedPlan, setApprovedPlan] = useState(() => {
    const saved = loadPlan()
    return typeof saved?.approvedAt === 'string' ? saved : null
  })
  const [unavailablePeriod] = useState(loadUnavailablePeriod)
  const [message, setMessage] = useState('')

  const draftPlan = createPlan(unavailablePeriod)
  const { sessions } = approvedPlan ?? draftPlan
  const totalMinutes = sessions.reduce(
    (total, session) => total + session.duration,
    0
  )

  function approvePlan() {
    const plan = {
      ...draftPlan,
      approvedAt: new Date().toISOString(),
    }

    try {
      savePlan(plan)
      setApprovedPlan(plan)
      setMessage('맞춤 운동 계획을 승인하고 저장했어요.')
    } catch {
      setMessage('저장하지 못했어요. 다시 시도해 주세요.')
    }
  }

  return (
    <div className="fit-plan">
      <header className="fit-plan__header">
        <span className="fit-plan__eyebrow">{approvedPlan ? '승인한 계획' : '맞춤 계획'}</span>
        <h1>주간 운동 계획</h1>
        <p>주 {sessions.length}회 · 총 {totalMinutes}분</p>
        {!approvedPlan && unavailablePeriod && (
          <p className="fit-plan__notice">
            운동하기 어려운 시간({getUnavailableTimeLabel(unavailablePeriod)})을 피해서 구성했어요.
          </p>
        )}
      </header>

      <ul className="fit-plan__sessions" aria-label="운동 일정">
        {sessions.map((session) => (
          <li key={session.id}>
            <details className="fit-plan__session">
              <summary>
                <span>
                  <small>
                    {session.day} {session.time} · {session.duration}분
                    {session.adjusted && <span className="fit-plan__adjusted"> · 시간 조정됨</span>}
                  </small>
                  <strong>{session.title}</strong>
                </span>
                <span className="fit-plan__chevron" aria-hidden="true">›</span>
              </summary>

              <ul className="fit-plan__routine">
                {(exampleRoutines[session.id] ?? []).map((exercise) => (
                  <li key={exercise.id}>
                    <span>{exercise.name}</span>
                    <span>{exercise.sets}세트 × {exercise.reps}회</span>
                  </li>
                ))}
              </ul>
            </details>
          </li>
        ))}
      </ul>

      <p className="fit-plan__hint">운동 카드를 누르면 종목과 세트·횟수를 볼 수 있어요.</p>

      <div className="fit-plan__actions">
        {approvedPlan ? (
          <>
            <p className="fit-plan__approved">승인한 운동 계획이에요.</p>
            <Link className="fit-plan__button fit-plan__button--primary" to="/">
              홈에서 계획 보기
            </Link>
            <Link className="fit-plan__button" to="/workout">운동 기록하기</Link>
          </>
        ) : (
          <>
            <button className="fit-plan__button fit-plan__button--primary" type="button" onClick={approvePlan}>
              이 계획 승인하기
            </button>
            <Link className="fit-plan__button" to="/">홈으로 돌아가기</Link>
          </>
        )}
        <p className="fit-plan__message" role="status">{message}</p>
      </div>

      <FitNavigation />
    </div>
  )
}
