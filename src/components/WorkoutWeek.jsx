import { weekdays } from '../workoutPlan.js'
import './WorkoutWeek.css'

export default function WorkoutWeek({ sessions }) {
  return (
    <ul className="fit-week" aria-label="요일별 운동 상태">
      {weekdays.map((day) => {
        const session = sessions.find((item) => item.day === `${day}요일`)
        const status = session?.status ?? '일정 없음'

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
