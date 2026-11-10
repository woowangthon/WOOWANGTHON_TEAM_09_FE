import { weekdays } from '../workoutPlan.js'
import './WorkoutWeek.css'

// pastDays: 이번 주에서 이미 지나간 요일 수. 지난 날의 기록 없는 운동은 미수행으로 보여줘요.
export default function WorkoutWeek({ sessions, pastDays = 0 }) {
  return (
    <ul className="fit-week" aria-label="요일별 운동 상태">
      {weekdays.map((day, index) => {
        const session = sessions.find((item) => item.day === `${day}요일`)
        const recorded = session?.status ?? '일정 없음'
        const status = index < pastDays && recorded === '기록 없음' ? '미수행' : recorded

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
