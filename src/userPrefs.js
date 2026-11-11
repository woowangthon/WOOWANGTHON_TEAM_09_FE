import { readStorage } from './workoutPlan.js'

// 서버에 저장할 곳이 없는 값(이름·목표·헬스장·어려운 시간대)을 아이디별로 이 기기에 보관해요.
// 로그아웃해도 지우지 않아서, 같은 아이디로 다시 로그인하면 복원돼요.
const USER_KEY = 'auth-user'
const prefsKey = (user) => `user-prefs:${user}`

export function getCurrentUser() {
  try {
    return localStorage.getItem(USER_KEY)
  } catch {
    return null
  }
}

export function setCurrentUser(name) {
  localStorage.setItem(USER_KEY, name)
}

export function clearCurrentUser() {
  try {
    localStorage.removeItem(USER_KEY)
  } catch {
    // 저장소를 못 쓰면 지울 것도 없어요.
  }
}

export function loadPrefs(user = getCurrentUser()) {
  if (!user) return {}
  const prefs = readStorage(prefsKey(user), {})
  return prefs && typeof prefs === 'object' ? prefs : {}
}

export function savePrefs(changes, user = getCurrentUser()) {
  if (!user) return
  try {
    localStorage.setItem(prefsKey(user), JSON.stringify({ ...loadPrefs(user), ...changes }))
  } catch {
    // 보관하지 못해도 이번 사용에는 지장이 없어요.
  }
}
