import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { getUnavailablePeriod } from '../workoutAvailability.js'
import { weekdays } from '../workoutPlan.js'
import './SignupPage.css'

const emptyPeriod = { weekday: '', startTime: '', endTime: '' }

const initialProfile = {
  unavailablePeriod: emptyPeriod,
  goal: '',
  experience: '',
  environment: '',
  height: '',
  weight: '',
  age: '',
}

function loadProfile() {
  try {
    const saved = localStorage.getItem('demo-profile')

    if (!saved) return initialProfile

    const profile = JSON.parse(saved)

    if (!profile || typeof profile !== 'object') {
      return initialProfile
    }

    return {
      goal: ['muscle', 'fat', 'fitness', 'general'].includes(profile.goal)
        ? profile.goal
        : '',
      experience: ['beginner', 'intermediate', 'advanced'].includes(
        profile.experience
      )
        ? profile.experience
        : '',
      environment: ['campus', 'gym', 'planned'].includes(profile.environment)
        ? profile.environment
        : '',
      height: Number.isFinite(profile.height) ? String(profile.height) : '',
      weight: Number.isFinite(profile.weight) ? String(profile.weight) : '',
      age: Number.isInteger(profile.age) ? String(profile.age) : '',
      unavailablePeriod: getUnavailablePeriod(profile.unavailablePeriod) ?? emptyPeriod,
    }
  } catch {
    return initialProfile
  }
}

const choiceSteps = [
  {
    name: 'goal',
    title: '운동 목표가 어떻게 되시나요?',
    options: [
      { value: 'muscle', label: '근력 및 근육량 향상' },
      { value: 'fat', label: '체지방 관리' },
      { value: 'fitness', label: '기초 체력 및 심폐지구력 향상' },
      { value: 'general', label: '잘 모르겠어요. 기본 계획 추천' },
    ],
  },
  {
    name: 'experience',
    title: '운동 경험이 어떻게 되시나요?',
    options: [
      { value: 'beginner', label: '초보' },
      { value: 'intermediate', label: '경험자' },
      { value: 'advanced', label: '숙련자' },
    ],
  },
  {
    name: 'environment',
    title: '어디에서 운동할 예정인가요?',
    options: [
      { value: 'campus', label: '교내 스포츠센터 이용 가능' },
      { value: 'gym', label: '일반 헬스장 이용 가능' },
      { value: 'planned', label: '아직 없지만 이용할 예정' },
    ],
  },
]

const bodyFields = [
  { name: 'height', label: '키 (cm)', max: 300, step: 0.1 },
  { name: 'weight', label: '몸무게 (kg)', max: 500, step: 0.1 },
  { name: 'age', label: '만 나이', max: 120, step: 1 },
]

const availabilityStep = choiceSteps.length + 1
const lastStep = availabilityStep + 1

export default function SignupPage() {
  const [profile, setProfile] = useState(loadProfile)
  const [step, setStep] = useState(() => profile.goal ? 1 : 0)
  const [message, setMessage] = useState('')
  const headingRef = useRef(null)
  const navigate = useNavigate()

  const question = choiceSteps[step - 1]
  const isWelcome = step === 0
  const isAvailabilityStep = step === availabilityStep
  const isLastStep = step === lastStep
  const period = profile.unavailablePeriod

  useEffect(() => {
    headingRef.current?.focus()
  }, [step])

  function handleChange(event) {
    const { name, value } = event.target
    setProfile((previous) => ({ ...previous, [name]: value }))
    setMessage('')
  }

  function handlePeriodChange(event) {
    const { name, value } = event.target

    setProfile((previous) => ({
      ...previous,
      unavailablePeriod: { ...previous.unavailablePeriod, [name]: value },
    }))
    setMessage('')
  }

  function handleSubmit(event) {
    event.preventDefault()

    if (isAvailabilityStep && period.weekday && !getUnavailablePeriod(period)) {
      setMessage('종료 시간은 시작 시간보다 늦어야 해요.')
      return
    }

    if (!isLastStep) {
      setStep((previous) => previous + 1)
      return
    }

    const savedProfile = {
      ...profile,
      height: Number(profile.height),
      weight: Number(profile.weight),
      age: Number(profile.age),
      unavailablePeriod: getUnavailablePeriod(period),
    }

    try {
      localStorage.setItem('demo-profile', JSON.stringify(savedProfile))
    } catch {
      setMessage('저장하지 못했어요. 다시 시도해 주세요.')
      return
    }

    navigate('/plan/generate')
  }

  function goBack() {
    setMessage('')
    setStep((previous) => previous - 1)
  }

  return (
    <div className="fit-setup">
      <div className="fit-setup__top">
        <span>운동 프로필 설정</span>
        <Link to="/profile">닫기</Link>
      </div>

      {!isWelcome && (
        <div className="fit-setup__progress">
          <label htmlFor="setup-progress">단계 {step} / {lastStep}</label>
          <progress id="setup-progress" value={step} max={lastStep} />
        </div>
      )}

      <form onSubmit={handleSubmit} className={isWelcome ? 'fit-setup__welcome' : undefined}>
        <h1 id="setup-title" ref={headingRef} tabIndex={-1}>
          {isWelcome ? '안녕하세요!' : question?.title ?? (isAvailabilityStep ? '운동하기 어려운 시간대가 있나요?' : '기본 신체 정보를 입력해 주세요.')}
        </h1>

        {isWelcome && <p>운동 목표와 환경을 등록하고 내 운동 프로필을 만들어 보세요.</p>}

        {question && (
          <fieldset className="fit-setup__choices" aria-labelledby="setup-title">
            {question.options.map((option) => (
              <label className="fit-setup__option" key={option.value}>
                <input
                  type="radio"
                  name={question.name}
                  value={option.value}
                  checked={profile[question.name] === option.value}
                  onChange={handleChange}
                  required
                />
                <span>{option.label}</span>
              </label>
            ))}
          </fieldset>
        )}

        {isAvailabilityStep && (
          <div className="fit-setup__fields">
            <p className="fit-setup__hint">달력에서 운동 시간을 바꿀 때 매주 이 시간대를 제외해요.</p>
            <label>
              요일
              <select name="weekday" value={period.weekday} onChange={handlePeriodChange}>
                <option value="">제한 없음</option>
                {weekdays.map((day, index) => (
                  <option key={day} value={index}>{day}요일</option>
                ))}
              </select>
            </label>
            {period.weekday && (
              <>
                <label>
                  시작 시간
                  <input type="time" name="startTime" value={period.startTime} onChange={handlePeriodChange} required />
                </label>
                <label>
                  종료 시간
                  <input type="time" name="endTime" value={period.endTime} onChange={handlePeriodChange} required />
                </label>
              </>
            )}
          </div>
        )}

        {isLastStep && (
          <div className="fit-setup__fields">
            {bodyFields.map((field) => (
              <label key={field.name}>
                {field.label}
                <input
                  type="number"
                  name={field.name}
                  value={profile[field.name]}
                  onChange={handleChange}
                  min={1}
                  max={field.max}
                  step={field.step}
                  required
                />
              </label>
            ))}
          </div>
        )}

        <div className="fit-setup__actions">
          <button className="fit-setup__primary" type="submit">
            {isWelcome ? '시작하기' : isLastStep ? '저장하고 맞춤 계획 만들기' : '다음'}
          </button>
          {!isWelcome && (
            <button className="fit-setup__back" type="button" onClick={goBack}>이전</button>
          )}
        </div>

        <p className="fit-setup__message" role="status">{message}</p>
      </form>
    </div>
  )
}
