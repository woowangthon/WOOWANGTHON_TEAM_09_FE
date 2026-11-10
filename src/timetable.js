import { readStorage } from './workoutPlan.js'
import { getWeeklyPeriod } from './workoutAvailability.js'

const STORAGE_KEY = 'demo-timetable'

export function getTimetableClass(value) {
  const period = getWeeklyPeriod(value)

  if (!period || typeof value.id !== 'string' || typeof value.title !== 'string' || !value.title.trim()) {
    return null
  }

  return { id: value.id, title: value.title.trim(), ...period }
}

export function loadTimetable() {
  const classes = readStorage(STORAGE_KEY, [])

  if (!Array.isArray(classes)) return []

  return classes
    .map(getTimetableClass)
    .filter(Boolean)
    .sort((a, b) => a.weekday.localeCompare(b.weekday) || a.startTime.localeCompare(b.startTime))
}

export function saveTimetable(classes) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(classes))
}

// 캘린더의 하루 일정 목록에 그 요일 수업을 더해요.
export function withTimetable(schedules, classes, date) {
  const weekday = String(date.getDay())

  return [
    ...schedules,
    ...classes
      .filter((item) => item.weekday === weekday)
      .map((item) => ({ ...item, id: `class-${item.id}`, isClass: true })),
  ]
}
