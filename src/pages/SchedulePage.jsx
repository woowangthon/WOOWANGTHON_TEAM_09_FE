import { useState } from 'react'

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

export default function SchedulePage() {
  const [schedules, setSchedules] = useState(loadSchedules)
  const [form, setForm] = useState(initialForm)
  const [message, setMessage] = useState('')

  function handleChange(event) {
    const { name, value } = event.target

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }))

    setMessage('')
  }

  // 저장에 성공했을 때만 화면의 목록도 변경한다.
  function saveSchedules(nextSchedules) {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(nextSchedules)
      )

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
      title: form.title.trim(),
      date: form.date,
      startTime: form.startTime,
      endTime: form.endTime,
    }

    const nextSchedules = [...schedules, newSchedule].sort(
      (a, b) =>
        `${a.date}T${a.startTime}`.localeCompare(
          `${b.date}T${b.startTime}`
        )
    )

    if (saveSchedules(nextSchedules)) {
      setForm(initialForm)
      setMessage('일정을 추가했어요.')
    }
  }

  function deleteSchedule(id) {
    const nextSchedules = schedules.filter(
      (schedule) => schedule.id !== id
    )

    if (saveSchedules(nextSchedules)) {
      setMessage('일정을 삭제했어요.')
    }
  }

  return (
    <section>
      <h1>일정 관리</h1>
      <p>수업, 아르바이트, 팀 프로젝트 일정을 등록하세요.</p>

      <form onSubmit={addSchedule}>
        <p>
          <label>
            일정 이름{' '}
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="예: 팀 프로젝트 회의"
              maxLength={100}
              required
            />
          </label>
        </p>

        <p>
          <label>
            날짜{' '}
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              required
            />
          </label>
        </p>

        <p>
          <label>
            시작 시간{' '}
            <input
              type="time"
              name="startTime"
              value={form.startTime}
              onChange={handleChange}
              required
            />
          </label>
        </p>

        <p>
          <label>
            종료 시간{' '}
            <input
              type="time"
              name="endTime"
              value={form.endTime}
              onChange={handleChange}
              required
            />
          </label>
        </p>

        <button type="submit">일정 추가</button>
      </form>

      <p role="status">{message}</p>

      <section>
        <h2>등록된 일정 ({schedules.length}개)</h2>

        {schedules.length === 0 ? (
          <p>아직 등록된 일정이 없어요.</p>
        ) : (
          <ul>
            {schedules.map((schedule) => (
              <li key={schedule.id}>
                <h3>{schedule.title}</h3>
                <p>
                  {schedule.date}
                  {' · '}
                  {schedule.startTime} ~ {schedule.endTime}
                </p>

                <button
                  type="button"
                  onClick={() => deleteSchedule(schedule.id)}
                  aria-label={`${schedule.title} 일정 삭제`}
                >
                  삭제
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  )
}