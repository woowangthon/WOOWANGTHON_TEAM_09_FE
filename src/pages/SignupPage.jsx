import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import SetupProgress from '../components/SetupProgress.jsx'
import TimeScrubber from '../components/TimeScrubber.jsx'
import { crossesMidnight, getUnavailablePeriod } from '../workoutAvailability.js'
import './SignupPage.css'

const defaultPeriod = { startTime: '22:00', endTime: '07:00' }

const goals = ['muscle', 'fat', 'fitness', 'unsure', 'general']
const experiences = ['beginner', 'intermediate', 'advanced']
const environments = ['gym', 'none', 'campus', 'planned']
const genders = ['male', 'female', 'none']

const initialProfile = {
  name: '',
  goal: '',
  experience: '',
  environment: '',
  unavailablePeriod: null,
  height: '',
  weight: '',
  age: '',
  gender: '',
}

function loadProfile() {
  try {
    const profile = JSON.parse(localStorage.getItem('demo-profile'))

    if (!profile || typeof profile !== 'object') return initialProfile

    return {
      name: typeof profile.name === 'string' ? profile.name : '',
      goal: goals.includes(profile.goal) ? profile.goal : '',
      experience: experiences.includes(profile.experience) ? profile.experience : '',
      environment: environments.includes(profile.environment) ? profile.environment : '',
      unavailablePeriod: getUnavailablePeriod(profile.unavailablePeriod),
      height: Number.isFinite(profile.height) ? String(profile.height) : '',
      weight: Number.isFinite(profile.weight) ? String(profile.weight) : '',
      age: Number.isInteger(profile.age) ? String(profile.age) : '',
      gender: genders.includes(profile.gender) ? profile.gender : '',
    }
  } catch {
    return initialProfile
  }
}

// step: 0 시작 · 1 이름 · 2~4 선택 질문 · 5 어려운 시간 여부 · 6 시간대 선택 · 7 신체 정보
const choiceSteps = {
  2: {
    name: 'goal',
    title: ['운동 목표가', '어떻게 되시나요?'],
    options: [
      { value: 'muscle', label: '근력 및 근육량 향상' },
      { value: 'fat', label: '체지방 관리' },
      { value: 'fitness', label: '기초 체력 및 심폐지구력 향상' },
      { value: 'unsure', label: '잘 모르겠어요' },
      { value: 'general', label: '기본 운동 계획을 추천해주세요' },
    ],
  },
  3: {
    name: 'experience',
    title: ['운동 경험이', '어떻게 되시나요?'],
    options: [
      { value: 'beginner', label: '운동은 거의 처음이에요' },
      { value: 'intermediate', label: '기본적인 운동은 해본 적 있어요' },
      { value: 'advanced', label: '다양한 운동을 해봤어요' },
    ],
  },
  4: {
    name: 'environment',
    title: ['헬스장 이용이', '가능한가요?'],
    options: [
      { value: 'gym', label: '네, 이용할 수 있어요' },
      { value: 'none', label: '아니요, 이용하기 어려워요' },
    ],
  },
}

const progressByStep = { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 5, 7: 6 }

const bodyFields = [
  { name: 'height', label: '신장', unit: 'cm', max: 300, step: 0.1 },
  { name: 'weight', label: '체중', unit: 'kg', max: 500, step: 0.1 },
  { name: 'age', label: '나이', prefix: '(만)', unit: '세', max: 120, step: 1 },
]

export default function SignupPage() {
  const [profile, setProfile] = useState(loadProfile)
  const [step, setStep] = useState(() => (profile.goal ? 1 : 0))
  const [period, setPeriod] = useState(() => profile.unavailablePeriod ?? defaultPeriod)
  const [message, setMessage] = useState('')
  const headingRef = useRef(null)
  const navigate = useNavigate()

  const question = choiceSteps[step]

  useEffect(() => {
    headingRef.current?.focus()
  }, [step])

  function goTo(nextStep) {
    setMessage('')
    setStep(nextStep)
  }

  function goBack() {
    goTo(step === 7 && !profile.unavailablePeriod ? 5 : step - 1)
  }

  function update(name, value) {
    setProfile((previous) => ({ ...previous, [name]: value }))
    setMessage('')
  }

  function choose(name, value) {
    update(name, value)
    goTo(step + 1)
  }

  function submitName(event) {
    event.preventDefault()

    if (!profile.name.trim()) {
      setMessage('이름을 입력해 주세요.')
      return
    }

    goTo(2)
  }

  function confirmPeriod() {
    const saved = getUnavailablePeriod(period)

    if (!saved) {
      setMessage('시작과 종료 시간을 다르게 선택해 주세요.')
      return
    }

    update('unavailablePeriod', saved)
    goTo(7)
  }

  function skipPeriod() {
    update('unavailablePeriod', null)
    goTo(7)
  }

  function saveProfile(event) {
    event.preventDefault()

    const savedProfile = {
      ...profile,
      name: profile.name.trim(),
      height: Number(profile.height),
      weight: Number(profile.weight),
      age: Number(profile.age),
    }

    try {
      localStorage.setItem('demo-profile', JSON.stringify(savedProfile))
    } catch {
      setMessage('저장하지 못했어요. 다시 시도해 주세요.')
      return
    }

    navigate('/setup/inbody')
  }

  const backButton = (
    <button className="fit-setup__prev" type="button" onClick={goBack}>이전으로</button>
  )

  function heading(lines) {
    return (
      <h1 ref={headingRef} tabIndex={-1}>
        {lines.map((line, index) => (
          <span key={line}>{index > 0 && <br />}{line}</span>
        ))}
      </h1>
    )
  }

  return (
    <div className="fit-setup">
      {step > 0 && <SetupProgress step={progressByStep[step]} />}

      {step === 0 && (
        <div className="fit-setup__screen fit-setup__screen--welcome">
          {heading(['안녕하세요'])}
          <div className="fit-setup__options">
            <button className="fit-setup__choice" type="button" onClick={() => goTo(1)}>시작하기</button>
          </div>
        </div>
      )}

      {step === 1 && (
        <form className="fit-setup__screen" onSubmit={submitName}>
          {heading(['이름을', '알려주세요'])}
          <div className="fit-setup__options">
            <input
              className="fit-setup__name"
              name="name"
              value={profile.name}
              onChange={(event) => update('name', event.target.value)}
              placeholder="이름"
              aria-label="이름"
              maxLength={20}
              autoComplete="given-name"
            />
            <button className="fit-setup__choice" type="submit" disabled={!profile.name.trim()}>다음</button>
            {profile.goal && backButton}
          </div>
        </form>
      )}

      {question && (
        <div className="fit-setup__screen">
          {heading(question.title)}
          <div className="fit-setup__options" role="group" aria-label={question.title.join(' ')}>
            {question.options.map((option) => (
              <button
                key={option.value}
                className="fit-setup__choice"
                type="button"
                aria-pressed={profile[question.name] === option.value}
                onClick={() => choose(question.name, option.value)}
              >
                {option.label}
              </button>
            ))}
            {backButton}
          </div>
        </div>
      )}

      {step === 5 && (
        <div className="fit-setup__screen">
          {heading(['운동하기 어려운', '시간대가 있나요?'])}
          <div className="fit-setup__options">
            <button className="fit-setup__choice" type="button" aria-pressed={Boolean(profile.unavailablePeriod)} onClick={() => goTo(6)}>
              네, 시간대를 선택할게요
            </button>
            <button className="fit-setup__choice" type="button" onClick={skipPeriod}>없어요, 다음으로</button>
            {backButton}
          </div>
        </div>
      )}

      {step === 6 && (
        <div className="fit-setup__screen fit-setup__screen--top">
          {heading(['시간대 선택하기'])}
          <dl className="fit-setup__range-summary">
            <div><dt>시작</dt><dd>{period.startTime} 부터</dd></div>
            <div><dt>종료</dt><dd>{crossesMidnight(period) ? '다음 날 ' : ''}{period.endTime} 까지</dd></div>
          </dl>
          <p className="fit-setup__hint">매일 이 시간에는 운동 계획을 잡지 않아요.</p>
          <div className="fit-setup__scrubbers">
            <TimeScrubber label="시작" value={period.startTime} onChange={(startTime) => setPeriod((previous) => ({ ...previous, startTime }))} />
            <TimeScrubber label="종료" value={period.endTime} onChange={(endTime) => setPeriod((previous) => ({ ...previous, endTime }))} />
          </div>
          <div className="fit-setup__options">
            <button className="fit-setup__choice" type="button" onClick={confirmPeriod}>선택 완료</button>
            {backButton}
          </div>
        </div>
      )}

      {step === 7 && (
        <form className="fit-setup__screen fit-setup__screen--top" onSubmit={saveProfile}>
          {heading(['기본 신체 정보를', '입력해주세요'])}
          <div className="fit-setup__body-card">
            {bodyFields.map((field) => (
              <label key={field.name}>
                <span>{field.label}</span>
                <span className="fit-setup__body-value">
                  {field.prefix && <small>{field.prefix}</small>}
                  <input
                    type="number"
                    inputMode="decimal"
                    name={field.name}
                    value={profile[field.name]}
                    onChange={(event) => update(field.name, event.target.value)}
                    min={1}
                    max={field.max}
                    step={field.step}
                    placeholder="0"
                    required
                  />
                  <small>{field.unit}</small>
                </span>
              </label>
            ))}
            <label>
              <span>성별</span>
              <select name="gender" value={profile.gender} onChange={(event) => update('gender', event.target.value)} required>
                <option value="" disabled>선택</option>
                <option value="male">남성</option>
                <option value="female">여성</option>
                <option value="none">선택 안 함</option>
              </select>
            </label>
          </div>
          <p className="fit-setup__privacy">입력한 정보는 운동 계획 추천에만 사용돼요.</p>
          <div className="fit-setup__options">
            <button className="fit-setup__choice" type="submit">완료</button>
            {backButton}
          </div>
        </form>
      )}

      <p className="fit-setup__message" role="status">{message}</p>
    </div>
  )
}
