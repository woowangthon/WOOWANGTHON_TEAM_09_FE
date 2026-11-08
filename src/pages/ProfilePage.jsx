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
    const saved = localStorage.getItem('demo-profile')

    if (!saved) return null

    const profile = JSON.parse(saved)

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

function InbodyUpload() {
  const [image, setImage] = useState(null)
  const [message, setMessage] = useState('')
  const inputRef = useRef(null)

  // 이미지 교체나 화면 이동 시 미리보기용 주소를 정리한다.
  useEffect(() => {
    if (!image) return

    return () => {
      URL.revokeObjectURL(image.url)
    }
  }, [image])

  function handleFileChange(event) {
    const file = event.target.files?.[0]

    if (!file) return

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']

    if (!allowedTypes.includes(file.type)) {
      setMessage('JPG, PNG, WEBP 이미지를 선택해 주세요.')
      event.target.value = ''
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setMessage('10MB 이하의 이미지를 선택해 주세요.')
      event.target.value = ''
      return
    }

    setImage({
      file,
      url: URL.createObjectURL(file),
    })

    setMessage('')
  }

  function removeImage() {
    setImage(null)
    setMessage('')

    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  return (
    <section>
      <h2>인바디 결과지</h2>

      <p>
        측정 수치가 잘 보이는 JPG, PNG, WEBP 이미지를 선택해 주세요.
        최대 10MB까지 선택할 수 있어요.
      </p>

      <label>
        인바디 이미지 선택{' '}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
        />
      </label>

      <p role="status">{message}</p>

      {image && (
        <div>
          <p>선택한 파일: {image.file.name}</p>

          <img
            src={image.url}
            alt="선택한 인바디 결과지 미리보기"
            style={{
              display: 'block',
              maxWidth: '100%',
              maxHeight: '480px',
              objectFit: 'contain',
              margin: '16px auto',
            }}
            onError={() =>
              setMessage('이미지를 표시할 수 없어요. 다른 파일을 선택해 주세요.')
            }
          />

          <button type="button" onClick={removeImage}>
            이미지 선택 취소
          </button>
        </div>
      )}
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
        <p>저장된 초기 정보가 없어요. 먼저 정보를 입력해 주세요.</p>
      )}

      <Link to="/signup">
        {profile ? '초기 정보 다시 입력하기' : '초기 정보 입력하기'}
      </Link>

      <InbodyUpload />
    </section>
  )
}