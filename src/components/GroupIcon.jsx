// 그룹 종류별 선 아이콘 (단과대 건물 · 학사모 · 사람들 · 덤벨 · 운동화)
const paths = {
  building: (
    <>
      <path d="M3 20h18M4.5 20V10M19.5 20V10M3 10l9-6 9 6z" />
      <path d="M8 20v-6m4 6v-6m4 6v-6" />
    </>
  ),
  cap: (
    <>
      <path d="M2 9.5 12 5l10 4.5L12 14z" />
      <path d="M6 11.3V16c0 1.3 2.7 2.5 6 2.5s6-1.2 6-2.5v-4.7M22 9.5V14" />
    </>
  ),
  people: (
    <>
      <circle cx="12" cy="8.5" r="2.8" />
      <path d="M7 19c0-2.8 2.2-5 5-5s5 2.2 5 5" />
      <circle cx="5.5" cy="10" r="2" />
      <path d="M2 18c0-2 1.5-3.5 3.5-3.5" />
      <circle cx="18.5" cy="10" r="2" />
      <path d="M22 18c0-2-1.5-3.5-3.5-3.5" />
    </>
  ),
  dumbbell: (
    <>
      <rect x="5" y="6" width="3" height="12" rx="1" />
      <rect x="16" y="6" width="3" height="12" rx="1" />
      <path d="M8 12h8M5 9H3v6h2m14-6h2v6h-2" />
    </>
  ),
  shoe: (
    <path d="M3 16.5V12l3-1 2-4 3 1-1 3 4 2.5 6 1.5c1 .3 1.5 1 1.5 2v.5zM3 16.5h18.5M7 13.5l1.5-.5m1.5 1.5 1.5-.5" />
  ),
}

export default function GroupIcon({ name = 'people', className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name] ?? paths.people}
    </svg>
  )
}
