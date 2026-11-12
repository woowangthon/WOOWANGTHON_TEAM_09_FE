import { readStorage, weekdays as dayNames } from './workoutPlan.js'

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

// 매일 적용되는 운동하기 어려운 시간대 하나. 22:00 ~ 07:00처럼 자정을 넘을 수 있어요.
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

export const DEFAULT_PERIOD_LABEL = '운동하기 어려운 시간'

// 자주 쓰는 시간대 (온보딩에서 눌러서 고를 수 있어요)
export const presetPeriods = [
  { id: 'sleep', label: '취침', startTime: '23:00', endTime: '07:00' },
  { id: 'morning', label: '아침', startTime: '07:00', endTime: '09:00' },
  { id: 'lunch', label: '점심', startTime: '12:00', endTime: '13:00' },
  { id: 'dinner', label: '저녁', startTime: '18:00', endTime: '19:00' },
]

// 요일: 앱 기준 '0'(일) ~ '6'(토). 비어 있거나 7일 모두면 null = 매일
const ALL_DAYS = ['0', '1', '2', '3', '4', '5', '6']
const MONDAY_FIRST = ['1', '2', '3', '4', '5', '6', '0']

export function normalizeDays(value) {
  if (!Array.isArray(value)) return null
  const days = MONDAY_FIRST.filter((day) => value.map(String).includes(day))
  return days.length === 0 || days.length === 7 ? null : days
}

// 예: null → '매일', ['1', '3'] → '월·수'
export function daysText(days) {
  return days ? days.map((day) => dayNames[Number(day)]).join('·') : '매일'
}

export function appliesOn(period, weekday) {
  return !period.weekdays || period.weekdays.includes(String(weekday))
}

// 여러 시간대 목록을 검사해요. 예전처럼 하나만 저장된 값도 목록으로 바꿔 줘요.
export function getUnavailablePeriods(value, legacy) {
  const list = Array.isArray(value) ? value : (legacy ? [{ ...legacy, label: DEFAULT_PERIOD_LABEL }] : [])

  return list.flatMap((item, index) => {
    const period = getUnavailablePeriod(item)
    if (!period) return []
    const label = typeof item.label === 'string' && item.label.trim() ? item.label.trim().slice(0, 12) : DEFAULT_PERIOD_LABEL
    const presetId = presetPeriods.find((preset) => preset.label === label)?.id
    const id = typeof item.id === 'string' && item.id ? item.id : presetId ?? `custom-${index}`
    const days = normalizeDays(item.weekdays)
    return [{ id, label, ...period, ...(days ? { weekdays: days } : {}) }]
  })
}

export function crossesMidnight(period) {
  return period.startTime > period.endTime
}

export function getUnavailableTimeLabel(period) {
  if (!period) return '없음'

  return `매일 ${period.startTime} ~ ${crossesMidnight(period) ? '다음 날 ' : ''}${period.endTime}`
}

// 그 요일(0=일 ~ 6=토) 하루 안에서 막히는 구간들. 자정을 넘는 시간대는
// 시작한 날의 밤 구간과 다음 날의 새벽 구간으로 나눠요. 예: 월 23:00~07:00 → 월 23:00~24:00, 화 00:00~07:00
export function getUnavailableSegments(periods, weekday) {
  const previous = (Number(weekday) + 6) % 7

  return periods.flatMap((period) => {
    if (!crossesMidnight(period)) {
      return appliesOn(period, weekday) ? [{ startTime: period.startTime, endTime: period.endTime, period }] : []
    }
    return [
      ...(appliesOn(period, previous) ? [{ startTime: '00:00', endTime: period.endTime, period }] : []),
      ...(appliesOn(period, weekday) ? [{ startTime: period.startTime, endTime: '24:00', period }] : []),
    ]
  })
}

export { ALL_DAYS }

export function loadUnavailablePeriods() {
  const profile = readStorage('demo-profile', null)
  return getUnavailablePeriods(profile?.unavailablePeriods, getUnavailablePeriod(profile?.unavailablePeriod))
}
