import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import TimeSelect from '../components/TimeSelect.jsx'
import { getTimetableClass, loadTimetable, saveTimetable } from '../timetable.js'
import { weekdays } from '../workoutPlan.js'
import './SignupPage.css'
import './TimetablePage.css'

const initialForm = { title: '', weekday: '1', startTime: '', endTime: '' }
const imageTypes = ['image/jpeg', 'image/png', 'image/webp']

export default function TimetablePage() {
  const [searchParams] = useSearchParams()
  const fromProfile = searchParams.get('from') === 'profile'
  const navigate = useNavigate()

  const [classes, setClasses] = useState(loadTimetable)
  const [image, setImage] = useState(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [form, setForm] = useState(initialForm)
  const [message, setMessage] = useState('')
  const inputRef = useRef(null)
  const titleRef = useRef(null)

  const nextPath = fromProfile ? '/profile' : '/plan/generate'

  useEffect(() => {
    if (!image) return

    return () => URL.revokeObjectURL(image.url)
  }, [image])

  useEffect(() => {
    if (isFormOpen) titleRef.current?.focus()
  }, [isFormOpen])

  function handleFileChange(event) {
    const file = event.target.files?.[0]

    if (!file) return

    if (!imageTypes.includes(file.type)) {
      setMessage('JPG, PNG, WEBP 이미지를 선택해 주세요.')
      event.target.value = ''
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setMessage('10MB 이하의 이미지를 선택해 주세요.')
      event.target.value = ''
      return
    }

    setImage({ file, url: URL.createObjectURL(file) })
    setIsFormOpen(true)
    setMessage('')
  }

  function removeImage() {
    setImage(null)
    setMessage('')

    if (inputRef.current) inputRef.current.value = ''
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
    <div className="fit-setup fit-timetable">
      <div className="fit-setup__top">
        <span>{fromProfile ? '주간 시간표 관리' : '운동 프로필 설정'}</span>
        <Link to={nextPath}>{fromProfile ? '닫기' : '건너뛰기'}</Link>
      </div>

      <h1>주간 시간표를<br />업로드해 주세요</h1>
      <p className="fit-setup__hint">수업 시간을 피해서 운동 계획을 짜요.</p>

      <div className="fit-timetable__preview">
        {image ? (
          <img src={image.url} alt="선택한 시간표 사진" onError={() => setMessage('이미지를 표시할 수 없어요. 다른 파일을 선택해 주세요.')} />
        ) : (
          <span>시간표 사진을 올리거나<br />수업을 직접 입력해 주세요.</span>
        )}
      </div>

      {image && (
        <p className="fit-timetable__file">
          <span>{image.file.name}</span>
          <button type="button" onClick={removeImage}>사진 지우기</button>
        </p>
      )}

      <div className="fit-timetable__buttons">
        <label className="fit-timetable__pill">
          사진 업로드
          <input ref={inputRef} type="file" accept={imageTypes.join(',')} onChange={handleFileChange} />
        </label>
        <button
          className="fit-timetable__pill"
          type="button"
          aria-expanded={isFormOpen}
          onClick={() => setIsFormOpen((open) => !open)}
        >
          직접 입력
        </button>
      </div>

      {image && (
        <p className="fit-timetable__note">사진 속 시간표 자동 인식은 준비 중이에요. 사진을 보며 수업을 입력해 주세요.</p>
      )}

      {isFormOpen && (
        <form className="fit-setup__fields fit-timetable__form" onSubmit={addClass}>
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
          <div className="fit-timetable__times">
            <TimeSelect label="시작 시간" name="startTime" value={form.startTime} onChange={handleChange} required />
            <TimeSelect label="종료 시간" name="endTime" value={form.endTime} onChange={handleChange} required />
          </div>
          <button className="fit-timetable__add" type="submit">수업 추가</button>
        </form>
      )}

      {classes.length > 0 && (
        <section className="fit-timetable__classes" aria-labelledby="timetable-classes">
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

      <p className="fit-setup__message fit-timetable__message" role="status">{message}</p>

      <div className="fit-setup__actions">
        <button className="fit-setup__primary" type="button" onClick={() => navigate(nextPath)}>
          {fromProfile ? '완료' : classes.length ? '다음' : '시간표 없이 다음'}
        </button>
      </div>
    </div>
  )
}
