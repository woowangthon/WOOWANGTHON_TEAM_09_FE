import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'

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
  const [form, setForm] = useState(loadInbody)
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
      setSaveMessage('인바디 수치를 브라우저에 저장했어요.')
    } catch {
      setSaveMessage('저장하지 못했어요. 다시 시도해 주세요.')
    }
  }

  return (
    <section>
      <h2>인바디 정보</h2>

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
            style={{
              display: 'block',
              maxWidth: '100%',
              maxHeight: '480px',
              objectFit: 'contain',
              margin: '16px auto',
            }}
            onError={() =>
              setImageMessage('이미지를 표시할 수 없어요. 다른 파일을 선택해 주세요.')
            }
          />

          <button type="button" onClick={removeImage}>
            이미지 선택 취소
          </button>
        </div>
      )}

      <h3>수치 직접 입력</h3>
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

        <button type="submit">인바디 수치 저장</button>
      </form>

      <p role="status">{saveMessage}</p>
      <p>입력한 수치만 저장되며, 결과지 이미지는 저장되지 않아요.</p>
    </section>
  )
}

export default function ProfilePage() {
  const [profile] = useState(loadProfile)

  return (
    <section>
      <h1>내 프로필</h1>

      {profile ? (
        <dl>
          <dt>운동 목표</dt>
          <dd>{goalLabels[profile.goal]}</dd>

          <dt>운동 경험</dt>
          <dd>{experienceLabels[profile.experience]}</dd>

          <dt>운동 환경</dt>
          <dd>{environmentLabels[profile.environment]}</dd>

          <dt>키</dt>
          <dd>{profile.height}cm</dd>

          <dt>몸무게</dt>
          <dd>{profile.weight}kg</dd>

          <dt>만 나이</dt>
          <dd>{profile.age}세</dd>
        </dl>
      ) : (
        <p>저장된 초기 정보가 없어요.</p>
      )}

      <Link to="/signup">
        {profile ? '초기 정보 다시 입력하기' : '초기 정보 입력하기'}
      </Link>

      <InbodySection />
    </section>
  )
}