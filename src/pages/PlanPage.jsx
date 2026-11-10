import { useState } from 'react'
import { Link } from 'react-router'
import FitNavigation from '../components/FitNavigation.jsx'
import { loadPlan } from '../workoutPlan.js'
import { exampleRoutines } from '../workoutRoutines.js'
import './PlanPage.css'

const STORAGE_KEY = 'demo-approved-plan'

const examplePlan = {
  id: 'demo-weekly-plan-1',
  sessions: [
    {
      id: 'session-1',
      day: '월요일',
      time: '17:00',
      duration: 40,
      title: '상체 운동',
    },
    {
      id: 'session-2',
      day: '수요일',
      time: '18:00',
      duration: 40,
      title: '하체 운동',
    },
    {
      id: 'session-3',
      day: '금요일',
      time: '16:00',
      duration: 30,
      title: '전신 운동',
    },
  ],
}

export default function PlanPage() {
  const [approvedPlan, setApprovedPlan] = useState(() => {
    const saved = loadPlan()
    return typeof saved?.approvedAt === 'string' ? saved : null
  })
  const [message, setMessage] = useState('')

  const { sessions } = approvedPlan ?? examplePlan
  const totalMinutes = sessions.reduce(
    (total, session) => total + session.duration,
    0
  )

  function approvePlan() {
    const plan = {
      ...examplePlan,
      approvedAt: new Date().toISOString(),
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(plan))
      setApprovedPlan(plan)
      setMessage('예시 운동 계획을 승인하고 저장했어요.')
    } catch {
      setMessage('저장하지 못했어요. 다시 시도해 주세요.')
    }
  }

  return (
    <div className="fit-plan">
      <header className="fit-plan__header">
        <span className="fit-plan__eyebrow">예시 계획</span>
        <h1>주간 운동 계획</h1>
        <p>주 {sessions.length}회 · 총 {totalMinutes}분</p>
      </header>

      <ul className="fit-plan__sessions" aria-label="운동 일정">
        {sessions.map((session) => (
          <li key={session.id}>
            <details className="fit-plan__session">
              <summary>
                <span>
                  <small>{session.day} {session.time} · {session.duration}분</small>
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
            <p className="fit-plan__approved">승인한 예시 계획이에요.</p>
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
