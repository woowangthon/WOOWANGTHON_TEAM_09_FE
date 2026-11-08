import { useState } from 'react'

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

function loadApprovedPlan() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))

    if (
      saved?.id === examplePlan.id &&
      typeof saved.approvedAt === 'string' &&
      Array.isArray(saved.sessions)
    ) {
      return saved
    }

    return null
  } catch {
    return null
  }
}

export default function PlanPage() {
  const [approvedPlan, setApprovedPlan] = useState(loadApprovedPlan)
  const [message, setMessage] = useState('')

  const totalMinutes = examplePlan.sessions.reduce(
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
    <section>
      <h1>주간 운동 계획</h1>
      <p>화면 동작 확인을 위한 예시 계획입니다.</p>

      <p>
        주 {examplePlan.sessions.length}회 · 총 {totalMinutes}분
      </p>

      <ul>
        {examplePlan.sessions.map((session) => (
          <li key={session.id}>
            <h2>{session.day} · {session.title}</h2>
            <p>
              {session.time} 시작 · {session.duration}분
            </p>
          </li>
        ))}
      </ul>

      {approvedPlan ? (
        <p>승인한 예시 계획이에요.</p>
      ) : (
        <button type="button" onClick={approvePlan}>
          이 계획 승인하기
        </button>
      )}

      <p role="status">{message}</p>
    </section>
  )
}