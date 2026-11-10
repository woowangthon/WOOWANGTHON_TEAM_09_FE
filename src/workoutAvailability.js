import { readStorage } from './workoutPlan.js'

const clockTime = /^([01]\d|2[0-3]):[0-5]\d$/

// 요일이 있는 주간 시간대 (수업 시간표 등)
export function getWeeklyPeriod(value) {
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

// 매일 적용되는 운동하기 어려운 시간대. 22:00 ~ 07:00처럼 자정을 넘을 수 있어요.
export function getUnavailablePeriod(value) {
  if (
    typeof value?.startTime !== 'string' ||
    typeof value.endTime !== 'string' ||
    !clockTime.test(value.startTime) ||
    !clockTime.test(value.endTime) ||
    value.startTime === value.endTime
  ) {
    return null
  }

  return { startTime: value.startTime, endTime: value.endTime }
}

export function crossesMidnight(period) {
  return period.startTime > period.endTime
}

export function getUnavailableTimeLabel(period) {
  if (!period) return '없음'

  return `매일 ${period.startTime} ~ ${crossesMidnight(period) ? '다음 날 ' : ''}${period.endTime}`
}

// 하루 안에서 막히는 구간들. 자정을 넘으면 두 구간으로 나눠요.
export function getUnavailableSegments(period) {
  if (!period) return []

  return crossesMidnight(period)
    ? [
        { startTime: '00:00', endTime: period.endTime },
        { startTime: period.startTime, endTime: '24:00' },
      ]
    : [{ startTime: period.startTime, endTime: period.endTime }]
}

export function withUnavailablePeriod(schedules, period) {
  return [
    ...schedules,
    ...getUnavailableSegments(period).map((segment, index) => ({
      ...segment,
      id: `unavailable-${index}`,
      title: '운동하기 어려운 시간',
      isUnavailable: true,
    })),
  ]
}

export function loadUnavailablePeriod() {
  return getUnavailablePeriod(readStorage('demo-profile', null)?.unavailablePeriod)
}
