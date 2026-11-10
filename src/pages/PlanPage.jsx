import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { createDraftPlan, loadBlockedPeriods, loadCurrentPlan, loadPlanVariant, savePlanVariant } from '../planDraft.js'
import { formatKoreanTime, savePlan } from '../workoutPlan.js'
import './PlanPage.css'

export default function PlanPage() {
  const navigate = useNavigate()
  const [{ plan, isApproved }, setCurrent] = useState(loadCurrentPlan)
  const [hasBlocks] = useState(() => loadBlockedPeriods().length > 0)
  const [message, setMessage] = useState('')

  const { sessions } = plan
  const averageMinutes = Math.round(sessions.reduce((total, session) => total + session.duration, 0) / sessions.length)
  const adjustedCount = sessions.filter((session) => session.adjusted).length

  function startPlan() {
    try {
      savePlan({ ...plan, approvedAt: new Date().toISOString() })
    } catch {
      setMessage('저장하지 못했어요. 다시 시도해 주세요.')
      return
    }

    navigate('/')
  }

  function recommendAnother() {
    const variant = loadPlanVariant() + 1

    try {
      savePlanVariant(variant)
    } catch {
      // 저장하지 못해도 이번 화면에서는 새 계획을 보여줘요.
    }

    setCurrent({ plan: createDraftPlan(variant), isApproved: false })
    setMessage('다른 운동 계획을 추천했어요.')
  }

  return (
    <div className="fit-plan">
      <Link className="fit-plan__back" to="/">‹ 뒤로</Link>

      <header className="fit-plan__header">
        <h1>이번주 운동 계획</h1>
        <p>주 {sessions.length}회 · 회당 약 {averageMinutes}분</p>
      </header>

      {!isApproved && hasBlocks && adjustedCount > 0 && (
        <p className="fit-plan__notice">
          수업·운동하기 어려운 시간을 피해 {adjustedCount}개 운동의 시간을 조정했어요.
        </p>
      )}

      <ul className="fit-plan__sessions" aria-label="운동 일정">
        {sessions.map((session) => (
          <li key={session.id}>
            <Link className="fit-plan__session" to={`/plan/${session.id}`}>
              <span>
                <small>
                  {session.day} · {formatKoreanTime(session.time)}
                  {session.adjusted && !isApproved && <span className="fit-plan__adjusted"> · 시간 조정됨</span>}
                </small>
                <strong>{session.title}</strong>
              </span>
              <span className="fit-plan__duration">{session.duration}분 ›</span>
            </Link>
          </li>
        ))}
      </ul>

      <p className="fit-plan__hint">일정을 누르면 운동 종목과 세트를 확인할 수 있어요.</p>

      <div className="fit-plan__actions">
        {isApproved ? (
          <>
            <p className="fit-plan__approved">진행 중인 운동 계획이에요.</p>
            <Link className="fit-plan__button" to="/">홈으로 가기</Link>
          </>
        ) : (
          <>
            <button className="fit-plan__button" type="button" onClick={startPlan}>이 계획으로 시작하기</button>
            <button className="fit-plan__button" type="button" onClick={recommendAnother}>다른 계획 추천 받기</button>
          </>
        )}
        <p className="fit-plan__message" role="status">{message}</p>
      </div>
    </div>
  )
}
