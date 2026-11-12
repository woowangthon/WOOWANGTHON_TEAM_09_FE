import { api, clearToken, setToken } from './client.js'
import { clearLocalData } from './profile.js'
import { clearCurrentUser, setCurrentUser } from '../userPrefs.js'
import { findCollege, saveCampus } from '../campus.js'

export const loginIdPattern = /^[a-z][a-z0-9]{3,19}$/

export async function login(name, password) {
  const { access_token: token } = await api('/login', { method: 'POST', body: { name, password }, auth: false })
  setToken(token)
  setCurrentUser(name)
}

// 가입하고 바로 로그인해요.
// 학과는 가입할 때만 보낼 수 있어요. 없으면 대시보드에서 '기타'로 묶여요.
export async function signup(name, password, department) {
  await api('/user', { method: 'POST', body: { name, password, department: department || null }, auth: false })
  await login(name, password)
  saveCampus({ department, college: findCollege(department)?.college })
}

export function getMe() {
  return api('/user')
}

export function logout() {
  clearToken()
  clearCurrentUser()
  clearLocalData()
}
