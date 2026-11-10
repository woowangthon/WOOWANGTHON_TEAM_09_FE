const BASE_URL = (import.meta.env?.VITE_API_BASE_URL ?? 'https://woowangthonteam09be-production.up.railway.app').replace(/\/$/, '')
const TOKEN_KEY = 'auth-token'

export class ApiError extends Error {
  constructor(status, message, detail) {
    super(message)
    this.status = status
    this.detail = detail
  }
}

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY)
  } catch {
    // 저장소를 못 쓰면 지울 것도 없어요.
  }
}

// 서버 오류 detail을 사용자에게 보여줄 한국어 문장으로 바꿔요.
function errorMessage(status, detail) {
  if (typeof detail === 'string') return detail
  if (detail && typeof detail.message === 'string') return detail.message
  if (status === 422) return '입력한 값을 다시 확인해 주세요.'
  if (status >= 500) return '서버에 문제가 생겼어요. 잠시 후 다시 시도해 주세요.'
  return '요청을 처리하지 못했어요. 다시 시도해 주세요.'
}

// 인증이 필요한 요청에서 401이 오면 토큰을 지우고 로그인 화면으로 보내요.
export async function api(path, { method = 'GET', body, auth = true, query } = {}) {
  const url = new URL(`${BASE_URL}${path}`)
  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null) url.searchParams.set(key, value)
  })

  const headers = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (auth) {
    const token = getToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }

  let response
  try {
    response = await fetch(url, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) })
  } catch {
    throw new ApiError(0, '서버에 연결하지 못했어요. 인터넷 연결을 확인해 주세요.')
  }

  if (response.status === 204) return null

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    if (response.status === 401 && auth) {
      clearToken()
      if (window.location.pathname !== '/login') window.location.assign('/login')
    }

    throw new ApiError(response.status, errorMessage(response.status, data?.detail), data?.detail)
  }

  return data
}
