import { readStorage } from './workoutPlan.js'

const STORAGE_KEY = 'demo-feedback'

export const feedbackReasons = [
  { value: 'time', label: '시간이 부족했어요' },
  { value: 'intensity', label: '운동 강도가 너무 높았어요' },
  { value: 'condition', label: '피로하거나 컨디션이 좋지 않았어요' },
  { value: 'equipment', label: '운동 기구를 사용할 수 없었어요' },
  { value: 'personal', label: '기타 개인 사정이 있었어요' },
]

export function loadFeedback() {
  const saved = readStorage(STORAGE_KEY, {})
  return saved && typeof saved === 'object' && !Array.isArray(saved) ? saved : {}
}

export function saveFeedback(planId, sessionId, reason) {
  const next = { ...loadFeedback(), [`${planId}:${sessionId}`]: { reason, savedAt: new Date().toISOString() } }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  return next
}
