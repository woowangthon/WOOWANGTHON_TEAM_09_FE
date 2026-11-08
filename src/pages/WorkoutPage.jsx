import { useState } from 'react'

const STORAGE_KEY = 'demo-workout-record'
const PLAN_ID = 'demo-plan-1'

const initialExercises = [
  { id: 1, name: '레그 프레스', sets: 3, reps: 12, completed: false },
  { id: 2, name: '랫 풀다운', sets: 3, reps: 12, completed: false },
  { id: 3, name: '체스트 프레스', sets: 3, reps: 10, completed: false },
  { id: 4, name: '레그 컬', sets: 3, reps: 12, completed: false },
]

// 저장된 기록이 있으면 완료 체크 상태를 불러온다.
function loadExercises() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)

    if (!saved) return initialExercises

    const record = JSON.parse(saved)

    if (
      record?.planId !== PLAN_ID ||
      !Array.isArray(record.exercises)
    ) {
      return initialExercises
    }

    return initialExercises.map((exercise) => {
      const savedExercise = record.exercises.find(
        (item) => item?.id === exercise.id
      )

      return {
        ...exercise,
        completed: savedExercise?.completed === true,
      }
    })
  } catch {
    return initialExercises
  }
}

export default function WorkoutPage() {
  const [exercises, setExercises] = useState(loadExercises)
  const [saveMessage, setSaveMessage] = useState('')

  const completedCount = exercises.filter(
    (exercise) => exercise.completed
  ).length

  function toggleExercise(id) {
    setExercises((previous) =>
      previous.map((exercise) =>
        exercise.id === id
          ? { ...exercise, completed: !exercise.completed }
          : exercise
      )
    )

    setSaveMessage('')
  }

  function saveWorkout() {
    const status =
      completedCount === exercises.length
        ? '완료'
        : completedCount > 0
          ? '부분 완료'
          : '미수행'

    const record = {
      planId: PLAN_ID,
      savedAt: new Date().toISOString(),
      status,
      exercises,
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(record))
      setSaveMessage(`${status} 기록을 브라우저에 저장했어요.`)
    } catch {
      setSaveMessage('저장하지 못했어요. 다시 시도해 주세요.')
    }
  }

  return (
    <section>
      <h1>오늘의 운동</h1>
      <p>동작 확인용 예시 운동입니다.</p>

      <p>
        완료: {completedCount} / {exercises.length}개
      </p>

      <ul>
        {exercises.map((exercise) => (
          <li key={exercise.id}>
            <label>
              <input
                type="checkbox"
                checked={exercise.completed}
                onChange={() => toggleExercise(exercise.id)}
              />
              {exercise.name} — {exercise.sets}세트 × {exercise.reps}회
            </label>
          </li>
        ))}
      </ul>

      {completedCount === exercises.length && (
        <p>모든 운동을 완료했어요!</p>
      )}

      <button type="button" onClick={saveWorkout}>
        운동 종료 및 저장
      </button>

      <p role="status">{saveMessage}</p>
      <p>체크를 변경한 뒤에는 저장 버튼을 눌러 주세요.</p>
    </section>
  )
}