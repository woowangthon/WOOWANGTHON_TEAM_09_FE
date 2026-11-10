import { useState } from 'react'
import { Link } from 'react-router'
import FitNavigation from '../components/FitNavigation.jsx'
import WorkoutWeek from '../components/WorkoutWeek.jsx'
import { getPlanProgress, getPlanSessions, loadPlan, loadRecords } from '../workoutPlan.js'
import './ReportPage.css'

const dateFormat = new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium' })

function getWeekLabel(approvedAt) {
  if (typeof approvedAt !== 'string') return '승인한 운동 계획 기준'

  const approvedDate = new Date(approvedAt)
  if (Number.isNaN(approvedDate.getTime())) return '승인한 운동 계획 기준'

  const year = approvedDate.getFullYear()
  const month = approvedDate.getMonth()
  const firstDay = approvedDate.getDate() - approvedDate.getDay()
  const start = new Date(year, month, firstDay)
  const end = new Date(year, month, firstDay + 6)

  return dateFormat.formatRange(start, end)
}

export default function ReportPage() {
  const [plan] = useState(loadPlan)
  const [records] = useState(loadRecords)
  const sessions = getPlanSessions(plan, records)
  const progress = getPlanProgress(sessions)
  const stats = [
    ['완료', progress.completed],
    ['부분 완료', progress.partial],
    ['미수행', progress.missed],
    ['기록 없음', progress.unrecorded],
  ]

  return (
    <div className="fit-report">
      <header className="fit-report__header">
        <Link to="/">‹ 홈</Link>
        <h1>주간 운동 리포트</h1>
        {plan && <p>{getWeekLabel(plan.approvedAt)}</p>}
      </header>

      {plan ? (
        <>
          <section className="fit-report__card">
            <h2>운동 수행률</h2>
            <p className="fit-report__rate">
              <strong>{progress.rate}%</strong>
              <span>계획 {sessions.length}회 중 {progress.completed}회 완료</span>
            </p>
            <progress aria-label="운동 수행률" value={progress.rate} max={100} />
            <dl className="fit-report__stats">
              {stats.map(([label, count]) => (
                <div key={label}><dt>{label}</dt><dd>{count}회</dd></div>
              ))}
            </dl>
            <p className="fit-report__muted">모든 종목을 완료한 운동을 수행률에 반영해요.</p>
          </section>

          <section className="fit-report__card fit-report__week" aria-label="요일별 진행">
            <WorkoutWeek sessions={sessions} />
          </section>

          <section className="fit-report__card">
            <h2>운동별 기록</h2>
            <ul className="fit-report__sessions">
              {sessions.map((session) => (
                <li key={session.id}>
                  <Link to={`/workout?session=${encodeURIComponent(session.id)}`}>
                    <span>
                      <strong>{session.title}</strong>
                      <small>{session.day} {session.time} · {session.duration}분</small>
                    </span>
                    <span className="fit-report__badge" data-status={session.status}>{session.status}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </>
      ) : (
        <section className="fit-report__card">
          <h2>승인한 운동 계획이 없어요</h2>
          <p className="fit-report__muted">운동 계획을 승인하면 리포트를 볼 수 있어요.</p>
          <Link className="fit-report__plan-link" to="/plan">운동 계획 확인하기</Link>
        </section>
      )}

      <FitNavigation />
    </div>
  )
}
