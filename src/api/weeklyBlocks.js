import { api } from './client.js'
import { loadTimetable, saveTimetable } from '../timetable.js'
import { getUnavailableSegments, loadUnavailablePeriod } from '../workoutAvailability.js'

// 서버 반복 일정 중 '운동하기 어려운 시간'은 이 이름으로 구분해요.
export const UNAVAILABLE_NAME = '운동하기 어려운 시간'

// 앱 요일(0=일 ~ 6=토) ↔ 서버 요일(1=월 ~ 7=일)
export const toServerWeekday = (weekday) => (Number(weekday) === 0 ? 7 : Number(weekday))
export const fromServerWeekday = (weekday) => String(weekday === 7 ? 0 : weekday)

const toMinutes = (time) => {
  const [hour, minute] = time.split(':').map(Number)
  return hour * 60 + minute
}
const toTime = (minutes) => {
  const clamped = Math.min(minutes, 23 * 60 + 59)
  return `${String(Math.floor(clamped / 60)).padStart(2, '0')}:${String(clamped % 60).padStart(2, '0')}`
}

function isUnavailable(block) {
  return block.name === UNAVAILABLE_NAME
}

function toClass(block) {
  return {
    id: String(block.id),
    title: block.name ?? '수업',
    weekday: fromServerWeekday(block.weekday),
    startTime: block.start_time.slice(0, 5),
    endTime: block.end_time.slice(0, 5),
  }
}

export function listBlocks() {
  return api('/weekly-block')
}

// 서버의 수업 목록을 받아 이 기기 캐시에 저장하고 돌려줘요.
export async function refreshTimetable() {
  const blocks = await listBlocks()
  const classes = blocks.filter((block) => !isUnavailable(block)).map(toClass)
  saveTimetable(classes)
  return loadTimetable()
}

// 매일 반복되는 어려운 시간대를 요일별 구간으로 나누고, 수업 시간은 빼요. (서버는 같은 요일 겹침을 거부해요)
export function unavailablePieces(period, classes) {
  const segments = getUnavailableSegments(period).map((segment) => [toMinutes(segment.startTime), toMinutes(segment.endTime)])
  const pieces = []

  for (let weekday = 0; weekday < 7; weekday += 1) {
    const busy = classes
      .filter((item) => item.weekday === String(weekday))
      .map((item) => [toMinutes(item.startTime), toMinutes(item.endTime)])

    for (const [start, end] of segments) {
      let parts = [[start, end]]
      for (const [busyStart, busyEnd] of busy) {
        parts = parts.flatMap(([partStart, partEnd]) =>
          busyEnd <= partStart || busyStart >= partEnd
            ? [[partStart, partEnd]]
            : [[partStart, busyStart], [busyEnd, partEnd]].filter(([a, b]) => b - a >= 1)
        )
      }
      parts
        .filter(([a, b]) => toTime(b) > toTime(a))
        .forEach(([a, b]) => pieces.push({ weekday: toServerWeekday(weekday), start_time: toTime(a), end_time: toTime(b), name: UNAVAILABLE_NAME }))
    }
  }

  return pieces
}

// 어려운 시간 구간을 지우고 operation(수업 추가·삭제 등)을 한 뒤, 현재 수업을 피해 다시 만들어요.
export async function withUnavailableRebuilt(period, operation) {
  const blocks = await listBlocks()
  await Promise.all(blocks.filter(isUnavailable).map((block) => api(`/weekly-block/${block.id}`, { method: 'DELETE' })))

  try {
    if (operation) await operation()
  } finally {
    const classes = await refreshTimetable()
    await Promise.all(unavailablePieces(period, classes).map((piece) => api('/weekly-block', { method: 'POST', body: piece })))
  }
}

export function saveUnavailablePeriod(period) {
  return withUnavailableRebuilt(period)
}

export async function addClass(item) {
  await withUnavailableRebuilt(loadUnavailablePeriod(), () =>
    api('/weekly-block', {
      method: 'POST',
      body: { weekday: toServerWeekday(item.weekday), start_time: item.startTime, end_time: item.endTime, name: item.title },
    })
  )
}

export async function deleteClass(id) {
  await withUnavailableRebuilt(loadUnavailablePeriod(), () => api(`/weekly-block/${id}`, { method: 'DELETE' }))
}
