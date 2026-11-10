import { useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router'
import { clearUpcomingWorkouts, loadWeek } from '../api/plan.js'
import { useAsync } from '../hooks/useAsync.js'
import { formatKoreanTime, parseDateKey } from '../workoutPlan.js'
import './PlanPage.css'

export default function PlanPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const week = searchParams.get('week')
  const { data, error, loading, reload } = useAsync(() => loadWeek(week ? parseDateKey(week) : new Date()), [week])
  const [message, setMessage] = useState('')
  const [isBusy, setIsBusy] = useState(false)

  // 방금 생성했다면 서버가 시간을 옮긴 내역과 주의사항을 보여줘요.
  const result = location.state?.result
  const adjusted = result?.adjusted ?? []
  const precaution = result?.plan?.precaution

  const sessions = data?.sessions ?? []
  const averageMinutes = sessions.length
    ? Math.round(sessions.reduce((total, session) => total + session.duration, 0) / sessions.length)
    : 0
  const generatePath = week ? `/plan/generate?week=${week}` : '/plan/generate'

  async function recommendAnother() {
    if (!window.confirm('아직 하지 않은 운동 일정을 지우고 새 계획을 만들까요?')) return

    setIsBusy(true)
    try {
      await clearUpcomingWorkouts(sessions)
      navigate(`${generatePath}${generatePath.includes('?') ? '&' : '?'}regenerate=1`, { replace: true })
    } catch (caught) {
      setMessage(caught.message)
      setIsBusy(false)
    }
  }

  return (
    <div className="fit-plan">
      <Link className="fit-plan__back" to="/">‹ 뒤로</Link>

      <header className="fit-plan__header">
        <h1>{week ? '다음주 운동 계획' : '이번주 운동 계획'}</h1>
        {sessions.length > 0 && <p>주 {sessions.length}회 · 회당 약 {averageMinutes}분</p>}
      </header>

      {loading && <p className="fit-plan__state" role="status">계획을 불러오는 중이에요...</p>}

      {error && (
        <div className="fit-plan__state" role="alert">
          <p>{error.message}</p>
          <button className="fit-plan__button" type="button" onClick={reload}>다시 불러오기</button>
        </div>
      )}

      {!loading && !error && sessions.length === 0 && (
        <div className="fit-plan__state">
          <p>아직 만든 운동 계획이 없어요.</p>
          <Link className="fit-plan__button" to={generatePath}>맞춤 계획 만들기</Link>
        </div>
      )}

      {adjusted.length > 0 && (
        <p className="fit-plan__notice">
          일정과 겹치는 {adjusted.length}개 운동의 시간을 조정했어요.
        </p>
      )}

      {sessions.length > 0 && (
        <>
          <ul className="fit-plan__sessions" aria-label="운동 일정">
            {sessions.map((session) => (
              <li key={session.id}>
                <Link className="fit-plan__session" to={`/plan/${session.id}`}>
                  <span>
                    <small>{session.day} · {formatKoreanTime(session.time)}</small>
                    <strong>{session.title}</strong>
                  </span>
                  <span className="fit-plan__duration">{session.duration}분 ›</span>
                </Link>
              </li>
            ))}
          </ul>

          <p className="fit-plan__hint">일정을 누르면 운동 종목과 세트를 확인할 수 있어요.</p>
          {precaution && <p className="fit-plan__precaution">{precaution}</p>}

          <div className="fit-plan__actions">
            <Link className="fit-plan__button" to="/">이 계획으로 시작하기</Link>
            <button className="fit-plan__button" type="button" onClick={recommendAnother} disabled={isBusy}>
              {isBusy ? '정리하는 중...' : '다른 계획 추천 받기'}
            </button>
          </div>
        </>
      )}

      <p className="fit-plan__message" role="status">{message}</p>
    </div>
  )
}
