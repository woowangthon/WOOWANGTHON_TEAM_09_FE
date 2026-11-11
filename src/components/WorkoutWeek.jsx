import { addDays, dateKey, weekdays, weekRange } from '../workoutPlan.js'
import './WorkoutWeek.css'

// 이번 주 월~일 운동 상태 점. sessions는 날짜(date)가 있는 운동 일정이에요.
// 채운 민트 원: 운동한 날 / 테두리 원: 운동이 있는데 안 한 날 / 회색 원: 운동 없는 날
export default function WorkoutWeek({ sessions, today = new Date() }) {
  const { start } = weekRange(today)

  return (
    <ul className="fit-week" aria-label="요일별 운동 상태">
      {Array.from({ length: 7 }, (_, index) => {
        const date = addDays(start, index)
        const day = weekdays[date.getDay()]
        const daySessions = sessions.filter((session) => session.date === dateKey(date))
        const status = daySessions.length === 0
          ? '운동 없음'
          : daySessions.some((session) => session.status === '완료' || session.status === '부분 완료')
            ? '운동함'
            : '운동 안 함'

        return (
          <li key={day}>
            <span aria-hidden="true">{day}</span>
            <span className="fit-week__dot" data-status={status} aria-hidden="true" />
            <span className="fit-week__sr-only">{day}요일 {status}</span>
          </li>
        )
      })}
    </ul>
  )
}
