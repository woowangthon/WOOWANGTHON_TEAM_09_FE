import { useState } from 'react'
import { Link } from 'react-router'
import { toTime } from '../freeTime.js'
import { formatKoreanTime } from '../workoutPlan.js'
import './MissedWorkoutCard.css'

function partOfDay(minutes) {
  if (minutes >= 18 * 60) return '저녁'
  if (minutes >= 12 * 60) return '오후'
  return '오전'
}

// 하지 못한 운동을 오늘 빈 시간으로 옮기자고 제안하는 카드 내용
export default function MissedWorkoutCard({ title, note, session, slots, onMove, showCalendarLink = true }) {
  const [showOthers, setShowOthers] = useState(false)
  const preferred = slots.find((slot) => slot >= 18 * 60) ?? slots[0]
  const others = slots.filter((slot) => slot !== preferred).slice(0, 3)

  return (
    <div className="fit-missed">
      <h3>{title}</h3>
      {note && <p className="fit-missed__note">{note}</p>}
      {preferred === undefined ? (
        <>
          <p>「{session.title}」 운동을 오늘 할 수 있는 빈 시간이 없어요.</p>
          {showCalendarLink && <Link className="fit-missed__button" to="/schedule">캘린더에서 확인하기</Link>}
        </>
      ) : (
        <>
          <p>
            「{session.title}」 운동을 오늘 {partOfDay(preferred)}에 해볼까요?<br />캘린더에 비어 있는 시간이에요.
          </p>
          <button className="fit-missed__button" type="button" onClick={() => onMove(preferred)}>
            오늘 {formatKoreanTime(toTime(preferred))}에 하기
          </button>
          {others.length > 0 && (
            <button
              className="fit-missed__button fit-missed__button--dark"
              type="button"
              aria-expanded={showOthers}
              onClick={() => setShowOthers((open) => !open)}
            >
              다른 시간 보기
            </button>
          )}
          {showOthers && (
            <div className="fit-missed__slots" role="group" aria-label="다른 가능한 시간">
              {others.map((slot) => (
                <button key={slot} type="button" onClick={() => onMove(slot)}>
                  {formatKoreanTime(toTime(slot))}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
