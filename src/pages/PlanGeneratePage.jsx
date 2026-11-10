import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import './PlanGeneratePage.css'

const steps = [
  '운동 목표와 경험을 분석하는 중...',
  '운동 가능한 시간대를 찾는 중...',
  '주간 루틴을 구성하는 중...',
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
      <p className="fit-generate__sub">입력한 목표, 경험, 운동하기 어려운 시간을 반영해요.</p>

      <div className="fit-generate__spinner" aria-hidden="true" />

      <p className="fit-generate__status" role="status">{steps[stepIndex]}</p>
      <p className="fit-generate__note">잠시만 기다려 주세요.</p>
    </div>
  )
}
