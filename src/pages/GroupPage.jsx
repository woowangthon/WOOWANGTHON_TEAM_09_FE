import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import FitNavigation from '../components/FitNavigation.jsx'
import GroupHeader from '../components/GroupHeader.jsx'
import { exploreGroups, loadMyGroups } from '../groups.js'
import { useAsync } from '../hooks/useAsync.js'
import './CampusPage.css'

const tabs = [
  { id: 'mine', label: '내 그룹' },
  { id: 'explore', label: '그룹 탐색' },
]

const rateText = (rate) => (rate === null || rate === undefined ? '-' : `${Math.round(rate)}%`)

function GroupRow({ group, tag, meta, note }) {
  const body = (
    <>
      <span className="fit-group__text">
        <span className="fit-group__name">
          <strong>{group.name}</strong>
          <small className="fit-group__tag">{tag}</small>
        </span>
        <small className="fit-group__meta">{meta}</small>
        {note && <small className="fit-group__note">{note}</small>}
      </span>
      <span className="fit-group__chevron" aria-hidden="true">&gt;</span>
    </>
  )

  // 학과 그룹은 아직 상세 정보가 없어서 누를 수 없어요.
  return group.id === 'department'
    ? <li><div className="fit-group__card">{body}</div></li>
    : <li><Link className="fit-group__card" to={`/campus/groups/${group.id}`}>{body}</Link></li>
}

function MyGroups() {
  const { data: groups, error, loading } = useAsync(loadMyGroups, [])

  return (
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
          {groups.map((group) => (
            <GroupRow
              key={group.id}
              group={group}
              tag={group.tag}
              meta={group.meta ?? `참여 ${group.participants}명 · 평균 수행률 ${rateText(group.rate)}`}
            />
          ))}
        </ul>
      ) : (
        <p className="fit-campus__card fit-campus__empty">아직 참여 중인 그룹이 없어요. 그룹을 찾아보거나 직접 만들어 보세요.</p>
      ))}

      <Link className="fit-group__create" to="/campus/groups/new">+ 그룹 만들기</Link>
    </section>
  )
}

function Explore() {
  const [query, setQuery] = useState('')
  const groups = exploreGroups(query)

  return (
    <section aria-labelledby="group-explore">
      <h2 id="group-explore" className="fit-group__title">함께 운동할 그룹을 찾아보세요</h2>
      <label className="fit-group__search">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></svg>
        <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="그룹 이름을 검색해보세요" aria-label="그룹 검색" />
      </label>

      {groups.length ? (
        <ul className="fit-group__list">
          {groups.map((group) => (
            <GroupRow
              key={group.id}
              group={group}
              tag={group.isJoined ? '참여 중' : '모집중'}
              meta={`${group.category} · 참여 ${group.participants ?? 1}명`}
              note={group.intro}
            />
          ))}
        </ul>
      ) : (
        <p className="fit-campus__card fit-campus__empty">&apos;{query}&apos;에 맞는 그룹이 없어요.</p>
      )}
      <p className="fit-campus__note">그룹 기능은 준비 중이라 예시 그룹을 보여드려요. 가입과 만들기는 이 기기에만 저장돼요.</p>
    </section>
  )
}

export default function GroupPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = searchParams.get('tab') === 'explore' ? 'explore' : 'mine'

  return (
    <div className="fit-campus">
      <GroupHeader back="/campus" subtitle="그룹 관리" />

      <div className="fit-campus__tabs" role="tablist" aria-label="보기 선택">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            onClick={() => setSearchParams(item.id === 'mine' ? {} : { tab: item.id }, { replace: true })}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div role="tabpanel">{tab === 'mine' ? <MyGroups /> : <Explore />}</div>

      <FitNavigation />
    </div>
  )
}
