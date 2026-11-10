import { loadTimetable } from './timetable.js'
import { getUnavailableSegments, loadUnavailablePeriod } from './workoutAvailability.js'
import { createPlan, loadPlan, readStorage } from './workoutPlan.js'

const VARIANT_KEY = 'demo-plan-variant'

export function loadPlanVariant() {
  const variant = readStorage(VARIANT_KEY, 0)
  return Number.isInteger(variant) && variant >= 0 ? variant : 0
}

export function savePlanVariant(variant) {
  localStorage.setItem(VARIANT_KEY, JSON.stringify(variant))
}

export function loadBlockedPeriods() {
  return [...getUnavailableSegments(loadUnavailablePeriod()), ...loadTimetable()]
}

// 승인 전 추천 계획 (운동하기 어려운 시간·수업 시간 반영)
export function createDraftPlan(variant = loadPlanVariant()) {
  return createPlan(loadBlockedPeriods(), variant)
}

// 승인한 계획이 있으면 그것을, 없으면 추천 계획을 돌려줘요.
export function loadCurrentPlan() {
  const approved = loadPlan()
  const plan = typeof approved?.approvedAt === 'string' ? approved : null

  return { plan: plan ?? createDraftPlan(), isApproved: Boolean(plan) }
}
