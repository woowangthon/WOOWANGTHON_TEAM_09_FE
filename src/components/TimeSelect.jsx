import './TimeSelect.css'

const hours = Array.from({ length: 24 }, (_, hour) => String(hour).padStart(2, '0'))
const baseMinutes = Array.from({ length: 12 }, (_, index) => String(index * 5).padStart(2, '0'))

// 브라우저 기본 시간 선택기 대신 00분부터 시작하는 시·분 드롭다운
export default function TimeSelect({ label, name, value, onChange, required = false }) {
  const [hour = '', minute = ''] = value ? value.split(':') : []
  const minutes = minute && !baseMinutes.includes(minute)
    ? [...baseMinutes, minute].sort()
    : baseMinutes

  function emit(nextHour, nextMinute) {
    onChange({ target: { name, value: nextHour ? `${nextHour}:${nextMinute || '00'}` : '' } })
  }

  return (
    <fieldset className="fit-time">
      <legend>{label}</legend>
      <div className="fit-time__selects">
        <select
          aria-label={`${label} 시`}
          value={hour}
          onChange={(event) => emit(event.target.value, minute)}
          required={required}
        >
          <option value="">시</option>
          {hours.map((item) => <option key={item} value={item}>{item}시</option>)}
        </select>
        <select
          aria-label={`${label} 분`}
          value={hour ? minute || '00' : ''}
          onChange={(event) => emit(hour, event.target.value)}
          disabled={!hour}
        >
          {!hour && <option value="">분</option>}
          {minutes.map((item) => <option key={item} value={item}>{item}분</option>)}
        </select>
      </div>
    </fieldset>
  )
}
