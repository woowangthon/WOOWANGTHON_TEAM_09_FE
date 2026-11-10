import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { generatePlan, loadGoalText, loadWeek } from '../api/plan.js'
import { dateKey, parseDateKey } from '../workoutPlan.js'
import './PlanGeneratePage.css'

const steps = [
  { title: '운동 목표와 경험을 확인하는중', detail: '입력한 정보를 바탕으로 분석하고 있어요' },
  { title: '운동 가능한 시간대를 찾는중', detail: '캘린더와 시간표의 빈 시간을 찾고 있어요' },
  { title: '목표에 맞는 루틴을 구성하는중', detail: '운동 지침을 바탕으로 종목을 고르고 있어요' },
  { title: '주간 운동 계획을 저장하는중', detail: '조금만 더 기다려 주세요' },
]

const STEP_DURATION = 5000

// ?week=YYYY-MM-DD 가 있으면 그 주, 없으면 이번 주 계획을 만들어요. ?regenerate=1 이면 남은 운동이 있어도 새로 만들어요.
export default function PlanGeneratePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const week = searchParams.get('week') ?? undefined
  const regenerate = searchParams.get('regenerate') === '1'
  const [stepIndex, setStepIndex] = useState(0)
  const [error, setError] = useState(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (error) return
    const timer = setInterval(() => setStepIndex((index) => Math.min(index + 1, steps.length - 1)), STEP_DURATION)
    return () => clearInterval(timer)
  }, [error, attempt])

  useEffect(() => {
    let ignore = false
    const planPath = week ? `/plan?week=${week}` : '/plan'

    async function run() {
      // 앞으로 할 운동이 이미 있으면 새로 만들지 않아요. (AI 호출은 비용이 들어요)
      if (!regenerate) {
        const todayKey = dateKey(new Date())
        const existing = await loadWeek(week ? parseDateKey(week) : new Date())
        if (existing.sessions.some((session) => session.date >= todayKey)) return { existing: true }
      }

      return generatePlan(loadGoalText(), week)
    }

    run()
      .then((result) => {
        if (ignore) return
        navigate(planPath, { replace: true, state: result.existing ? null : { result } })
      })
      .catch((caught) => {
        if (!ignore) setError(caught)
      })

    return () => { ignore = true }
  }, [week, regenerate, attempt, navigate])

  if (error) {
    return (
      <div className="fit-generate">
        <h1>계획을 만들지<br />못했어요</h1>
        <p className="fit-generate__sub" role="alert">{error.message}</p>
        <div className="fit-generate__actions">
          <button
            type="button"
            onClick={() => {
              setError(null)
              setStepIndex(0)
              setAttempt((value) => value + 1)
            }}
          >
            다시 시도
          </button>
          <Link to="/">홈으로</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="fit-generate">
      <h1>맞춤 운동 계획을<br />생성하고 있어요</h1>
      <p className="fit-generate__sub">목표와 운동 경험, 캘린더를 확인하고 있어요</p>

      <div className="fit-generate__spinner" aria-hidden="true" />

      <div className="fit-generate__status" role="status">
        <p>{steps[stepIndex].title}</p>
        <p className="fit-generate__note">{steps[stepIndex].detail}</p>
      </div>
      <p className="fit-generate__wait">AI가 계획을 만드는 데 30초 정도 걸릴 수 있어요.</p>
    </div>
  )
}
