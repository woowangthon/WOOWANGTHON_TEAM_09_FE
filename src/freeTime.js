import { loadBlockedPeriods } from './planDraft.js'
import { readStorage } from './workoutPlan.js'

export function toMinutes(time) {
  const [hour, minute] = time.split(':').map(Number)
  return hour * 60 + minute
}

export function toTime(minutes) {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
}

export function dateKey(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')
}

// 그날 운동할 수 없는 구간: 운동하기 어려운 시간 · 그 요일 수업 · 그 날짜 생활 일정
export function getBusyPeriods(date) {
  const weekday = String(date.getDay())
  const key = dateKey(date)
  const schedules = readStorage('demo-schedules', [])

  return [
    ...loadBlockedPeriods().filter((period) => period.weekday === undefined || period.weekday === weekday),
    ...(Array.isArray(schedules) ? schedules : []).filter(
      (schedule) =>
        schedule?.date === key &&
        typeof schedule.startTime === 'string' &&
        typeof schedule.endTime === 'string'
    ),
  ].map((period) => ({ start: toMinutes(period.startTime), end: toMinutes(period.endTime) }))
}

// from(분) 이후 30분 간격으로 운동을 넣을 수 있는 시작 시각들
export function getFreeSlots(busy, duration, from, { dayStart = 9 * 60, dayEnd = 22 * 60 } = {}) {
  const slots = []
  const first = Math.max(dayStart, Math.ceil(from / 30) * 30)

  for (let start = first; start + duration <= dayEnd; start += 30) {
    if (busy.every((period) => start + duration <= period.start || start >= period.end)) {
      slots.push(start)
    }
  }

  return slots
}
