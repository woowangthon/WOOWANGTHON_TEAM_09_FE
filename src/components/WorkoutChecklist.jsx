import { useState } from 'react'
import { setExerciseCompleted } from '../api/schedule.js'
import ExerciseIcon from './ExerciseIcon.jsx'
import './WorkoutChecklist.css'

// 「운동 완료 기록」을 누르면 펼쳐지는 종목 체크 목록. 홈과 캘린더에서 같이 써요.
export default function WorkoutChecklist({ session, onExerciseChange, children }) {
  const [isOpen, setIsOpen] = useState(false)
  const [savingId, setSavingId] = useState(null)
  const [message, setMessage] = useState('')
  const total = session.exercises.length

  async function toggle(exercise) {
    setSavingId(exercise.id)
    try {
      await setExerciseCompleted(exercise.id, !exercise.completed)
      const done = session.completedCount + (exercise.completed ? -1 : 1)
      onExerciseChange(session.id, exercise.id, !exercise.completed)
      setMessage(done === total ? '오늘 운동을 모두 완료했어요!' : `${done}/${total} 종목 완료`)
    } catch (error) {
      setMessage(error.message)
    } finally {
      setSavingId(null)
    }
  }

  return (
    <>
      {isOpen && children}

      <button
        className={`fit-check__toggle${isOpen ? ' fit-check__toggle--open' : ''}`}
        type="button"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
      >
        {isOpen ? '접기' : '운동 완료 기록'}
      </button>

      {isOpen && (
        <ul className="fit-check__list" aria-label="운동 종목 체크">
          {session.exercises.map((exercise) => (
            <li key={exercise.id}>
              <button
                type="button"
                className="fit-check__item"
                aria-pressed={exercise.completed}
                disabled={savingId === exercise.id}
                onClick={() => toggle(exercise)}
              >
                <ExerciseIcon name={exercise.name} />
                <span>
                  <strong>{exercise.name}</strong>
                  <small>{exercise.detail}</small>
                </span>
                <span className="fit-check__mark" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {message && <p className="fit-check__status" role="status">{message}</p>}
    </>
  )
}

