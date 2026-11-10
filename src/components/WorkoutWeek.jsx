import { addDays, dateKey, weekdays, weekRange } from '../workoutPlan.js'
import './WorkoutWeek.css'

// 이번 주 월~일 운동 상태 점. sessions는 날짜(date)가 있는 운동 일정이에요.
export default function WorkoutWeek({ sessions, today = new Date() }) {
  const { start } = weekRange(today)

  return (
    <ul className="fit-week" aria-label="요일별 운동 상태">
      {Array.from({ length: 7 }, (_, index) => {
        const date = addDays(start, index)
        const day = weekdays[date.getDay()]
        const daySessions = sessions.filter((session) => session.date === dateKey(date))
        const status = daySessions.length === 0
          ? '일정 없음'
          : daySessions.find((session) => session.status !== '완료')?.status ?? '완료'

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
