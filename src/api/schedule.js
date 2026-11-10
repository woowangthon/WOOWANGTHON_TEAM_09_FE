import { api } from './client.js'

export const listSchedules = (start, end) => api('/schedule', { query: { start, end } })
export const getSchedule = (id) => api(`/schedule/${id}`)
export const createSchedule = (body) => api('/schedule', { method: 'POST', body })
export const replaceSchedule = (id, body) => api(`/schedule/${id}`, { method: 'PUT', body })
export const deleteSchedule = (id) => api(`/schedule/${id}`, { method: 'DELETE' })
export const setExerciseCompleted = (id, completed) =>
  api(`/workout-exercise/${id}`, { method: 'PUT', body: { completed } })

// 409 일정 겹침 응답을 사용자 문장으로
export function conflictMessage(error) {
  const conflicts = error.detail?.conflicts
  if (!Array.isArray(conflicts) || conflicts.length === 0) return error.message

  const names = conflicts.map((item) => item.name ?? item.schedule ?? item.workout).filter(Boolean)
  return `${error.message}${names.length ? ` (${names.join(', ')})` : ''}`
}
