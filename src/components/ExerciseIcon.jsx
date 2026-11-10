import './ExerciseIcon.css'

// 운동 종목 아이콘 (검은 원 + 민트색 선 인체)
const figures = {
  squat: (
    <>
      <circle cx="14" cy="4.5" r="1.8" />
      <path d="M13.5 7 10 12.5l5.5 1L13 20M10 12.5 8.5 20M12.5 9l3.5 1" />
    </>
  ),
  press: (
    <>
      <circle cx="5.5" cy="9" r="1.8" />
      <path d="M7 11l5 4.5 4-5 3.5 3M19.5 6v10" />
    </>
  ),
  bridge: (
    <>
      <circle cx="4.5" cy="15.5" r="1.8" />
      <path d="M6.5 16 13 12.5l4.5 1 1 4.5M3 18.5h18" />
    </>
  ),
  calf: (
    <>
      <circle cx="10" cy="4" r="1.8" />
      <path d="M10 6.5V13l.5 5.5 4 .5M10 8.5l3 3M8 20.5h9" />
    </>
  ),
  push: (
    <>
      <circle cx="7.5" cy="5" r="1.8" />
      <path d="M7.5 7.5v6.5h5v5.5M7.5 9.5h7.5M16.5 6.5v6" />
    </>
  ),
  pull: (
    <>
      <circle cx="12" cy="8.5" r="1.8" />
      <path d="M12 11v6.5M12 12l-4-7.5M12 12l4-7.5M5.5 4h13M9 20.5l3-3 3 3" />
    </>
  ),
  shoulder: (
    <>
      <circle cx="12" cy="9" r="1.8" />
      <path d="M12 11.5V20M8.5 12.5V5M15.5 12.5V5M8.5 12.5h7M6.5 5h4M13.5 5h4" />
    </>
  ),
  row: (
    <>
      <circle cx="8" cy="6" r="1.8" />
      <path d="M8 8.5 9 14h5.5l3 4.5M8.5 10.5h5l5-1M20 8v3" />
    </>
  ),
}

// 종목 이름으로 아이콘을 골라요. (서버는 아이콘 정보를 주지 않아요)
const keywords = [
  ['bridge', ['브릿지', '브리지', '힙 쓰러스트', '데드버그', '플랭크', '크런치', '복근', '윗몸']],
  ['calf', ['카프', '종아리']],
  ['press', ['레그 프레스', '레그프레스', '레그 익스텐션', '레그 컬']],
  ['squat', ['스쿼트', '런지', '데드리프트', '스텝', '점프', '버피']],
  ['pull', ['풀다운', '풀업', '턱걸이', '친업']],
  ['row', ['로우', '로잉', '사이클', '자전거']],
  ['shoulder', ['숄더', '어깨', '레이즈', '밀리터리']],
  ['push', ['체스트', '벤치', '푸시업', '팔굽혀', '플라이', '딥스', '컬', '트라이셉']],
]

function iconFor(name = '') {
  return keywords.find(([, words]) => words.some((word) => name.includes(word)))?.[0] ?? 'squat'
}

export default function ExerciseIcon({ type, name }) {
  const icon = type ?? iconFor(name)

  return (
    <span className="fit-exercise-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="#6bd2b6" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        {figures[icon] ?? figures.squat}
      </svg>
    </span>
  )
}
