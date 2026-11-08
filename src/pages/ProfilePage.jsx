import { useState } from 'react'
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
    </section>
  )
}