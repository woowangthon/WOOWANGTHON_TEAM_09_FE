import { useState } from 'react'
import { useNavigate } from 'react-router'
import SetupProgress from '../components/SetupProgress.jsx'
import './SignupPage.css'
import './CalendarConnectPage.css'

export default function CalendarConnectPage() {
  const navigate = useNavigate()
  const [message, setMessage] = useState('')

  return (
    <div className="fit-setup">
      <SetupProgress step={9} />

      <div className="fit-connect">
        <section className="fit-connect__card" aria-labelledby="connect-title">
          <h1 id="connect-title">캘린더를 연결할까요?</h1>
          <p>캘린더 일정의 날짜와 시간을 확인해<br />운동 가능한 시간대를 추천해 드려요.</p>
          <button
            className="fit-connect__primary"
            type="button"
            onClick={() => setMessage('Google 캘린더 연동은 준비 중이에요. 지금은 나중에 하기를 눌러 주세요.')}
          >
            캘린더 연동
          </button>
          <button className="fit-connect__secondary" type="button" onClick={() => navigate('/plan/generate')}>
            나중에 할게요
          </button>
          <p className="fit-connect__message" role="status">{message}</p>
        </section>
      </div>
    </div>
  )
}
