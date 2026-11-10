import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import FitNavigation from '../components/FitNavigation.jsx'
import './ProfilePage.css'

const goalLabels = {
  muscle: '근력 및 근육량 향상',
  fat: '체지방 관리',
  fitness: '기초 체력 및 심폐지구력 향상',
  general: '기본 운동 계획 추천',
}

const experienceLabels = {
  beginner: '초보',
  intermediate: '경험자',
  advanced: '숙련자',
}

const environmentLabels = {
  campus: '교내 스포츠센터 이용 가능',
  gym: '일반 헬스장 이용 가능',
  planned: '아직 없지만 이용할 예정',
}

function loadProfile() {
  try {
    const profile = JSON.parse(localStorage.getItem('demo-profile'))

    if (
      !profile ||
      !Object.hasOwn(goalLabels, profile.goal) ||
      !Object.hasOwn(experienceLabels, profile.experience) ||
      !Object.hasOwn(environmentLabels, profile.environment) ||
      !Number.isFinite(profile.height) ||
      !Number.isFinite(profile.weight) ||
      !Number.isInteger(profile.age) ||
      profile.height <= 0 ||
      profile.weight <= 0 ||
      profile.age <= 0
    ) {
      return null
    }

    return profile
  } catch {
    return null
  }
}

function loadInbody() {
  const empty = {
    bodyFat: '',
    muscleMass: '',
    measuredAt: '',
  }

  try {
    const data = JSON.parse(localStorage.getItem('demo-inbody'))

    if (
      !data ||
      !Number.isFinite(data.bodyFat) ||
      data.bodyFat <= 0 ||
      data.bodyFat > 100 ||
      !Number.isFinite(data.muscleMass) ||
      data.muscleMass <= 0 ||
      typeof data.measuredAt !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(data.measuredAt)
    ) {
      return empty
    }

    return {
      bodyFat: String(data.bodyFat),
      muscleMass: String(data.muscleMass),
      measuredAt: data.measuredAt,
    }
  } catch {
    return empty
  }
}

function InbodySection() {
  const [image, setImage] = useState(null)
  const [imageMessage, setImageMessage] = useState('')
  const [savedInbody, setSavedInbody] = useState(loadInbody)
  const [form, setForm] = useState(savedInbody)
  const [saveMessage, setSaveMessage] = useState('')
  const inputRef = useRef(null)

  const today = new Date()
  const todayText = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0'),
  ].join('-')

  useEffect(() => {
    if (!image) return

    return () => URL.revokeObjectURL(image.url)
  }, [image])

  function handleFileChange(event) {
    const file = event.target.files?.[0]

    if (!file) return

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setImageMessage('JPG, PNG, WEBP 이미지를 선택해 주세요.')
      event.target.value = ''
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setImageMessage('10MB 이하의 이미지를 선택해 주세요.')
      event.target.value = ''
      return
    }

    setImage({ file, url: URL.createObjectURL(file) })
    setImageMessage('')
  }

  function removeImage() {
    setImage(null)
    setImageMessage('')

    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  function handleChange(event) {
    const { name, value } = event.target

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }))

    setSaveMessage('')
  }

  function saveInbody(event) {
    event.preventDefault()

    const data = {
      bodyFat: Number(form.bodyFat),
      muscleMass: Number(form.muscleMass),
      measuredAt: form.measuredAt,
      savedAt: new Date().toISOString(),
    }

    try {
      localStorage.setItem('demo-inbody', JSON.stringify(data))
      setSavedInbody(form)
      setSaveMessage('인바디 수치를 브라우저에 저장했어요.')
    } catch {
      setSaveMessage('저장하지 못했어요. 다시 시도해 주세요.')
    }
  }

  return (
    <details className="fit-profile__card fit-profile__inbody">
      <summary>
        <span>인바디 정보</span>
        <small>
          {savedInbody.measuredAt
            ? `체지방률 ${savedInbody.bodyFat}% · 골격근량 ${savedInbody.muscleMass}kg`
            : '결과지 미리보기 · 수치 입력'}
        </small>
      </summary>

      <label>
        결과지 이미지 선택{' '}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
        />
      </label>

      <p>JPG, PNG, WEBP / 최대 10MB</p>
      <p role="status">{imageMessage}</p>

      {image && (
        <div>
          <p>{image.file.name}</p>

          <img
            src={image.url}
            alt="선택한 인바디 결과지"
            className="fit-profile__preview"
            onError={() =>
              setImageMessage('이미지를 표시할 수 없어요. 다른 파일을 선택해 주세요.')
            }
          />

          <button type="button" onClick={removeImage}>
            이미지 선택 취소
          </button>
        </div>
      )}

      <h3 className="fit-profile__form-title">수치 직접 입력</h3>
      <p>결과지를 보고 수치를 입력해 주세요.</p>

      <form onSubmit={saveInbody}>
        <p>
          <label>
            체지방률(%){' '}
            <input
              type="number"
              name="bodyFat"
              value={form.bodyFat}
              onChange={handleChange}
              min="0.1"
              max="100"
              step="0.1"
              required
            />
          </label>
        </p>

        <p>
          <label>
            골격근량(kg){' '}
            <input
              type="number"
              name="muscleMass"
              value={form.muscleMass}
              onChange={handleChange}
              min="0.1"
              step="0.1"
              required
            />
          </label>
        </p>

        <p>
          <label>
            측정일{' '}
            <input
              type="date"
              name="measuredAt"
              value={form.measuredAt}
              onChange={handleChange}
              max={todayText}
              required
            />
          </label>
        </p>

        <button className="fit-profile__primary" type="submit">인바디 수치 저장</button>
      </form>

      <p role="status">{saveMessage}</p>
      <p>입력한 수치만 저장되며, 결과지 이미지는 저장되지 않아요.</p>
    </details>
  )
}

export default function ProfilePage() {
  const [profile] = useState(loadProfile)

  return (
    <div className="fit-profile">
      <h1>내 프로필</h1>

      <section className="fit-profile__card fit-profile__intro" aria-label="운동 프로필">
        <span className="fit-profile__avatar" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21v-2a8 8 0 0 1 16 0v2z" />
          </svg>
        </span>
        <div>
          <h2>내 운동 프로필</h2>
          <p>{profile ? experienceLabels[profile.experience] : '운동 정보를 등록해 주세요.'}</p>
        </div>
        <Link className="fit-profile__edit" to="/signup">
          {profile ? '수정' : '등록'}
        </Link>
      </section>

      {profile && (
        <>
          <section className="fit-profile__group" aria-labelledby="profile-body">
            <h2 id="profile-body">기본 신체 정보</h2>
            <dl className="fit-profile__card fit-profile__list">
              <div><dt>키</dt><dd>{profile.height}cm</dd></div>
              <div><dt>몸무게</dt><dd>{profile.weight}kg</dd></div>
              <div><dt>만 나이</dt><dd>{profile.age}세</dd></div>
            </dl>
          </section>

          <section className="fit-profile__group" aria-labelledby="profile-workout">
            <h2 id="profile-workout">운동 설정</h2>
            <dl className="fit-profile__card fit-profile__list">
              <div><dt>운동 목표</dt><dd>{goalLabels[profile.goal]}</dd></div>
              <div><dt>운동 경험</dt><dd>{experienceLabels[profile.experience]}</dd></div>
              <div><dt>운동 환경</dt><dd>{environmentLabels[profile.environment]}</dd></div>
            </dl>
          </section>
        </>
      )}

      <section className="fit-profile__group" aria-labelledby="profile-manage">
        <h2 id="profile-manage">정보 관리</h2>
        <InbodySection />
        <Link className="fit-profile__card fit-profile__row-link" to="/schedule">
          <span>
            <strong>생활 일정 관리</strong>
            <small>달력에서 내 일정 보기</small>
          </span>
          <span aria-hidden="true">›</span>
        </Link>
      </section>

      <FitNavigation />
    </div>
  )
}
