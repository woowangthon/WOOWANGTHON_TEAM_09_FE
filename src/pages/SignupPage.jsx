import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { bodyInfo, saveInfo } from '../api/profile.js'
import { moveWorkoutsOutOfBlocksSafely } from '../api/reschedule.js'
import { saveUnavailablePeriods } from '../api/weeklyBlocks.js'
import SetupProgress from '../components/SetupProgress.jsx'
import { savePrefs } from '../userPrefs.js'
import UnavailablePicker from '../components/UnavailablePicker.jsx'
import { getUnavailablePeriod, getUnavailablePeriods } from '../workoutAvailability.js'
import './SignupPage.css'
import BrandMark from '../components/BrandMark.jsx'

const goals = ['muscle', 'fat', 'fitness', 'unsure', 'general']
const experiences = ['beginner', 'intermediate', 'advanced']
const environments = ['gym', 'none', 'campus', 'planned']
const genders = ['male', 'female']

const initialProfile = {
  name: '',
  goal: '',
  experience: '',
  environment: '',
  unavailablePeriods: [],
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
      unavailablePeriods: getUnavailablePeriods(profile.unavailablePeriods, getUnavailablePeriod(profile.unavailablePeriod)),
      height: Number.isFinite(profile.height) ? String(profile.height) : '',
      weight: Number.isFinite(profile.weight) ? String(profile.weight) : '',
      age: Number.isInteger(profile.age) ? String(profile.age) : '',
      gender: genders.includes(profile.gender) ? profile.gender : '',
    }
  } catch {
    return initialProfile
  }
}

// step: 1 이름 · 2~4 선택 질문 · 5 어려운 시간대(여러 개) · 7 신체 정보
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

const progressByStep = { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 7: 6 }

const bodyFields = [
  { name: 'height', label: '신장', unit: 'cm', min: 51, max: 249 },
  { name: 'weight', label: '체중', unit: 'kg', min: 11, max: 299 },
  { name: 'age', label: '나이', prefix: '(만)', unit: '세', min: 6, max: 100 },
]

// ?edit=body · ?edit=time 으로 들어오면 그 단계만 고치고 프로필로 돌아가요.
const editSteps = { body: 7, time: 5 }

export default function SignupPage() {
  const [searchParams] = useSearchParams()
  const [profile, setProfile] = useState(loadProfile)
  // 이미 프로필이 있으면 수정 중이에요. 첫 화면에서 뒤로 가면 시작 화면이 아니라 프로필로 돌아가요.
  const [isEditing] = useState(() => Boolean(profile.goal))
  const [editStep] = useState(() => (profile.goal ? editSteps[searchParams.get('edit')] : undefined))
  const [step, setStep] = useState(() => editStep ?? 1)
  const [message, setMessage] = useState('')
  const [isSaving, setIsSaving] = useState(false)
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
    if (step === editStep || (isEditing && step === 1)) {
      navigate('/profile')
      return
    }

    goTo(step === 7 ? 5 : step - 1)
  }

  function persist(nextProfile) {
    try {
      localStorage.setItem('demo-profile', JSON.stringify({
        ...nextProfile,
        name: nextProfile.name.trim(),
        height: Math.round(Number(nextProfile.height)),
        weight: Math.round(Number(nextProfile.weight)),
        age: Number(nextProfile.age),
      }))
      // 서버에 없는 값은 아이디별로 따로 보관해서 로그아웃해도 남겨요.
      savePrefs({
        name: nextProfile.name.trim(),
        goal: nextProfile.goal,
        environment: nextProfile.environment,
        unavailablePeriods: nextProfile.unavailablePeriods,
      })
      return true
    } catch {
      setMessage('저장하지 못했어요. 다시 시도해 주세요.')
      return false
    }
  }

  // 시간대만 고치는 중이면 바로 저장하고 프로필로, 아니면 신체 정보 단계로
  async function finishPeriods(unavailablePeriods) {
    if (editStep === 5) {
      setIsSaving(true)
      let notice
      try {
        await saveUnavailablePeriods(unavailablePeriods)
        notice = await moveWorkoutsOutOfBlocksSafely()
      } catch (error) {
        setMessage(error.message)
        setIsSaving(false)
        return
      }
      if (persist({ ...profile, unavailablePeriods })) navigate('/profile', { state: { notice } })
      setIsSaving(false)
      return
    }

    update('unavailablePeriods', unavailablePeriods)
    goTo(7)
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

  // 서버에 먼저 저장하고, 성공하면 이 기기에도 저장해요.
  async function saveProfile(event) {
    event.preventDefault()
    setIsSaving(true)

    let notice
    try {
      await saveInfo(bodyInfo(profile))
      if (!editStep) await saveUnavailablePeriods(profile.unavailablePeriods)
      // 프로필 수정으로 운동하기 어려운 시간이 바뀌었으면, 겹치는 운동을 옮겨요.
      if (isEditing && !editStep) notice = await moveWorkoutsOutOfBlocksSafely()
    } catch (error) {
      setMessage(error.message)
      setIsSaving(false)
      return
    }

    // 프로필 수정이면 저장하고 프로필로 돌아가요. (인바디·시간표·캘린더·AI 계획 생성으로 이어지지 않게)
    if (persist(profile)) navigate(editStep || isEditing ? '/profile' : '/setup/inbody', { state: { notice } })
    setIsSaving(false)
  }

  const backButton = (
    <button className="fit-setup__prev" type="button" onClick={goBack}>이전으로</button>
  )

  function heading(lines) {
    return (
      <h1 ref={headingRef} tabIndex={-1}>
        {lines.map((line) => <span key={line}>{line}</span>)}
      </h1>
    )
  }

  return (
    <div className="fit-setup">
      <BrandMark />
      {!editStep && <SetupProgress step={progressByStep[step]} />}

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
        <UnavailablePicker
          title={heading(['운동하기 어려운', '시간대를 골라주세요'])}
          initial={profile.unavailablePeriods}
          isSaving={isSaving}
          onDone={finishPeriods}
          footer={backButton}
        />
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
                    inputMode="numeric"
                    name={field.name}
                    value={profile[field.name]}
                    onChange={(event) => update(field.name, event.target.value)}
                    min={field.min}
                    max={field.max}
                    step={1}
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
              </select>
            </label>
          </div>
          <p className="fit-setup__privacy">입력한 정보는 운동 계획 추천에만 사용돼요.</p>
          <div className="fit-setup__options">
            <button className="fit-setup__choice" type="submit" disabled={isSaving}>{isSaving ? '저장하는 중...' : isEditing ? '저장' : '완료'}</button>
            {backButton}
          </div>
        </form>
      )}

      <p className="fit-setup__message" role="status">{message}</p>
    </div>
  )
}
