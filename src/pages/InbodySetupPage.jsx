import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { inbodyInfo, saveInfo } from '../api/profile.js'
import SetupProgress from '../components/SetupProgress.jsx'
import UploadPanel from '../components/UploadPanel.jsx'
import { useImageFile } from '../hooks/useImageFile.js'
import { loadInbody, saveInbody, todayText } from '../inbody.js'
import './SignupPage.css'
import './UploadSetup.css'

export default function InbodySetupPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const fromProfile = searchParams.get('from') === 'profile'
  const nextPath = fromProfile ? '/profile' : '/setup/timetable'
  const [form, setForm] = useState(loadInbody)
  const [isFormOpen, setIsFormOpen] = useState(() => fromProfile && Boolean(form.measuredAt))
  const [message, setMessage] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const firstFieldRef = useRef(null)
  const { image, inputRef, selectFile, clear } = useImageFile(setMessage)

  useEffect(() => {
    if (isFormOpen) firstFieldRef.current?.focus()
  }, [isFormOpen])

  function handleFileChange(event) {
    if (selectFile(event)) {
      setIsFormOpen(true)
      setMessage('')
    }
  }

  function handleChange(event) {
    const { name, value } = event.target
    setForm((previous) => ({ ...previous, [name]: value }))
    setMessage('')
  }

  async function submit(event) {
    event.preventDefault()
    setIsSaving(true)

    try {
      await saveInfo(inbodyInfo(form))
      saveInbody(form)
    } catch (error) {
      setMessage(error.message ?? '저장하지 못했어요. 다시 시도해 주세요.')
      setIsSaving(false)
      return
    }

    navigate(nextPath)
  }

  return (
    <div className="fit-setup">
      {fromProfile ? (
        <div className="fit-setup__top">
          <span>인바디 정보 관리</span>
          <Link to="/profile">닫기</Link>
        </div>
      ) : (
        <SetupProgress step={7} />
      )}

      <div className="fit-setup__screen fit-setup__screen--top">
        <h1>인바디 정보를<br />업로드 해주세요</h1>

        <UploadPanel
          imageAlt="선택한 인바디 결과지"
          image={image}
          inputRef={inputRef}
          onFileChange={handleFileChange}
          onClearImage={() => { clear(); setMessage('') }}
          isFormOpen={isFormOpen}
          onToggleForm={() => setIsFormOpen((open) => !open)}
        />

        {!fromProfile && (
          <button className="fit-setup__skip" type="button" onClick={() => navigate(nextPath)}>다음에 할게요</button>
        )}

        {isFormOpen && (
          <form className="fit-setup__fields fit-setup__panel" onSubmit={submit}>
            <label>
              체지방률 (%)
              <input ref={firstFieldRef} type="number" inputMode="decimal" name="bodyFat" value={form.bodyFat} onChange={handleChange} min="0.1" max="79.9" step="0.1" required />
            </label>
            <label>
              골격근량 (kg)
              <input type="number" inputMode="decimal" name="muscleMass" value={form.muscleMass} onChange={handleChange} min="0.1" max="99.9" step="0.1" required />
            </label>
            <label>
              측정일
              <input type="date" name="measuredAt" value={form.measuredAt} onChange={handleChange} max={todayText()} required />
            </label>
            <button className="fit-setup__add" type="submit" disabled={isSaving}>
              {isSaving ? '저장하는 중...' : fromProfile ? '저장' : '저장하고 다음'}
            </button>
          </form>
        )}

        <p className="fit-setup__status" role="status">{message}</p>
      </div>
    </div>
  )
}
