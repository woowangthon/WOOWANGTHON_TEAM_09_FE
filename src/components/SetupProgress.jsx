// 온보딩 단계: 이름 1 · 목표 2 · 경험 3 · 헬스장 4 · 어려운 시간 5 · 신체 6 · 인바디 7 · 시간표 8 · 캘린더 9
export const SETUP_STEPS = 9

export default function SetupProgress({ step }) {
  return (
    <div
      className="fit-setup__progress"
      role="progressbar"
      aria-label="설정 진행률"
      aria-valuemin={0}
      aria-valuemax={SETUP_STEPS}
      aria-valuenow={step}
      aria-valuetext={`${SETUP_STEPS}단계 중 ${step}단계`}
    >
      <span style={{ width: `${(step / SETUP_STEPS) * 100}%` }} />
    </div>
  )
}
