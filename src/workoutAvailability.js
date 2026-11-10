import { readStorage, weekdays } from './workoutPlan.js'

const clockTime = /^([01]\d|2[0-3]):[0-5]\d$/

export function getUnavailablePeriod(value) {
  if (
    typeof value?.weekday !== 'string' ||
    !/^[0-6]$/.test(value.weekday) ||
    typeof value.startTime !== 'string' ||
    typeof value.endTime !== 'string' ||
    !clockTime.test(value.startTime) ||
    !clockTime.test(value.endTime) ||
    value.startTime >= value.endTime
  ) {
    return null
  }

  return { weekday: value.weekday, startTime: value.startTime, endTime: value.endTime }
}

export function getUnavailableTimeLabel(period) {
  return period
    ? `${weekdays[Number(period.weekday)]}요일 ${period.startTime} ~ ${period.endTime}`
    : '제한 없음'
}

export function withUnavailablePeriod(schedules, period, date) {
  if (period?.weekday !== String(date.getDay())) return schedules

  return [...schedules, { ...period, title: '운동하기 어려운 시간', isUnavailable: true }]
}

export function loadUnavailablePeriod() {
  return getUnavailablePeriod(readStorage('demo-profile', null)?.unavailablePeriod)
}
