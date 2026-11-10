import { useState } from 'react'
import { Link } from 'react-router'
import { api } from '../api/client.js'
import { loadWeek } from '../api/plan.js'
import FitNavigation from '../components/FitNavigation.jsx'
import WorkoutWeek from '../components/WorkoutWeek.jsx'
import { feedbackReasons, loadFeedback } from '../feedback.js'
import { useAsync } from '../hooks/useAsync.js'
import { addDays, dateKey, formatKoreanTime, weekRange } from '../workoutPlan.js'
import './ReportPage.css'

const dateFormat = new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' })
const reasonLabels = Object.fromEntries(feedbackReasons.map((item) => [item.value, item.label]))

function sessionStatus(planned, completed, date, todayKey) {
  if (planned > 0 && completed === planned) return '완료'
  if (completed > 0) return '부분 완료'
  return date < todayKey ? '미수행' : '기록 없음'
}

// 이번 주 리포트 + 다음 주 운동 일정
async function loadReport(today) {
  const nextMonday = addDays(weekRange(today).start, 7)
  const [report, nextWeek] = await Promise.all([api('/report'), loadWeek(nextMonday)])
  return { report, nextSessions: nextWeek.sessions, nextMondayKey: dateKey(nextMonday) }
}

export default function ReportPage() {
  const [today] = useState(() => new Date())
  const [feedback] = useState(loadFeedback)
  const { data, error, loading, reload } = useAsync(() => loadReport(today), [today])
  const todayKey = dateKey(today)

  const report = data?.report
  const sessions = (report?.days ?? []).flatMap((day) =>
    day.sessions.map((session) => ({
      id: session.schedule_id,
      date: day.date,
      weekday: day.weekday,
      status: sessionStatus(session.planned, session.completed, day.date, todayKey),
    }))
  )
  const dayStates = (report?.days ?? [])
    .filter((day) => day.planned > 0)
    .map((day) => {
      const status = sessionStatus(day.planned, day.completed, day.date, todayKey)
      return `${day.weekday}요일 ${status === '기록 없음' ? '예정' : status}`
    })
  const feedbackItems = sessions.filter((session) => reasonLabels[feedback[session.id]?.reason])
  const rate = report?.so_far.rate ?? 0

  return (
    <div className="fit-report">
      <header className="fit-report__header">
        <p>{dateFormat.format(today)}</p>
        <h1>이번 주도 수고했어요</h1>
      </header>

      {loading && !data && <p className="fit-report__empty" role="status">리포트를 불러오는 중이에요...</p>}

      {error && (
        <section className="fit-report__card">
          <p className="fit-report__empty" role="alert">{error.message}</p>
          <button className="fit-report__plan-link" type="button" onClick={reload}>다시 불러오기</button>
        </section>
      )}

      {report && report.workout_days === 0 && (
        <section className="fit-report__card">
          <h2>이번 주 운동 계획이 없어요</h2>
          <p className="fit-report__empty">운동 계획을 만들면 주간 리포트를 볼 수 있어요.</p>
          <Link className="fit-report__plan-link" to="/plan/generate">맞춤 계획 만들기</Link>
        </section>
      )}

      {report && report.workout_days > 0 && (
        <>
          <section className="fit-report__card" aria-labelledby="report-rate">
            <h2 id="report-rate">이번 주 운동 수행률</h2>
            <p className="fit-report__rate">
              <strong>{rate}%</strong>
              <span>{report.workout_days}회 중 {report.completed_days}회 완료</span>
            </p>
            <div
              className="fit-report__bar"
              role="progressbar"
              aria-label="이번 주 운동 수행률"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={rate}
            >
              <span style={{ width: `${rate}%` }} />
            </div>
            <p className="fit-report__sessions">{dayStates.join(' · ')}</p>
            <p className="fit-report__empty">수행률은 오늘까지 계획한 종목 중 완료한 비율이에요.</p>

            <h2 className="fit-report__feedback-title">이번 주 피드백</h2>
            {feedbackItems.length ? (
              <ul className="fit-report__feedback">
                {feedbackItems.map((session) => (
                  <li key={session.id}>
                    <span>{session.weekday}요일 운동 {session.status === '부분 완료' ? '부분 완료' : '미수행'} 사유</span>
                    <small>{reasonLabels[feedback[session.id].reason]}</small>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="fit-report__empty">아직 남긴 피드백이 없어요.</p>
            )}
          </section>

          <section className="fit-report__card fit-report__week" aria-label="요일별 진행">
            <WorkoutWeek sessions={sessions} today={today} />
          </section>
        </>
      )}

      {data && (
        <section className="fit-report__next" aria-labelledby="report-next">
          <h2 id="report-next">다음 주 AI 운동 추천 계획</h2>
          {data.nextSessions.length ? (
            <ul>
              {data.nextSessions.map((session) => (
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
          ) : (
            <>
              <p className="fit-report__empty">이번 주 수행률을 반영해 다음 주 계획을 만들어 드려요.</p>
              <Link className="fit-report__plan-link" to={`/plan/generate?week=${data.nextMondayKey}`}>다음 주 계획 만들기</Link>
            </>
          )}
        </section>
      )}

      <FitNavigation />
    </div>
  )
}
