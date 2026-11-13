import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { inbodyInfo, readInbodyImage, saveInfo } from '../api/profile.js'
import SetupProgress from '../components/SetupProgress.jsx'
import UploadPanel from '../components/UploadPanel.jsx'
import { useImageFile } from '../hooks/useImageFile.js'
import { loadInbody, saveInbody, todayText } from '../inbody.js'
import { readStorage } from '../workoutPlan.js'
import './SignupPage.css'
import './UploadSetup.css'

const missingLabels = { height: '키', weight: '몸무게', body_fat_percent: '체지방률', skeletal_muscle_kg: '골격근량', inbody_measured_at: '측정일' }

// 인바디 입력 칸: 결과지의 키·몸무게도 함께 받아 프로필 신체 정보를 갱신해요.
function loadForm() {
  const profile = readStorage('demo-profile', null)
  return {
    ...loadInbody(),
    height: Number.isFinite(profile?.height) ? String(profile.height) : '',
    weight: Number.isFinite(profile?.weight) ? String(profile.weight) : '',
  }
}

// 이 기기 프로필의 키·몸무게도 바로 바꿔서 프로필 화면에 반영돼요.
function updateProfileBody(height, weight) {
  const profile = readStorage('demo-profile', null)
  if (!profile) return
  localStorage.setItem('demo-profile', JSON.stringify({ ...profile, height, weight }))
}

export default function InbodySetupPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const fromProfile = searchParams.get('from') === 'profile'
  const nextPath = fromProfile ? '/profile' : '/setup/timetable'
  const [form, setForm] = useState(loadForm)
  const [isFormOpen, setIsFormOpen] = useState(() => fromProfile && Boolean(form.measuredAt))
  const [message, setMessage] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [reading, setReading] = useState(null)
  const readId = useRef(0)
  const firstFieldRef = useRef(null)
  const { image, inputRef, selectFile, clear } = useImageFile(setMessage)

  useEffect(() => {
    if (isFormOpen) firstFieldRef.current?.focus()
  }, [isFormOpen])

  // 사진을 고르면 서버가 결과지를 읽어 칸을 채워요. 틀릴 수 있어서 저장 전에 확인받아요.
  async function handleFileChange(event) {
    const file = event.target.files?.[0]
    if (!selectFile(event)) return

    setIsFormOpen(true)
    setMessage('')
    setReading({ status: 'reading' })
    const id = ++readId.current

    try {
      const result = await readInbodyImage(file)
      if (id !== readId.current) return

      setForm((previous) => ({
        height: result.height ?? previous.height,
        weight: result.weight ?? previous.weight,
        bodyFat: result.body_fat_percent ?? previous.bodyFat,
        muscleMass: result.skeletal_muscle_kg ?? previous.muscleMass,
        measuredAt: result.inbody_measured_at ?? previous.measuredAt,
      }))
      setReading({ status: 'done', missing: result.missing ?? [], warnings: result.warnings ?? [] })
    } catch (error) {
      if (id !== readId.current) return
      setReading({ status: 'failed', message: error.message })
    }
  }

  function clearImage() {
    readId.current += 1
    clear()
    setReading(null)
    setMessage('')
  }

  let readingNote
  if (reading?.status === 'reading') readingNote = '사진을 읽는 중이에요... 10초 정도 걸릴 수 있어요.'
  else if (reading?.status === 'failed') readingNote = `사진을 읽지 못했어요. 직접 입력해 주세요. (${reading.message})`
  else if (reading?.status === 'done') {
    readingNote = reading.missing.length
      ? `${reading.missing.map((key) => missingLabels[key] ?? key).join(', ')}은(는) 찾지 못했어요. 직접 입력해 주세요.`
      : '사진에서 읽은 값이에요. 맞는지 확인하고 저장해 주세요.'
  }

  function handleChange(event) {
    const { name, value } = event.target
    setForm((previous) => ({ ...previous, [name]: value }))
    setMessage('')
  }

  async function submit(event) {
    event.preventDefault()
    setIsSaving(true)

    // 키·몸무게는 정수로 저장해요. (서버 /info 형식, BMI 계산에도 쓰여요)
    const height = Math.round(Number(form.height))
    const weight = Math.round(Number(form.weight))

    try {
      await saveInfo({ ...inbodyInfo(form), height, weight })
      saveInbody(form)
      updateProfileBody(height, weight)
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
          onClearImage={clearImage}
          isFormOpen={isFormOpen}
          onToggleForm={() => setIsFormOpen((open) => !open)}
          note={readingNote}
        />

        {reading?.warnings?.length > 0 && (
          <ul className="fit-setup__warnings">
            {reading.warnings.map((warning) => <li key={warning}>{warning}</li>)}
          </ul>
        )}

        {!fromProfile && (
          <button className="fit-setup__skip" type="button" onClick={() => navigate(nextPath)}>다음에 할게요</button>
        )}

        {isFormOpen && (
          <form className="fit-setup__fields fit-setup__panel" onSubmit={submit}>
            <div className="fit-setup__pair">
              <label>
                키 (cm)
                <input ref={firstFieldRef} type="number" inputMode="numeric" name="height" value={form.height} onChange={handleChange} min="51" max="249" step="1" required />
              </label>
              <label>
                몸무게 (kg)
                <input type="number" inputMode="numeric" name="weight" value={form.weight} onChange={handleChange} min="11" max="299" step="1" required />
              </label>
            </div>
            <label>
              체지방률 (%)
              <input type="number" inputMode="decimal" name="bodyFat" value={form.bodyFat} onChange={handleChange} min="0.1" max="79.9" step="0.1" required />
            </label>
            <label>
              골격근량 (kg)
              <input type="number" inputMode="decimal" name="muscleMass" value={form.muscleMass} onChange={handleChange} min="0.1" max="99.9" step="0.1" required />
            </label>
            <label>
              측정일
              <input type="date" name="measuredAt" value={form.measuredAt} onChange={handleChange} max={todayText()} required />
            </label>
            <button className="fit-setup__add" type="submit" disabled={isSaving || reading?.status === 'reading'}>
              {isSaving ? '저장하는 중...' : fromProfile ? '저장' : '저장하고 다음'}
            </button>
          </form>
        )}

        <p className="fit-setup__status" role="status">{message}</p>
      </div>
    </div>
  )
}
