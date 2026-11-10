import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import SetupProgress from '../components/SetupProgress.jsx'
import TimeSelect from '../components/TimeSelect.jsx'
import UploadPanel from '../components/UploadPanel.jsx'
import { useImageFile } from '../hooks/useImageFile.js'
import { getTimetableClass, loadTimetable, saveTimetable } from '../timetable.js'
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
  const titleRef = useRef(null)
  const { image, inputRef, selectFile, clear } = useImageFile(setMessage)

  const nextPath = fromProfile ? '/profile' : '/setup/calendar'

  useEffect(() => {
    if (isFormOpen) titleRef.current?.focus()
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

  function updateClasses(nextClasses, successMessage) {
    try {
      saveTimetable(nextClasses)
      setClasses(loadTimetable())
      setMessage(successMessage)
      return true
    } catch {
      setMessage('저장하지 못했어요. 다시 시도해 주세요.')
      return false
    }
  }

  function addClass(event) {
    event.preventDefault()

    const item = getTimetableClass({ ...form, id: crypto.randomUUID() })

    if (!item) {
      setMessage(form.title.trim() ? '종료 시간은 시작 시간보다 늦어야 해요.' : '수업 이름을 입력해 주세요.')
      return
    }

    if (updateClasses([...classes, item], `${item.title} 수업을 추가했어요.`)) {
      setForm((previous) => ({ ...initialForm, weekday: previous.weekday }))
      titleRef.current?.focus()
    }
  }

  function deleteClass(item) {
    updateClasses(classes.filter((saved) => saved.id !== item.id), `${item.title} 수업을 삭제했어요.`)
  }

  return (
    <div className="fit-setup">
      {fromProfile ? (
        <div className="fit-setup__top">
          <span>주간 시간표 관리</span>
          <Link to="/profile">닫기</Link>
        </div>
      ) : (
        <SetupProgress step={8} />
      )}

      <div className="fit-setup__screen fit-setup__screen--top">
        <h1>주간 시간표를<br />업로드 해주세요</h1>

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
          <form className="fit-setup__fields fit-setup__panel" onSubmit={addClass}>
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
            <button className="fit-setup__add" type="submit">수업 추가</button>
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
                  <button type="button" onClick={() => deleteClass(item)} aria-label={`${item.title} 수업 삭제`}>
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
