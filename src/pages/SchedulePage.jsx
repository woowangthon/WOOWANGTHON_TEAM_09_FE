import { useState } from 'react'
import { Link } from 'react-router'
import { loadPeriod, withExerciseChecked } from '../api/plan.js'
import { conflictMessage, createSchedule, deleteSchedule, replaceSchedule } from '../api/schedule.js'
import FitNavigation from '../components/FitNavigation.jsx'
import MissedWorkoutCard from '../components/MissedWorkoutCard.jsx'
import TimeSelect from '../components/TimeSelect.jsx'
import WorkoutChecklist from '../components/WorkoutChecklist.jsx'
import { getBusyPeriods, getFreeSlots, toTime } from '../freeTime.js'
import { useAsync } from '../hooks/useAsync.js'
import { loadTimetable } from '../timetable.js'
import { getUnavailableSegments, loadUnavailablePeriods } from '../workoutAvailability.js'
import { addDays, dateKey, formatKoreanTime, weekdays, weekRange } from '../workoutPlan.js'
import './SchedulePage.css'

const initialForm = { title: '', date: '', startTime: '', endTime: '' }
const dateLabel = new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' })
const stateLabels = { done: '운동 완료', partial: '운동 부분 완료', missed: '운동 안 함', planned: '운동 예정' }
const stateByStatus = { 완료: 'done', '부분 완료': 'partial', 미수행: 'missed', '기록 없음': 'planned' }

const timeOf = (term) => term.slice(11, 16)

// 생활 일정을 추가할 날짜에 이미 있는 일정: 운동 · 수업 · 생활 일정 · 운동하기 어려운 시간 (시간순)
function itemsOnDate(key, sessions, life) {
  const weekday = String(new Date(`${key}T00:00:00`).getDay())
  const items = [
    ...sessions.filter((session) => session.date === key)
      .map((session) => ({ id: `w-${session.id}`, kind: '운동', title: session.title, start: session.time, end: session.endTime })),
    ...loadTimetable().filter((item) => item.weekday === weekday)
      .map((item) => ({ id: `c-${item.id}`, kind: '수업', title: item.title, start: item.startTime, end: item.endTime })),
    ...life.filter((item) => item.start_term.startsWith(key))
      .map((item) => ({ id: `l-${item.id}`, kind: '일정', title: item.name ?? '일정', start: timeOf(item.start_term), end: timeOf(item.end_term), life: item })),
    ...getUnavailableSegments(loadUnavailablePeriods(), weekday)
      .map((segment, index) => ({ id: `u-${segment.period.id}-${index}`, kind: '어려운 시간', title: segment.period.label, start: segment.startTime, end: segment.endTime })),
  ]
  return items.sort((a, b) => a.start.localeCompare(b.start))
}

function monthStart(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function MonthCalendar({ month, selectedKey, todayKey, sessions, life, onSelect, onMonthChange }) {
  const year = month.getFullYear()
  const monthIndex = month.getMonth()
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
  const lifeDates = new Set(life.map((item) => item.start_term.slice(0, 10)))

  return (
    <section className="fit-calendar__card fit-calendar__month-card" aria-label="월간 달력">
      <div className="fit-calendar__month">
        <h2 aria-live="polite">{year}.{String(monthIndex + 1).padStart(2, '0')}</h2>
        <span>
          <button type="button" aria-label="이전 달" onClick={() => onMonthChange(-1)}>‹</button>
          <button type="button" aria-label="다음 달" onClick={() => onMonthChange(1)}>›</button>
        </span>
      </div>

      <div className="fit-calendar__grid">
        {weekdays.map((day) => (
          <span className="fit-calendar__weekday" key={day}>{day}</span>
        ))}
        {Array.from({ length: month.getDay() }, (_, index) => (
          <span key={`blank-${index}`} aria-hidden="true" />
        ))}
        {Array.from({ length: daysInMonth }, (_, index) => {
          const date = new Date(year, monthIndex, index + 1)
          const key = dateKey(date)
          const daySessions = sessions.filter((session) => session.date === key)
          const status = daySessions.find((session) => session.status !== '완료')?.status ?? daySessions[0]?.status
          const state = status ? stateByStatus[status] : undefined
          const hasLife = lifeDates.has(key)
          const label = [dateLabel.format(date)]

          if (state) label.push(stateLabels[state])
          if (hasLife) label.push('생활 일정 있음')

          return (
            <button
              key={key}
              type="button"
              className="fit-calendar__day"
              data-state={state}
              aria-label={label.join(', ')}
              aria-pressed={key === selectedKey}
              aria-current={key === todayKey ? 'date' : undefined}
              onClick={() => onSelect(date)}
            >
              <span>{index + 1}</span>
              {hasLife && <i className="fit-calendar__schedule-dot" aria-hidden="true" />}
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
  const [form, setForm] = useState(() => ({ ...initialForm, date: dateKey(today) }))
  const [message, setMessage] = useState('')
  const [workoutMessage, setWorkoutMessage] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // 달력에 보이는 달에 걸친 주 전체를 불러와요.
  const rangeStart = weekRange(month).start
  const rangeEnd = weekRange(new Date(month.getFullYear(), month.getMonth() + 1, 0)).end
  const { data, error, loading, reload, setData } = useAsync(() => loadPeriod(rangeStart, rangeEnd), [dateKey(rangeStart), dateKey(rangeEnd)])

  const sessions = data?.sessions ?? []
  const life = data?.life ?? []
  const todayKey = dateKey(today)
  const selectedKey = dateKey(selectedDate)
  const isToday = selectedKey === todayKey
  const isYesterday = selectedKey === dateKey(addDays(today, -1))

  const daySessions = sessions.filter((session) => session.date === selectedKey)
  const dayLife = life.filter((item) => item.start_term.startsWith(selectedKey))
  const formItems = form.date ? itemsOnDate(form.date, sessions, life) : []
  const formDateLoaded = form.date >= dateKey(rangeStart) && form.date <= dateKey(rangeEnd)
  const todaySessions = sessions.filter((session) => session.date === todayKey)

  function selectDate(date) {
    setSelectedDate(date)
    setForm((previous) => ({ ...previous, date: dateKey(date) }))
    setMessage('')
    setWorkoutMessage('')
  }

  function changeMonth(offset) {
    const nextMonth = new Date(month.getFullYear(), month.getMonth() + offset, 1)
    setMonth(nextMonth)
    selectDate(nextMonth)
  }

  function slotsFor(session) {
    const periods = [
      ...life.filter((item) => item.start_term.startsWith(todayKey)).map((item) => ({ startTime: timeOf(item.start_term), endTime: timeOf(item.end_term) })),
      ...todaySessions.map((item) => ({ startTime: item.time, endTime: item.endTime })),
    ]
    return getFreeSlots(getBusyPeriods(today, periods), session.duration, today.getHours() * 60 + today.getMinutes() + 30)
  }

  async function moveToToday(session, minutes) {
    const start = toTime(minutes)

    try {
      await replaceSchedule(session.id, {
        name: session.name,
        start_term: `${todayKey}T${start}`,
        end_term: `${todayKey}T${toTime(minutes + session.duration)}`,
      })
      selectDate(today)
      setMonth(monthStart(today))
      setWorkoutMessage(`오늘 ${formatKoreanTime(start)}로 옮겼어요.`)
      reload()
    } catch (caught) {
      setWorkoutMessage(caught.status === 409 ? conflictMessage(caught) : caught.message)
    }
  }

  function updateExercise(sessionId, exerciseId, completed) {
    setData((previous) => ({ ...previous, sessions: withExerciseChecked(previous.sessions, sessionId, exerciseId, completed) }))
  }

  function handleChange(event) {
    const { name, value } = event.target
    setForm((previous) => ({ ...previous, [name]: value }))
    setMessage('')
  }

  async function addLifeSchedule(event) {
    event.preventDefault()

    if (!form.title.trim()) {
      setMessage('일정 이름을 입력해 주세요.')
      return
    }
    if (!form.startTime || !form.endTime || form.startTime >= form.endTime) {
      setMessage('종료 시간은 시작 시간보다 늦어야 해요.')
      return
    }

    setIsSaving(true)
    try {
      await createSchedule({
        name: form.title.trim(),
        start_term: `${form.date}T${form.startTime}`,
        end_term: `${form.date}T${form.endTime}`,
      })
      const date = new Date(`${form.date}T00:00:00`)
      setMonth(monthStart(date))
      setSelectedDate(date)
      setForm({ ...initialForm, date: form.date })
      setMessage('일정을 추가했어요.')
      reload()
    } catch (caught) {
      setMessage(caught.status === 409 ? conflictMessage(caught) : caught.message)
    } finally {
      setIsSaving(false)
    }
  }

  async function removeLifeSchedule(item) {
    try {
      await deleteSchedule(item.id)
      setMessage('일정을 삭제했어요.')
      reload()
    } catch (caught) {
      setMessage(caught.message)
    }
  }

  function renderSession(session) {
    const state = stateByStatus[session.status]
    const canMove = state === 'missed' && todaySessions.length === 0

    if (canMove) {
      return (
        <MissedWorkoutCard
          key={session.id}
          title={isYesterday ? '어제는 쉬어가셨네요' : '이날은 쉬어가셨네요'}
          note={`「${session.title}」 ${formatKoreanTime(session.time)} 일정이었어요.`}
          session={session}
          slots={slotsFor(session)}
          onMove={(minutes) => moveToToday(session, minutes)}
          showCalendarLink={false}
        />
      )
    }

    return (
      <div key={session.id} className="fit-calendar__workout">
        <div className="fit-calendar__title-row">
          <h3>{session.title}</h3>
          {state === 'done' && <span className="fit-calendar__badge">완료</span>}
        </div>
        <p className="fit-calendar__meta">
          {formatKoreanTime(session.time)} 시작 · {session.duration}분
          {session.completedCount > 0 && ` · ${session.completedCount}/${session.exercises.length}종목`}
          {state === 'missed' && ' · 하지 못했어요'}
        </p>
        {isToday ? (
          <WorkoutChecklist session={session} onExerciseChange={updateExercise}>
            <p className="fit-calendar__summary">
              {session.exercises.slice(0, 2).map((exercise) => <span key={exercise.id}>{exercise.name} {exercise.detail}</span>)}
              {session.exercises.length > 2 && <span>외 {session.exercises.length - 2}개</span>}
            </p>
          </WorkoutChecklist>
        ) : (
          <Link className="fit-calendar__action" to={`/plan/${session.id}`}>운동 상세 보기</Link>
        )}
      </div>
    )
  }

  return (
    <div className="fit-calendar">
      <h1 className="fit-calendar__sr-only">캘린더</h1>
      <MonthCalendar
        month={month}
        selectedKey={selectedKey}
        todayKey={todayKey}
        sessions={sessions}
        life={life}
        onSelect={selectDate}
        onMonthChange={changeMonth}
      />

      <section className="fit-calendar__card fit-calendar__day-card" aria-labelledby="schedule-date">
        <p id="schedule-date" className="fit-calendar__date">
          {selectedDate.getMonth() + 1}월 {selectedDate.getDate()}일 {isToday ? '오늘' : `${weekdays[selectedDate.getDay()]}요일`}
        </p>

        {loading && !data && <div className="fit-skeleton" role="status" aria-label="일정을 불러오는 중이에요"><span /><span /><span /></div>}
        {error && (
          <>
            <p className="fit-calendar__meta" role="alert">{error.message}</p>
            <button className="fit-calendar__action" type="button" onClick={reload}>다시 불러오기</button>
          </>
        )}
        {data && daySessions.length === 0 && <h3>예정된 운동이 없어요</h3>}
        {daySessions.map(renderSession)}
        {workoutMessage && <p className="fit-calendar__message" role="status">{workoutMessage}</p>}
      </section>

      <details className="fit-calendar__card fit-calendar__life">
        <summary>
          <span>생활 일정</span>
          <small>{dayLife.length ? `이날 ${dayLife.length}개` : '추가하기'}</small>
        </summary>

        <form className="fit-calendar__add" onSubmit={addLifeSchedule}>
          <label>
            일정 이름
            <input name="title" value={form.title} onChange={handleChange} placeholder="예: 팀 프로젝트 회의" maxLength={100} required />
          </label>
          <label>
            날짜
            <input type="date" name="date" value={form.date} onChange={handleChange} required />
          </label>

          {/* 겹치지 않게 고를 수 있도록 그날 이미 있는 일정을 보여줘요. */}
          <div className="fit-calendar__existing" aria-live="polite">
            <p className="fit-calendar__existing-title">이날 일정</p>
            {formItems.length ? (
              <ul className="fit-calendar__events">
                {formItems.map((item) => (
                  <li key={item.id} data-kind={item.kind}>
                    <div>
                      <strong><small className="fit-calendar__kind">{item.kind}</small>{item.title}</strong>
                      <p>{item.start} ~ {item.end}</p>
                    </div>
                    {item.life && (
                      <button type="button" onClick={() => removeLifeSchedule(item.life)} aria-label={`${item.title} 삭제`}>
                        삭제
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="fit-calendar__existing-empty">비어 있는 날이에요.</p>
            )}
            {!formDateLoaded && <p className="fit-calendar__existing-empty">운동·생활 일정은 달력에서 그 달로 이동하면 함께 보여요.</p>}
          </div>
          <div className="fit-calendar__times">
            <TimeSelect label="시작 시간" name="startTime" value={form.startTime} onChange={handleChange} required />
            <TimeSelect label="종료 시간" name="endTime" value={form.endTime} onChange={handleChange} required />
          </div>
          <button type="submit" className="fit-calendar__action" disabled={isSaving}>
            {isSaving ? '저장하는 중...' : '일정 추가'}
          </button>
        </form>
        <p className="fit-calendar__message" role="status">{message}</p>
      </details>

      <FitNavigation />
    </div>
  )
}
