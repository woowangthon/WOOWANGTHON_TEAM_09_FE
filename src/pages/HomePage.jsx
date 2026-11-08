import { useState } from 'react'
import { Link } from 'react-router'

function loadWorkoutRecord() {
  try {
    const saved = localStorage.getItem('demo-workout-record')

    if (!saved) return null

    const record = JSON.parse(saved)

    if (
      record?.planId !== 'demo-plan-1' ||
      !Array.isArray(record.exercises) ||
      record.exercises.length === 0 ||
      !record.exercises.every(
        (exercise) =>
          exercise &&
          typeof exercise.completed === 'boolean'
      )
    ) {
      return null
    }

    return record
  } catch {
    return null
  }
}

export default function HomePage() {
  const [record] = useState(loadWorkoutRecord)

  const completedCount = record
    ? record.exercises.filter((exercise) => exercise.completed).length
    : 0

  const totalCount = record ? record.exercises.length : 0

  const status = !record
    ? '기록 없음'
    : completedCount === totalCount
      ? '완료'
      : completedCount > 0
        ? '부분 완료'
        : '미수행'

  const savedDate = record ? new Date(record.savedAt) : null

  const savedDateText =
    savedDate && !Number.isNaN(savedDate.getTime())
      ? savedDate.toLocaleString('ko-KR')
      : '저장 시각 정보 없음'

  return (
    <section>
      <h1>홈 화면</h1>
      <p>내 일정에 맞는 운동을 시작해 보세요.</p>

      <section>
        <h2>운동하기</h2>
        <p>운동 목록을 확인하고 수행한 종목을 체크하세요.</p>
        <Link to="/workout">운동 화면으로 이동</Link>
      </section>

      <section>
        <h2>최근 저장한 운동 결과</h2>

        {record ? (
          <div>
            <p>상태: {status}</p>
            <p>
              완료한 종목: {completedCount} / {totalCount}개
            </p>
            <p>저장 시각: {savedDateText}</p>
          </div>
        ) : (
          <p>아직 저장된 운동 기록이 없어요.</p>
        )}

        <p>현재는 예시 운동 기록 하나를 표시합니다.</p>
      </section>

      <section>
        <h2>일정 관리</h2>
        <Link to="/schedule">일정 화면으로 이동</Link>
      </section>
    </section>
  )
}