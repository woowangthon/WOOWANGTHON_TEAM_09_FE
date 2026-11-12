import { useRef, useState } from 'react'
import { Link } from 'react-router'
import { demoGroups, loadCampus, loadDashboard } from '../campus.js'
import FitNavigation from '../components/FitNavigation.jsx'
import { useAsync } from '../hooks/useAsync.js'
import './CampusPage.css'

const tabs = [
  { id: 'mine', label: '내 그룹' },
  { id: 'explore', label: '그룹 탐색' },
]

// 소속 단과대·학과 그룹은 자동으로 참여돼요. 단과대 수치는 서버 대시보드 값이고, 학과 통계는 아직 없어요.
async function loadMyGroups() {
  const { department } = loadCampus()
  const { mine } = await loadDashboard()
  const groups = []

  if (mine && mine.college !== '기타') {
    groups.push({ id: 'college', name: mine.college, tag: '단과대', meta: `참여 ${mine.members}명 · 평균 수행률 ${mine.rate === null ? '-' : `${Math.round(mine.rate)}%`}` })
  }
  if (department) {
    groups.push({ id: 'department', name: department, tag: '학과', meta: '학과별 통계는 준비 중이에요' })
  }
  return groups
}

function GroupCard({ group, action }) {
  return (
    <li className="fit-group__card">
      <div>
        <p className="fit-group__name">
          <strong>{group.name}</strong>
          <small className="fit-group__tag">{group.tag}</small>
        </p>
        {group.description && <p className="fit-group__desc">{group.description}</p>}
        <p className="fit-group__meta">{group.meta ?? `참여 ${group.participants}명 · 평균 수행률 ${group.rate}%`}</p>
      </div>
      {action ?? <span className="fit-group__chevron" aria-hidden="true">&gt;</span>}
    </li>
  )
}

export default function GroupPage() {
  const [tab, setTab] = useState('mine')
  const { data: groups, error, loading } = useAsync(loadMyGroups, [])
  const [message, setMessage] = useState('')
  const dialogRef = useRef(null)

  function submitCreate(event) {
    event.preventDefault()
    event.currentTarget.reset()
    dialogRef.current?.close()
    setMessage('그룹 만들기는 준비 중이에요. 곧 직접 그룹을 만들 수 있어요!')
  }

  return (
    <div className="fit-campus">
      <header className="fit-group__header">
        <Link className="fit-group__back" to="/campus" aria-label="캠퍼스 현황으로 돌아가기">&lt;</Link>
        <div>
          <p>우왕 코치</p>
          <h1>그룹 관리</h1>
        </div>
      </header>

      <div className="fit-campus__tabs" role="tablist" aria-label="보기 선택">
        {tabs.map((item) => (
          <button key={item.id} type="button" role="tab" aria-selected={tab === item.id} onClick={() => { setTab(item.id); setMessage('') }}>
            {item.label}
          </button>
        ))}
      </div>

      <div role="tabpanel">
        {tab === 'mine' ? (
          <section aria-labelledby="group-mine">
            <h2 id="group-mine" className="fit-group__title">
              참여 중인 그룹 {groups && <span className="fit-group__count">{groups.length}</span>}
            </h2>
            {loading && !groups && (
              <div className="fit-campus__card fit-skeleton" role="status" aria-label="그룹을 불러오는 중이에요"><span /><span /><span /></div>
            )}
            {error && <p className="fit-campus__note" role="alert">{error.message}</p>}
            {groups && (groups.length ? (
              <ul className="fit-group__list">
                {groups.map((group) => <GroupCard key={group.id} group={group} />)}
              </ul>
            ) : (
              <p className="fit-campus__card fit-campus__empty">
                학과를 입력하고 가입하면 단과대·학과 그룹에 자동으로 참여해요.
              </p>
            ))}
            <button className="fit-group__create" type="button" onClick={() => { setMessage(''); dialogRef.current?.showModal() }}>
              + 그룹 만들기
            </button>
          </section>
        ) : (
          <section aria-labelledby="group-explore">
            <h2 id="group-explore" className="fit-group__title">함께할 그룹을 찾아보세요</h2>
            <ul className="fit-group__list">
              {demoGroups.map((group) => (
                <GroupCard
                  key={group.id}
                  group={group}
                  action={(
                    <button className="fit-group__join" type="button" onClick={() => setMessage('그룹 참여는 준비 중이에요.')}>
                      참여
                    </button>
                  )}
                />
              ))}
            </ul>
            <p className="fit-campus__note">예시 그룹이에요. 그룹 기능이 준비되면 실제 그룹으로 바뀌어요.</p>
          </section>
        )}
      </div>

      <p className="fit-campus__message" role="status">{message}</p>

      <dialog ref={dialogRef} className="fit-group__dialog" aria-labelledby="group-create-title">
        <form onSubmit={submitCreate}>
          <h2 id="group-create-title">그룹 만들기</h2>
          <label>
            그룹명
            <input name="name" placeholder="예: 우왕코치 러닝크루" maxLength={30} required />
          </label>
          <label>
            그룹 설명
            <input name="description" placeholder="예: 함께 달리며 운동 습관을 만드는 그룹" maxLength={60} />
          </label>
          <fieldset>
            <legend>공개 범위</legend>
            <label><input type="radio" name="visibility" value="school" defaultChecked /> 학교 구성원만 (충북대 학생)</label>
            <label><input type="radio" name="visibility" value="invite" /> 초대받은 사람만 (비공개)</label>
          </fieldset>
          <div className="fit-group__actions">
            <button type="button" onClick={() => dialogRef.current?.close()}>취소</button>
            <button type="submit">그룹 만들기</button>
          </div>
        </form>
      </dialog>

      <FitNavigation />
    </div>
  )
}
