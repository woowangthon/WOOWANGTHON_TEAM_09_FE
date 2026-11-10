// 홈·캘린더 카드에 쓰는 루틴 이름 (Day A - 하체 중심 전신)
export const routineTitles = {
  'session-1': '상체 중심 전신',
  'session-2': '하체 중심 전신',
  'session-3': '전신 순환 운동',
}

export function getRoutineTitle(session) {
  return routineTitles[session.id] ?? session.title
}

// AI 연결 전 화면 확인용 예시 루틴. icon은 ExerciseIcon의 종류예요.
export const exampleRoutines = {
  'session-1': [
    { id: 'upper-1', name: '체스트 프레스', part: '가슴', icon: 'push', sets: 3, reps: 10 },
    { id: 'upper-2', name: '랫 풀다운', part: '등', icon: 'pull', sets: 3, reps: 12 },
    { id: 'upper-3', name: '숄더 프레스', part: '어깨', icon: 'shoulder', sets: 3, reps: 10 },
    { id: 'upper-4', name: '시티드 로우', part: '등', icon: 'row', sets: 3, reps: 12 },
  ],
  'session-2': [
    { id: 'lower-3', name: '스쿼트', part: '하체', icon: 'squat', sets: 3, reps: 10 },
    { id: 'lower-1', name: '레그 프레스', part: '하체', icon: 'press', sets: 3, reps: 12 },
    { id: 'lower-4', name: '힙 브릿지', part: '하체', icon: 'bridge', sets: 3, reps: 12 },
    { id: 'lower-5', name: '카프 레이즈', part: '하체', icon: 'calf', sets: 3, reps: 15 },
  ],
  'session-3': [
    { id: 'full-4', name: '스쿼트', part: '하체', icon: 'squat', sets: 3, reps: 10 },
    { id: 'full-2', name: '체스트 프레스', part: '가슴', icon: 'push', sets: 3, reps: 10 },
    { id: 'full-3', name: '랫 풀다운', part: '등', icon: 'pull', sets: 3, reps: 12 },
    { id: 'full-5', name: '카프 레이즈', part: '하체', icon: 'calf', sets: 3, reps: 15 },
  ],
}
