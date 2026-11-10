import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router'
import { getMe, login, loginIdPattern, signup } from '../api/auth.js'
import { getToken } from '../api/client.js'
import './SignupPage.css'
import './LoginPage.css'

export default function LoginPage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ name: '', password: '', confirm: '' })
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
      if (isJoin) {
        await signup(form.name, form.password)
        navigate('/signup', { replace: true })
        return
      }

      await login(form.name, form.password)
      const me = await getMe()
      navigate(me?.info ? '/' : '/signup', { replace: true })
    } catch (error) {
      setMessage(error.message)
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fit-setup">
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
