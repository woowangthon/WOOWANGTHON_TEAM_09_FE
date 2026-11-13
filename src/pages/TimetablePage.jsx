import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import SetupProgress from '../components/SetupProgress.jsx'
import TimeSelect from '../components/TimeSelect.jsx'
import UploadPanel from '../components/UploadPanel.jsx'
import { useImageFile } from '../hooks/useImageFile.js'
import { moveWorkoutsOutOfBlocksSafely } from '../api/reschedule.js'
import { addClass, deleteClass, refreshTimetable } from '../api/weeklyBlocks.js'
import { getTimetableClass, loadTimetable } from '../timetable.js'
import { weekdays } from '../workoutPlan.js'
import './SignupPage.css'
import './UploadSetup.css'

const initialForm = { title: '', weekday: '1', startTime: '', endTime: '' }

export default function TimetablePage() {
  const [searchParams] = useSearchParams()
  const fromProfile = searchParams.get('from') === 'profile'
  const navigate = useNavigate()

  const [classes, setClasses] = useState(loadTimetable)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [form, setForm] = useState(initialForm)
  const [message, setMessage] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const titleRef = useRef(null)
  const { image, inputRef, selectFile, clear } = useImageFile(setMessage)

  const nextPath = fromProfile ? '/profile' : '/setup/calendar'

  useEffect(() => {
    if (isFormOpen) titleRef.current?.focus()
  }, [isFormOpen])

  // 다른 기기에서 바꾼 수업도 보이게 서버 목록을 받아와요.
  useEffect(() => {
    let ignore = false
    refreshTimetable()
      .then((latest) => { if (!ignore) setClasses(latest) })
      .catch(() => {})
    return () => { ignore = true }
  }, [])

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

  // 서버에 저장한 뒤 서버의 수업 목록으로 화면을 갱신해요.
  async function runSync(action, successMessage) {
    setIsSaving(true)
    try {
      await action()
      setMessage(successMessage)
      // 새 수업과 겹치는 운동이 있으면 빈 시간으로 옮겨요.
      const moved = await moveWorkoutsOutOfBlocksSafely()
      if (moved) setMessage(`${successMessage} ${moved}`)
      return true
    } catch (error) {
      setMessage(error.status === 409 ? '같은 요일에 시간이 겹치는 수업이 있어요.' : error.message)
      return false
    } finally {
      try {
        setClasses(await refreshTimetable())
      } catch {
        // 목록을 다시 못 받아도 이전 목록을 그대로 보여줘요.
      }
      setIsSaving(false)
    }
  }

  async function handleAdd(event) {
    event.preventDefault()

    const item = getTimetableClass({ ...form, id: 'new' })

    if (!item) {
      setMessage(form.title.trim() ? '종료 시간은 시작 시간보다 늦어야 해요.' : '수업 이름을 입력해 주세요.')
      return
    }

    if (await runSync(() => addClass(item), `${item.title} 수업을 추가했어요.`)) {
      setForm((previous) => ({ ...initialForm, weekday: previous.weekday }))
      titleRef.current?.focus()
    }
  }

  function handleDelete(item) {
    runSync(() => deleteClass(item.id), `${item.title} 수업을 삭제했어요.`)
  }

  return (
    <div className="fit-setup">
      {fromProfile ? (
        <div className="fit-setup__top">
          <span>수업 시간표 관리</span>
          <Link to="/profile">닫기</Link>
        </div>
      ) : (
        <SetupProgress step={8} />
      )}

      <div className="fit-setup__screen fit-setup__screen--top">
        <h1>수업 시간표를<br />업로드 해주세요</h1>

        <UploadPanel
          imageAlt="선택한 시간표 사진"
          image={image}
          inputRef={inputRef}
          onFileChange={handleFileChange}
          onClearImage={() => { clear(); setMessage('') }}
          isFormOpen={isFormOpen}
          onToggleForm={() => setIsFormOpen((open) => !open)}
        />

        {!fromProfile && classes.length === 0 && (
          <button className="fit-setup__skip" type="button" onClick={() => navigate(nextPath)}>다음에 할게요</button>
        )}

        {isFormOpen && (
          <form className="fit-setup__fields fit-setup__panel" onSubmit={handleAdd}>
            <label>
              수업 이름
              <input ref={titleRef} name="title" value={form.title} onChange={handleChange} placeholder="예: 자료구조" maxLength={30} required />
            </label>
            <label>
              요일
              <select name="weekday" value={form.weekday} onChange={handleChange}>
                {weekdays.map((day, index) => (
                  <option key={day} value={String(index)}>{day}요일</option>
                ))}
              </select>
            </label>
            <div className="fit-setup__panel-times">
              <TimeSelect label="시작 시간" name="startTime" value={form.startTime} onChange={handleChange} required />
              <TimeSelect label="종료 시간" name="endTime" value={form.endTime} onChange={handleChange} required />
            </div>
            <button className="fit-setup__add" type="submit" disabled={isSaving}>{isSaving ? '저장하는 중...' : '수업 추가'}</button>
          </form>
        )}

        {classes.length > 0 && (
          <section className="fit-setup__list" aria-labelledby="timetable-classes">
            <h2 id="timetable-classes">등록한 수업 {classes.length}개</h2>
            <ul>
              {classes.map((item) => (
                <li key={item.id}>
                  <span>
                    <strong>{item.title}</strong>
                    <small>{weekdays[Number(item.weekday)]}요일 {item.startTime} ~ {item.endTime}</small>
                  </span>
                  <button type="button" onClick={() => handleDelete(item)} disabled={isSaving} aria-label={`${item.title} 수업 삭제`}>
                    삭제
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        <p className="fit-setup__status" role="status">{message}</p>

        {(fromProfile || classes.length > 0) && (
          <button className="fit-setup__choice fit-setup__next" type="button" onClick={() => navigate(nextPath)}>
            {fromProfile ? '완료' : '다음'}
          </button>
        )}
      </div>
    </div>
  )
}
