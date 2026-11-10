import { useState } from 'react'
import { Link } from 'react-router'
import FitNavigation from '../components/FitNavigation.jsx'
import { loadInbody } from '../inbody.js'
import { loadTimetable } from '../timetable.js'
import { formatKoreanTime } from '../workoutPlan.js'
import { crossesMidnight, getUnavailablePeriod } from '../workoutAvailability.js'
import './ProfilePage.css'

const goalLabels = {
  muscle: '근력 향상',
  fat: '체지방 관리',
  fitness: '체력 향상',
  unsure: '목표 미정',
  general: '기본 계획',
}

const experienceLabels = {
  beginner: '초보자',
  intermediate: '중급자',
  advanced: '숙련자',
}

const environmentLabels = {
  gym: '이용 가능',
  campus: '이용 가능',
  planned: '이용 예정',
  none: '이용 어려움',
}

function loadProfile() {
  try {
    const profile = JSON.parse(localStorage.getItem('demo-profile'))

    if (
      !profile ||
      !Object.hasOwn(goalLabels, profile.goal) ||
      !Object.hasOwn(experienceLabels, profile.experience) ||
      !Number.isFinite(profile.height) ||
      !Number.isFinite(profile.weight) ||
      profile.height <= 0 ||
      profile.weight <= 0
    ) {
      return null
    }

    return profile
  } catch {
    return null
  }
}

function unavailableLabel(value) {
  const period = getUnavailablePeriod(value)
  if (!period) return '없음'

  return `매일 ${formatKoreanTime(period.startTime)} ~ ${crossesMidnight(period) ? '다음 날 ' : ''}${formatKoreanTime(period.endTime)}`
}

function RowLink({ to, title, detail }) {
  return (
    <Link className="fit-profile__card fit-profile__row" to={to}>
      <span>
        <strong>{title}</strong>
        <small>{detail}</small>
      </span>
      <span aria-hidden="true">›</span>
    </Link>
  )
}

export default function ProfilePage() {
  const [profile] = useState(loadProfile)
  const [inbody] = useState(loadInbody)
  const [timetableCount] = useState(() => loadTimetable().length)

  if (!profile) {
    return (
      <div className="fit-profile">
        <section className="fit-profile__card fit-profile__hero">
          <span className="fit-profile__avatar" aria-hidden="true" />
          <div>
            <h1>내 운동 프로필</h1>
            <p>운동 정보를 등록해 주세요.</p>
          </div>
        </section>
        <Link className="fit-profile__start" to="/signup">프로필 만들기</Link>
        <FitNavigation />
      </div>
    )
  }

  return (
    <div className="fit-profile">
      <section className="fit-profile__card fit-profile__hero">
        <span className="fit-profile__avatar" aria-hidden="true">
          <svg viewBox="0 0 24 24"><circle cx="12" cy="9" r="4.2" /><path d="M4 21a8 8 0 0 1 16 0z" /></svg>
        </span>
        <div>
          <h1>{profile.name ? `${profile.name}님의 운동 프로필` : '내 운동 프로필'}</h1>
          <p>{goalLabels[profile.goal]} · {experienceLabels[profile.experience]}</p>
        </div>
        <Link className="fit-profile__edit" to="/signup" aria-label="운동 프로필 전체 수정">수정</Link>
      </section>

      <section className="fit-profile__group" aria-labelledby="profile-workout">
        <h2 id="profile-workout">운동 정보</h2>
        <dl className="fit-profile__card fit-profile__list">
          <div><dt>운동 목표</dt><dd>{goalLabels[profile.goal]}</dd></div>
          <div><dt>운동 경험</dt><dd>{experienceLabels[profile.experience]}</dd></div>
          {environmentLabels[profile.environment] && (
            <div><dt>헬스장</dt><dd>{environmentLabels[profile.environment]}</dd></div>
          )}
        </dl>
      </section>

      <section className="fit-profile__group" aria-labelledby="profile-body">
        <h2 id="profile-body">신체 정보</h2>
        <Link className="fit-profile__card fit-profile__body" to="/signup?edit=body">
          <strong>키 {profile.height}cm · 몸무게 {profile.weight}kg</strong>
          <small>신체 정보 수정 ›</small>
        </Link>
        <RowLink
          to="/setup/inbody?from=profile"
          title="인바디 정보"
          detail={inbody.measuredAt ? `체지방률 ${inbody.bodyFat}% · 골격근량 ${inbody.muscleMass}kg` : '등록하기'}
        />
      </section>

      <section className="fit-profile__group" aria-labelledby="profile-schedule">
        <h2 id="profile-schedule">일정 및 연결</h2>
        <RowLink to="/signup?edit=time" title="운동하기 어려운 시간" detail={unavailableLabel(profile.unavailablePeriod)} />
        <RowLink
          to="/setup/timetable?from=profile"
          title="주간 시간표"
          detail={timetableCount ? `등록한 수업 ${timetableCount}개` : '수업 시간 등록하기'}
        />
        <RowLink to="/setup/calendar?from=profile" title="Google 캘린더" detail="연결 안 됨" />
      </section>

      <FitNavigation />
    </div>
  )
}
