import { api, clearToken, setToken } from './client.js'
import { clearLocalData } from './profile.js'

export const loginIdPattern = /^[a-z][a-z0-9]{3,19}$/

export async function login(name, password) {
  const { access_token: token } = await api('/login', { method: 'POST', body: { name, password }, auth: false })
  setToken(token)
}

// 가입하고 바로 로그인해요.
export async function signup(name, password) {
  await api('/user', { method: 'POST', body: { name, password }, auth: false })
  await login(name, password)
}

export function getMe() {
  return api('/user')
}

export function logout() {
  clearToken()
  clearLocalData()
}
