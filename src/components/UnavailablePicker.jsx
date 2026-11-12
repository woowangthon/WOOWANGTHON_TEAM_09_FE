import { useState } from 'react'
import TimeSelect from './TimeSelect.jsx'
import { ALL_DAYS, crossesMidnight, daysText, getUnavailablePeriod, normalizeDays, presetPeriods } from '../workoutAvailability.js'
import './UnavailablePicker.css'

const emptyDraft = { id: '', label: '', startTime: '', endTime: '', weekdays: ALL_DAYS }
const dayChips = [['1', '월'], ['2', '화'], ['3', '수'], ['4', '목'], ['5', '금'], ['6', '토'], ['0', '일']]

function timeText(period) {
  return `${daysText(period.weekdays)} ${period.startTime} ~ ${crossesMidnight(period) ? '다음 날 ' : ''}${period.endTime}`
}

// 운동하기 어려운 시간대를 여러 개 고르는 화면. 자주 쓰는 시간대는 눌러서 켜고 끄고, 직접 추가·수정도 할 수 있어요.
export default function UnavailablePicker({ title, initial, isSaving, onDone, footer }) {
  const [periods, setPeriods] = useState(initial)
  const [draft, setDraft] = useState(null)
  const [message, setMessage] = useState('')

  const isSelected = (id) => periods.some((period) => period.id === id)

  function togglePreset(preset) {
    setMessage('')
    setPeriods((previous) => (isSelected(preset.id)
      ? previous.filter((period) => period.id !== preset.id)
      : [...previous, { id: preset.id, label: preset.label, startTime: preset.startTime, endTime: preset.endTime }]))
  }

  function remove(id) {
    setPeriods((previous) => previous.filter((period) => period.id !== id))
    if (draft?.id === id) setDraft(null)
  }

  function updateDraft(event) {
    const { name, value } = event.target
    setDraft((previous) => ({ ...previous, [name]: value }))
    setMessage('')
  }

  function toggleDay(day) {
    setDraft((previous) => ({
      ...previous,
      weekdays: previous.weekdays.includes(day) ? previous.weekdays.filter((item) => item !== day) : [...previous.weekdays, day],
    }))
    setMessage('')
  }

  function applyDraft() {
    const time = getUnavailablePeriod(draft)
    if (!time) {
      setMessage('시작과 종료 시간을 서로 다르게 선택해 주세요.')
      return
    }
    if (draft.weekdays.length === 0) {
      setMessage('요일을 하나 이상 골라 주세요.')
      return
    }

    // 7일 모두면 '매일'로 저장해요.
    const days = normalizeDays(draft.weekdays)
    const period = { ...time, weekdays: days ?? undefined }

    const label = draft.label.trim() || '직접 추가'
    if (draft.id) {
      setPeriods((previous) => previous.map((item) => (item.id === draft.id ? { ...item, label, ...period } : item)))
    } else {
      setPeriods((previous) => [...previous, { id: `custom-${Date.now()}`, label, ...period }])
    }
    setDraft(null)
  }

  return (
    <div className="fit-setup__screen fit-setup__screen--top fit-avail">
      {title}
      <p className="fit-setup__hint">이 시간에는 운동 계획을 잡지 않아요. 여러 개 선택할 수 있어요.</p>

      <section className="fit-avail__section" aria-labelledby="avail-presets">
        <h2 id="avail-presets">자주 사용하는 시간대</h2>
        <div className="fit-avail__presets">
          {presetPeriods.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className="fit-avail__preset"
              aria-pressed={isSelected(preset.id)}
              onClick={() => togglePreset(preset)}
            >
              <strong>{preset.label}</strong>
              <small>{preset.startTime} ~ {preset.endTime}</small>
              <span className="fit-avail__check" aria-hidden="true" />
            </button>
          ))}
        </div>
      </section>

      <section className="fit-avail__section" aria-labelledby="avail-selected">
        <div className="fit-avail__heading">
          <h2 id="avail-selected">선택한 시간대</h2>
          {periods.length > 0 && <span>{periods.length}개 선택</span>}
        </div>

        {periods.length ? (
          <ul className="fit-avail__list">
            {periods.map((period) => (
              <li key={period.id}>
                <span>
                  <strong>{period.label}</strong>
                  <small>{timeText(period)}</small>
                </span>
                <button type="button" className="fit-avail__edit" onClick={() => { setMessage(''); setDraft({ ...period, weekdays: period.weekdays ?? ALL_DAYS }) }}>
                  수정
                </button>
                <button type="button" className="fit-avail__remove" onClick={() => remove(period.id)} aria-label={`${period.label} 삭제`}>
                  ×
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="fit-avail__empty">아직 선택한 시간대가 없어요.</p>
        )}

        {draft ? (
          <div className="fit-avail__editor">
            <h3>{draft.id ? '시간대 수정' : '새 시간대 추가'}</h3>
            <label>
              이름
              <input name="label" value={draft.label} onChange={updateDraft} placeholder="예: 동아리, 아르바이트" maxLength={12} />
            </label>
            <fieldset className="fit-avail__days">
              <legend>요일</legend>
              <div>
                {dayChips.map(([day, name]) => (
                  <button key={day} type="button" aria-pressed={draft.weekdays.includes(day)} onClick={() => toggleDay(day)}>
                    {name}
                  </button>
                ))}
              </div>
            </fieldset>
            <div className="fit-avail__times">
              <TimeSelect label="시작 시간" name="startTime" value={draft.startTime} onChange={updateDraft} />
              <TimeSelect label="종료 시간" name="endTime" value={draft.endTime} onChange={updateDraft} />
            </div>
            <p className="fit-avail__note">종료가 시작보다 빠르면 다음 날 끝나는 걸로 계산해요.</p>
            <div className="fit-avail__editor-actions">
              <button type="button" onClick={() => { setDraft(null); setMessage('') }}>취소</button>
              <button type="button" onClick={applyDraft}>적용</button>
            </div>
          </div>
        ) : (
          <button type="button" className="fit-avail__add" onClick={() => { setMessage(''); setDraft(emptyDraft) }}>
            + 직접 시간대 추가하기
          </button>
        )}
      </section>

      {message && <p className="fit-avail__message" role="alert">{message}</p>}

      <div className="fit-setup__options">
        <button className="fit-setup__choice" type="button" onClick={() => onDone(periods)} disabled={isSaving || Boolean(draft)}>
          {isSaving ? '저장하는 중...' : periods.length ? '선택 완료' : '없어요, 다음으로'}
        </button>
        {footer}
      </div>
      {draft && <p className="fit-avail__note">추가 중인 시간대를 적용하거나 취소해 주세요.</p>}
    </div>
  )
}
