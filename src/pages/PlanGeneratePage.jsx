import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import './PlanGeneratePage.css'

const steps = [
  { title: '운동 목표와 경험을 확인하는중', detail: '입력한 정보를 바탕으로 분석하고 있어요' },
  { title: '운동 가능한 시간대를 찾는중', detail: '목표에 맞는 루틴을 구성하고 있어요' },
  { title: '주간 운동 계획을 만드는중', detail: '거의 다 됐어요' },
]

const STEP_DURATION = 900

export default function PlanGeneratePage() {
  const [stepIndex, setStepIndex] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setTimeout(() => {
      if (stepIndex < steps.length - 1) {
        setStepIndex(stepIndex + 1)
      } else {
        navigate('/plan', { replace: true })
      }
    }, STEP_DURATION)

    return () => clearTimeout(timer)
  }, [stepIndex, navigate])

  return (
    <div className="fit-generate">
      <h1>맞춤 운동 계획을<br />생성하고 있어요</h1>
      <p className="fit-generate__sub">목표와 운동 경험, 캘린더를 확인하고 있어요</p>

      <div className="fit-generate__spinner" aria-hidden="true" />

      <div className="fit-generate__status" role="status">
        <p>{steps[stepIndex].title}</p>
        <p className="fit-generate__note">{steps[stepIndex].detail}</p>
      </div>
    </div>
  )
}
