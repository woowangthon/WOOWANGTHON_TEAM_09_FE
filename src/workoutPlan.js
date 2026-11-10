// 날짜·시간 공통 함수
export const weekdays = ['일', '월', '화', '수', '목', '금', '토']

export function readStorage(key, fallback) {
  try {
    const saved = localStorage.getItem(key)
    return saved ? JSON.parse(saved) : fallback
  } catch {
    return fallback
  }
}

// '18:00' → '오후 6:00'
export function formatKoreanTime(time) {
  const [hour, minute] = time.split(':').map(Number)
  const period = hour < 12 ? '오전' : '오후'
  const displayHour = hour % 12 === 0 ? 12 : hour % 12

  return `${period} ${displayHour}:${String(minute).padStart(2, '0')}`
}

export function dateKey(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')
}

// 'YYYY-MM-DD' → 그날 0시 Date
export function parseDateKey(key) {
  const [year, month, day] = key.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function addDays(date, days) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days)
}

// 서버 기준 한 주는 월요일~일요일
export function weekRange(date) {
  const monday = addDays(date, -((date.getDay() + 6) % 7))
  return { start: monday, end: addDays(monday, 6) }
}
