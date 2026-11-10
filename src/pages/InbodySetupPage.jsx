import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import SetupProgress from '../components/SetupProgress.jsx'
import UploadPanel from '../components/UploadPanel.jsx'
import { useImageFile } from '../hooks/useImageFile.js'
import { loadInbody, saveInbody, todayText } from '../inbody.js'
import './SignupPage.css'
import './UploadSetup.css'

const NEXT_PATH = '/setup/timetable'

export default function InbodySetupPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState(loadInbody)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [message, setMessage] = useState('')
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

  function submit(event) {
    event.preventDefault()

    try {
      saveInbody(form)
    } catch {
      setMessage('저장하지 못했어요. 다시 시도해 주세요.')
      return
    }

    navigate(NEXT_PATH)
  }

  return (
    <div className="fit-setup">
      <SetupProgress step={7} />

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

        <button className="fit-setup__skip" type="button" onClick={() => navigate(NEXT_PATH)}>다음에 할게요</button>

        {isFormOpen && (
          <form className="fit-setup__fields fit-setup__panel" onSubmit={submit}>
            <label>
              체지방률 (%)
              <input ref={firstFieldRef} type="number" inputMode="decimal" name="bodyFat" value={form.bodyFat} onChange={handleChange} min="0.1" max="100" step="0.1" required />
            </label>
            <label>
              골격근량 (kg)
              <input type="number" inputMode="decimal" name="muscleMass" value={form.muscleMass} onChange={handleChange} min="0.1" step="0.1" required />
            </label>
            <label>
              측정일
              <input type="date" name="measuredAt" value={form.measuredAt} onChange={handleChange} max={todayText()} required />
            </label>
            <button className="fit-setup__add" type="submit">저장하고 다음</button>
          </form>
        )}

        <p className="fit-setup__status" role="status">{message}</p>
      </div>
    </div>
  )
}
