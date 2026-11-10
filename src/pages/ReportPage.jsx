import { useState } from 'react'
import { Link } from 'react-router'
import FitNavigation from '../components/FitNavigation.jsx'
import WorkoutWeek from '../components/WorkoutWeek.jsx'
import { feedbackReasons, loadFeedback } from '../feedback.js'
import { createDraftPlan } from '../planDraft.js'
import { formatKoreanTime, getPlanProgress, getPlanSessions, loadPlan, loadRecords, weekdays } from '../workoutPlan.js'
import './ReportPage.css'

const dateFormat = new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' })
const reasonLabels = Object.fromEntries(feedbackReasons.map((item) => [item.value, item.label]))

// 이번 주에서 이미 지난 요일의 기록 없는 운동은 미수행으로 표시해요.
function statusText(session, today) {
  if (session.status !== '기록 없음') return session.status
  return weekdays.findIndex((day) => `${day}요일` === session.day) < today.getDay() ? '미수행' : '예정'
}

function loadApprovedPlan() {
  const plan = loadPlan()
  return typeof plan?.approvedAt === 'string' ? plan : null
}

export default function ReportPage() {
  const [today] = useState(() => new Date())
  const [plan] = useState(loadApprovedPlan)
  const [records] = useState(loadRecords)
  const [feedback] = useState(loadFeedback)
  const [nextPlan] = useState(() => createDraftPlan())

  const sessions = getPlanSessions(plan, records)
  const progress = getPlanProgress(sessions)
  const feedbackItems = plan
    ? sessions
        .map((session) => ({ session, reason: feedback[`${plan.id}:${session.id}`]?.reason }))
        .filter((item) => reasonLabels[item.reason])
    : []

  return (
    <div className="fit-report">
      <header className="fit-report__header">
        <p>{dateFormat.format(today)}</p>
        <h1>이번 주도 수고했어요</h1>
      </header>

      {plan ? (
        <>
          <section className="fit-report__card" aria-labelledby="report-rate">
            <h2 id="report-rate">이번 주 운동 수행률</h2>
            <p className="fit-report__rate">
              <strong>{progress.rate}%</strong>
              <span>{sessions.length}회 중 {progress.completed}회 완료</span>
            </p>
            <div
              className="fit-report__bar"
              role="progressbar"
              aria-label="이번 주 운동 수행률"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress.rate}
            >
              <span style={{ width: `${progress.rate}%` }} />
            </div>
            <p className="fit-report__sessions">
              {sessions.map((session) => `${session.day} ${statusText(session, today)}`).join(' · ')}
            </p>

            <h2 className="fit-report__feedback-title">이번 주 피드백</h2>
            {feedbackItems.length ? (
              <ul className="fit-report__feedback">
                {feedbackItems.map(({ session, reason }) => (
                  <li key={session.id}>
                    <span>{session.day} 운동 {session.status === '부분 완료' ? '부분 완료' : '미수행'} 사유</span>
                    <small>{reasonLabels[reason]}</small>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="fit-report__empty">아직 남긴 피드백이 없어요.</p>
            )}
          </section>

          <section className="fit-report__next" aria-labelledby="report-next">
            <h2 id="report-next">다음 주 AI 운동 추천 계획</h2>
            <p className="fit-report__empty">수업과 운동하기 어려운 시간을 반영한 추천 예시예요.</p>
            <ul>
              {nextPlan.sessions.map((session) => (
                <li key={session.id}>
                  <Link to={`/plan/${session.id}`}>
                    <span>
                      <small>{session.day} · {formatKoreanTime(session.time)}</small>
                      <strong>{session.title}</strong>
                    </span>
                    <span className="fit-report__duration">{session.duration}분 ›</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section className="fit-report__card fit-report__week" aria-label="요일별 진행">
            <WorkoutWeek sessions={sessions} pastDays={today.getDay()} />
          </section>
        </>
      ) : (
        <section className="fit-report__card">
          <h2>시작한 운동 계획이 없어요</h2>
          <p className="fit-report__empty">운동 계획을 시작하면 주간 리포트를 볼 수 있어요.</p>
          <Link className="fit-report__plan-link" to="/plan">운동 계획 확인하기</Link>
        </section>
      )}

      <FitNavigation />
    </div>
  )
}
