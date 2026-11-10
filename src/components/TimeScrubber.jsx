import './TimeScrubber.css'

const DAY_MINUTES = 24 * 60
const STEP = 10
const hourLabels = ['00', '03', '06', '09', '12', '15', '18', '21', '24']

function toMinutes(time) {
  const [hour, minute] = time.split(':').map(Number)
  return hour * 60 + minute
}

function toTime(minutes) {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
}

// 눈금 막대 위에서 하루 중 시각을 10분 단위로 고르는 슬라이더
export default function TimeScrubber({ label, value, onChange }) {
  const minutes = toMinutes(value)
  const percent = (minutes / (DAY_MINUTES - STEP)) * 100
  const [hour, minute] = value.split(':')

  return (
    <div className="fit-scrubber">
      <span className="fit-scrubber__label" style={{ left: `${percent}%` }} aria-hidden="true">
        {label}
      </span>
      <div className="fit-scrubber__track">
        <div className="fit-scrubber__ticks" />
        <div className="fit-scrubber__fill" style={{ width: `${percent}%` }}>
          <div className="fit-scrubber__ticks fit-scrubber__ticks--active" />
        </div>
        <input
          type="range"
          min={0}
          max={DAY_MINUTES - STEP}
          step={STEP}
          value={minutes}
          onChange={(event) => onChange(toTime(Number(event.target.value)))}
          aria-label={`${label} 시간`}
          aria-valuetext={`${Number(hour)}시 ${Number(minute)}분`}
        />
      </div>
      <div className="fit-scrubber__hours" aria-hidden="true">
        {hourLabels.map((item) => <span key={item}>{item}</span>)}
      </div>
    </div>
  )
}
