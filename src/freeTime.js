import { loadTimetable } from './timetable.js'
import { getUnavailableSegments, loadUnavailablePeriods } from './workoutAvailability.js'

export function toMinutes(time) {
  const [hour, minute] = time.split(':').map(Number)
  return hour * 60 + minute
}

export function toTime(minutes) {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
}

// 그날 운동할 수 없는 구간: 운동하기 어려운 시간 · 그 요일 수업 · 그날 일정(periods: {startTime, endTime})
export function getBusyPeriods(date, periods = []) {
  const weekday = String(date.getDay())

  return [
    ...getUnavailableSegments(loadUnavailablePeriods(), weekday),
    ...loadTimetable().filter((item) => item.weekday === weekday),
    ...periods,
  ].map((period) => ({ start: toMinutes(period.startTime), end: toMinutes(period.endTime) }))
}

// from(분) 이후 30분 간격으로 운동을 넣을 수 있는 시작 시각들 (서버와 같이 08:00~22:00)
export function getFreeSlots(busy, duration, from, { dayStart = 8 * 60, dayEnd = 22 * 60 } = {}) {
  const slots = []
  const first = Math.max(dayStart, Math.ceil(from / 30) * 30)

  for (let start = first; start + duration <= dayEnd; start += 30) {
    if (busy.every((period) => start + duration <= period.start || start >= period.end)) {
      slots.push(start)
    }
  }

  return slots
}
