import { useState } from 'react'
import { useNavigate } from 'react-router'
import FitNavigation from '../components/FitNavigation.jsx'
import GroupHeader from '../components/GroupHeader.jsx'
import { createGroup } from '../groups.js'
import { imageAccept } from '../hooks/useImageFile.js'
import './CampusPage.css'

const MAX_IMAGE = 1024 * 1024

// 그룹 대표 사진은 이 기기에 저장하므로 1MB까지만 받아요.
function readImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function GroupCreatePage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', intro: '', isPublic: true, image: '' })
  const [message, setMessage] = useState('')

  function update(name, value) {
    setForm((previous) => ({ ...previous, [name]: value }))
    setMessage('')
  }

  async function pickImage(event) {
    const file = event.target.files?.[0]
    if (!file) return
    if (file.size > MAX_IMAGE) {
      setMessage('사진은 1MB 이하로 골라 주세요.')
      event.target.value = ''
      return
    }
    update('image', await readImage(file))
  }

  function submit(event) {
    event.preventDefault()
    if (!form.name.trim()) {
      setMessage('그룹 이름을 입력해 주세요.')
      return
    }

    try {
      const group = createGroup({ name: form.name.trim(), intro: form.intro.trim(), isPublic: form.isPublic, image: form.image })
      navigate(`/campus/groups/${group.id}`, { replace: true })
    } catch {
      setMessage('그룹을 저장하지 못했어요. 사진 없이 다시 시도해 주세요.')
    }
  }

  return (
    <div className="fit-campus">
      <GroupHeader back="/campus/groups" subtitle="그룹 만들기" />

      <form className="fit-group__form" onSubmit={submit}>
        <label className="fit-group__photo">
          {form.image
            ? <img src={form.image} alt="선택한 그룹 대표 사진" />
            : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
                <rect x="3" y="5" width="15" height="12" rx="2" />
                <path d="m3 15 4-4 3 3 3-3 5 5" />
                <circle cx="8" cy="9" r="1.3" />
                <circle cx="18.5" cy="17.5" r="3.5" fill="currentColor" stroke="none" />
                <path d="M18.5 16v3M17 17.5h3" stroke="#262625" />
              </svg>
            )}
          <input type="file" accept={imageAccept} onChange={pickImage} aria-label="그룹 대표 사진 고르기" />
        </label>

        <label>
          그룹 이름
          <input value={form.name} onChange={(event) => update('name', event.target.value)} placeholder="그룹 이름을 입력해 주세요" maxLength={30} />
        </label>

        <label>
          그룹 소개
          <textarea value={form.intro} onChange={(event) => update('intro', event.target.value)} placeholder="어떤 운동을 함께하고 싶나요?" maxLength={80} rows={3} />
        </label>

        <fieldset className="fit-group__visibility">
          <legend>공개 설정</legend>
          <div>
            <label data-checked={form.isPublic || undefined}>
              <input type="radio" name="visibility" checked={form.isPublic} onChange={() => update('isPublic', true)} />
              공개
            </label>
            <label data-checked={!form.isPublic || undefined}>
              <input type="radio" name="visibility" checked={!form.isPublic} onChange={() => update('isPublic', false)} />
              비공개
            </label>
          </div>
          <p>{form.isPublic ? '누구나 검색하고 가입할 수 있어요.' : '그룹 탐색에 나오지 않아요.'}</p>
        </fieldset>

        {message && <p className="fit-group__error" role="alert">{message}</p>}

        <button className="fit-group__primary" type="submit">그룹 만들기</button>
        <p className="fit-campus__note">그룹 기능은 준비 중이라 만든 그룹은 이 기기에만 저장돼요.</p>
      </form>

      <FitNavigation />
    </div>
  )
}
