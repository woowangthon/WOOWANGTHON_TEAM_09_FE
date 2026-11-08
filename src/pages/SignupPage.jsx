import { useState } from 'react'

const initialProfile = {
  goal: '',
  experience: '',
  environment: '',
  height: '',
  weight: '',
  age: '',
}

export default function SignupPage() {
  const [profile, setProfile] = useState(initialProfile)
  const [message, setMessage] = useState('')

  function handleChange(event) {
    const { name, value } = event.target

    setProfile((previous) => ({
      ...previous,
      [name]: value,
    }))

    setMessage('')
  }

  function handleSubmit(event) {
    event.preventDefault()

    const savedProfile = {
      ...profile,
      height: Number(profile.height),
      weight: Number(profile.weight),
      age: Number(profile.age),
    }

    try {
      localStorage.setItem(
        'demo-profile',
        JSON.stringify(savedProfile)
      )

      setMessage('초기 정보를 브라우저에 저장했어요.')
    } catch {
      setMessage('저장하지 못했어요. 다시 시도해 주세요.')
    }
  }

  return (
    <section>
      <h1>초기 정보 입력</h1>
      <p>운동 계획에 사용할 정보를 입력해 주세요.</p>

      <form onSubmit={handleSubmit}>
        <p>
          <label>
            운동 목표{' '}
            <select
              name="goal"
              value={profile.goal}
              onChange={handleChange}
              required
            >
              <option value="">선택해 주세요</option>
              <option value="muscle">근력 및 근육량 향상</option>
              <option value="fat">체지방 관리</option>
              <option value="fitness">기초 체력 및 심폐지구력 향상</option>
              <option value="general">잘 모르겠어요. 기본 계획 추천</option>
            </select>
          </label>
        </p>

        <p>
          <label>
            운동 경험{' '}
            <select
              name="experience"
              value={profile.experience}
              onChange={handleChange}
              required
            >
              <option value="">선택해 주세요</option>
              <option value="beginner">초보</option>
              <option value="intermediate">경험자</option>
              <option value="advanced">숙련자</option>
            </select>
          </label>
        </p>

        <p>
          <label>
            운동 환경{' '}
            <select
              name="environment"
              value={profile.environment}
              onChange={handleChange}
              required
            >
              <option value="">선택해 주세요</option>
              <option value="campus">교내 스포츠센터 이용 가능</option>
              <option value="gym">일반 헬스장 이용 가능</option>
              <option value="planned">아직 없지만 이용할 예정</option>
            </select>
          </label>
        </p>

        <p>
          <label>
            키(cm){' '}
            <input
              type="number"
              name="height"
              value={profile.height}
              onChange={handleChange}
              min="1"
              max="300"
              step="0.1"
              required
            />
          </label>
        </p>

        <p>
          <label>
            몸무게(kg){' '}
            <input
              type="number"
              name="weight"
              value={profile.weight}
              onChange={handleChange}
              min="1"
              max="500"
              step="0.1"
              required
            />
          </label>
        </p>

        <p>
          <label>
            만 나이{' '}
            <input
              type="number"
              name="age"
              value={profile.age}
              onChange={handleChange}
              min="1"
              max="120"
              step="1"
              required
            />
          </label>
        </p>

        <button type="submit">초기 정보 저장</button>
      </form>

      <p role="status">{message}</p>
    </section>
  )
}