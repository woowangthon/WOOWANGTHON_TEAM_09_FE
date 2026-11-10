import { useState } from 'react'
import { Link } from 'react-router'
import FitNavigation from '../components/FitNavigation.jsx'
import { getStatus, getValidRecord, loadPlan, loadRecords, weekdays } from '../workoutPlan.js'
import './SchedulePage.css'

const STORAGE_KEY = 'demo-schedules'

const initialForm = {
  title: '',
  date: '',
  startTime: '',
  endTime: '',
}

function loadSchedules() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)

    if (!saved) return []

    const schedules = JSON.parse(saved)

    if (!Array.isArray(schedules)) return []

    return schedules.filter(
      (schedule) =>
        schedule &&
        typeof schedule.id === 'string' &&
        typeof schedule.title === 'string' &&
        typeof schedule.date === 'string' &&
        typeof schedule.startTime === 'string' &&
        typeof schedule.endTime === 'string'
    )
  } catch {
    return []
  }
}

const dateLabel = new Intl.DateTimeFormat('ko-KR', {
  month: 'long',
  day: 'numeric',
  weekday: 'long',
})

function dateKey(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function monthStart(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function weekStart(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() - date.getDay())
}

function workoutForDate(plan, date) {
  if (!plan || typeof plan.approvedAt !== 'string') return null

  const approvedAt = new Date(plan.approvedAt)

  // The demo plan has weekdays only, so show it in the week it was approved.
  if (dateKey(weekStart(approvedAt)) !== dateKey(weekStart(date))) return null

  return plan.sessions.find((session) => session.day === `${weekdays[date.getDay()]}요일`) ?? null
}

function MonthCalendar({ month, selectedKey, todayKey, schedules, plan, records, onSelect, onMonthChange }) {
  const year = month.getFullYear()
  const monthIndex = month.getMonth()
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
  const scheduledDates = new Set(schedules.map((schedule) => schedule.date))

  return (
    <section className="fit-calendar__card" aria-label="월간 달력">
      <div className="fit-calendar__month">
        <button type="button" aria-label="이전 달" onClick={() => onMonthChange(-1)}>‹</button>
        <h2 aria-live="polite">{year}년 {monthIndex + 1}월</h2>
        <button type="button" aria-label="다음 달" onClick={() => onMonthChange(1)}>›</button>
      </div>

      <div className="fit-calendar__grid">
        {weekdays.map((day) => (
          <span className="fit-calendar__weekday" key={day}>{day}</span>
        ))}
        {Array.from({ length: month.getDay() }, (_, index) => (
          <span key={`blank-${index}`} aria-hidden="true" />
        ))}
        {Array.from({ length: daysInMonth }, (_, index) => {
          const day = index + 1
          const date = new Date(year, monthIndex, day)
          const key = dateKey(date)
          const workout = workoutForDate(plan, date)
          const hasSchedule = scheduledDates.has(key)
          const status = workout ? getStatus(getValidRecord(records, plan.id, workout.id)) : null
          const label = [dateLabel.format(date)]

          if (workout) label.push(status === '기록 없음' ? '운동 예정' : `운동 ${status}`)
          if (hasSchedule) label.push('생활 일정 있음')

          return (
            <button
              key={key}
              type="button"
              className="fit-calendar__day"
              aria-label={label.join(', ')}
              aria-pressed={key === selectedKey}
              aria-current={key === todayKey ? 'date' : undefined}
              onClick={() => onSelect(date)}
            >
              {day}
              <span className="fit-calendar__markers" aria-hidden="true">
                {workout && <span className="fit-calendar__workout-dot" data-status={status} />}
                {hasSchedule && <span className="fit-calendar__schedule-dot" />}
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}

export default function SchedulePage() {
  const [today] = useState(() => new Date())
  const [selectedDate, setSelectedDate] = useState(today)
  const [month, setMonth] = useState(() => monthStart(today))
  const [schedules, setSchedules] = useState(loadSchedules)
  const [plan] = useState(loadPlan)
  const [records] = useState(loadRecords)
  const [form, setForm] = useState(() => ({ ...initialForm, date: dateKey(today) }))
  const [message, setMessage] = useState('')

  const selectedKey = dateKey(selectedDate)
  const selectedSchedules = schedules.filter((schedule) => schedule.date === selectedKey)
  const workout = workoutForDate(plan, selectedDate)
  const workoutStatus = workout ? getStatus(getValidRecord(records, plan.id, workout.id)) : null

  function selectDate(date) {
    setSelectedDate(date)
    setForm((previous) => ({ ...previous, date: dateKey(date) }))
    setMessage('')
  }

  function changeMonth(offset) {
    const nextMonth = new Date(month.getFullYear(), month.getMonth() + offset, 1)

    setMonth(nextMonth)
    selectDate(nextMonth)
  }

  function handleChange(event) {
    const { name, value } = event.target

    setForm((previous) => ({ ...previous, [name]: value }))
    setMessage('')
  }

  function saveSchedules(nextSchedules) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSchedules))
      setSchedules(nextSchedules)
      return true
    } catch {
      setMessage('저장하지 못했어요. 다시 시도해 주세요.')
      return false
    }
  }

  function addSchedule(event) {
    event.preventDefault()

    if (!form.title.trim()) {
      setMessage('일정 이름을 입력해 주세요.')
      return
    }

    if (form.startTime >= form.endTime) {
      setMessage('종료 시간은 시작 시간보다 늦어야 해요.')
      return
    }

    const newSchedule = {
      id: crypto.randomUUID(),
      ...form,
      title: form.title.trim(),
    }

    const nextSchedules = [...schedules, newSchedule].sort((a, b) =>
      `${a.date}T${a.startTime}`.localeCompare(`${b.date}T${b.startTime}`)
    )

    if (saveSchedules(nextSchedules)) {
      const date = new Date(`${form.date}T00:00:00`)
      setSelectedDate(date)
      setMonth(monthStart(date))
      setForm({ ...initialForm, date: form.date })
      setMessage('일정을 추가했어요.')
    }
  }

  function deleteSchedule(id) {
    if (saveSchedules(schedules.filter((schedule) => schedule.id !== id))) {
      setMessage('일정을 삭제했어요.')
    }
  }

  return (
    <div className="fit-calendar">
      <h1>일정</h1>
      <MonthCalendar
        month={month}
        selectedKey={selectedKey}
        todayKey={dateKey(today)}
        schedules={schedules}
        plan={plan}
        records={records}
        onSelect={selectDate}
        onMonthChange={changeMonth}
      />
      <p className="fit-calendar__legend">
        <span><i className="fit-calendar__workout-dot" /> 운동</span>
        <span><i className="fit-calendar__schedule-dot" /> 생활 일정</span>
      </p>

      <section className="fit-calendar__card fit-calendar__day-details" aria-labelledby="schedule-date">
        <h2 id="schedule-date">{dateLabel.format(selectedDate)}</h2>
        {workout ? (
          <>
            <h3>{workout.title}</h3>
            <p>{workout.time} 시작 · {workout.duration}분 · {workoutStatus === '기록 없음' ? '예정' : workoutStatus}</p>
            <Link className="fit-calendar__action" to={`/workout?session=${encodeURIComponent(workout.id)}`}>
              운동 완료 기록
            </Link>
          </>
        ) : (
          <p>예정된 운동이 없어요.</p>
        )}
        {!plan && <Link to="/plan">운동 계획 보기</Link>}

        <h3 className="fit-calendar__schedule-title">생활 일정</h3>
        {selectedSchedules.length === 0 ? (
          <p>등록된 일정이 없어요.</p>
        ) : (
          <ul className="fit-calendar__events">
            {selectedSchedules.map((schedule) => (
              <li key={schedule.id}>
                <div>
                  <strong>{schedule.title}</strong>
                  <p>{schedule.startTime} ~ {schedule.endTime}</p>
                </div>
                <button type="button" onClick={() => deleteSchedule(schedule.id)} aria-label={`${schedule.title} 일정 삭제`}>
                  삭제
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <details className="fit-calendar__card fit-calendar__add">
        <summary>생활 일정 추가</summary>
        <form onSubmit={addSchedule}>
          <label>
            일정 이름
            <input name="title" value={form.title} onChange={handleChange} placeholder="예: 팀 프로젝트 회의" maxLength={100} required />
          </label>
          <label>
            날짜
            <input type="date" name="date" value={form.date} onChange={handleChange} required />
          </label>
          <div className="fit-calendar__times">
            <label>
              시작 시간
              <input type="time" name="startTime" value={form.startTime} onChange={handleChange} required />
            </label>
            <label>
              종료 시간
              <input type="time" name="endTime" value={form.endTime} onChange={handleChange} required />
            </label>
          </div>
          <button type="submit" className="fit-calendar__action">일정 추가</button>
        </form>
      </details>
      <p className="fit-calendar__message" role="status">{message}</p>

      <FitNavigation />
    </div>
  )
}
