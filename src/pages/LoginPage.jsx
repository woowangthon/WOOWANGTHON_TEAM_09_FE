import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router'
import { login, loginIdPattern, signup } from '../api/auth.js'
import { clearLocalData, hydrateFromServer } from '../api/profile.js'
import { getToken } from '../api/client.js'
import { departments, findCollege } from '../campus.js'
import './SignupPage.css'
import './LoginPage.css'
import BrandMark from '../components/BrandMark.jsx'
import WelcomeScreen from '../components/WelcomeScreen.jsx'

export default function LoginPage() {
  const navigate = useNavigate()
  // 처음엔 캐릭터 시작 화면, 「우왕코치 시작하기」를 누르면 로그인 창
  const [showWelcome, setShowWelcome] = useState(true)
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ name: '', password: '', confirm: '', department: '' })
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isJoin = mode === 'join'

  if (getToken()) return <Navigate to="/" replace />

  function handleChange(event) {
    const { name, value } = event.target
    setForm((previous) => ({ ...previous, [name]: value }))
    setMessage('')
  }

  function switchMode() {
    setMode(isJoin ? 'login' : 'join')
    setForm((previous) => ({ ...previous, password: '', confirm: '' }))
    setMessage('')
  }

  function validate() {
    if (!isJoin) return form.name && form.password ? '' : '아이디와 비밀번호를 입력해 주세요.'
    if (!loginIdPattern.test(form.name)) return '아이디는 영문 소문자로 시작하는 영문 소문자·숫자 4~20자예요.'
    if (form.password.length < 8) return '비밀번호는 8자 이상이어야 해요.'
    if (form.password !== form.confirm) return '비밀번호가 서로 달라요.'
    if (form.department.trim() && !findCollege(form.department)) return '목록에 없는 학과예요. 학과 이름을 다시 확인해 주세요.'
    return ''
  }

  async function submit(event) {
    event.preventDefault()

    const problem = validate()
    if (problem) {
      setMessage(problem)
      return
    }

    setIsSubmitting(true)
    try {
      // 이전 사용자의 기기 캐시가 섞이지 않게 비워요.
      clearLocalData()

      if (isJoin) {
        await signup(form.name, form.password, findCollege(form.department)?.department)
        navigate('/signup', { replace: true })
        return
      }

      await login(form.name, form.password)
      const me = await hydrateFromServer()
      navigate(me?.info ? '/' : '/signup', { replace: true })
    } catch (error) {
      setMessage(error.message)
      setIsSubmitting(false)
    }
  }

  if (showWelcome) {
    return (
      <div className="fit-setup">
        <BrandMark />
        <WelcomeScreen onStart={() => setShowWelcome(false)} />
      </div>
    )
  }

  return (
    <div className="fit-setup">
      <BrandMark />
      <form className="fit-setup__screen fit-login" onSubmit={submit} noValidate>
        <p className="fit-login__brand">우왕코치</p>
        <h1>{isJoin ? '회원가입' : '로그인'}</h1>
        <p className="fit-login__sub">
          {isJoin ? '캠퍼스 일정에 맞춘 운동 계획을 받아보세요.' : '다시 만나서 반가워요.'}
        </p>

        <div className="fit-login__fields">
          <label>
            <span>아이디</span>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              maxLength={20}
              placeholder={isJoin ? '영문 소문자·숫자 4~20자' : '아이디'}
            />
          </label>
          <label>
            <span>비밀번호</span>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              autoComplete={isJoin ? 'new-password' : 'current-password'}
              maxLength={128}
              placeholder={isJoin ? '8자 이상' : '비밀번호'}
            />
          </label>
          {isJoin && (
            <label>
              <span>비밀번호 확인</span>
              <input
                type="password"
                name="confirm"
                value={form.confirm}
                onChange={handleChange}
                autoComplete="new-password"
                maxLength={128}
                placeholder="비밀번호를 한 번 더"
              />
            </label>
          )}
          {isJoin && (
            <label>
              <span>소속 학과 (선택)</span>
              <input
                name="department"
                value={form.department}
                onChange={handleChange}
                list="join-departments"
                autoComplete="off"
                maxLength={30}
                placeholder="예: 컴퓨터공학과"
              />
              <datalist id="join-departments">
                {departments.map((name) => <option key={name} value={name} />)}
              </datalist>
              <small className="fit-login__college" role="status">
                {findCollege(form.department)
                  ? <>소속 단과대 <strong>{findCollege(form.department).college}</strong> · 학과는 가입 후 바꿀 수 없어요</>
                  : '입력하면 캠퍼스 현황에서 단과대별 순위에 함께해요'}
              </small>
            </label>
          )}
        </div>

        <p className="fit-setup__message" role="alert">{message}</p>

        <div className="fit-setup__options">
          <button className="fit-setup__choice" type="submit" disabled={isSubmitting}>
            {isSubmitting ? '잠시만요...' : isJoin ? '가입하기' : '로그인'}
          </button>
          <button className="fit-setup__prev" type="button" onClick={switchMode}>
            {isJoin ? '이미 계정이 있나요? 로그인' : '처음이신가요? 회원가입'}
          </button>
        </div>
      </form>
    </div>
  )
}
