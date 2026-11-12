import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import FitNavigation from '../components/FitNavigation.jsx'
import GroupHeader from '../components/GroupHeader.jsx'
import GroupIcon from '../components/GroupIcon.jsx'
import { joinGroup, leaveGroup, loadGroup } from '../groups.js'
import { useAsync } from '../hooks/useAsync.js'
import './CampusPage.css'

const rateText = (rate) => (rate === null || rate === undefined ? '-' : `${Math.round(rate)}%`)

function RateBar({ rate, label }) {
  const value = Math.round(rate ?? 0)
  return (
    <div className="fit-campus__bar" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={value}>
      <span style={{ width: `${value}%` }} />
    </div>
  )
}

export default function GroupDetailPage() {
  const { groupId } = useParams()
  const navigate = useNavigate()
  const [version, setVersion] = useState(0)
  const { data: group, error, loading } = useAsync(() => loadGroup(groupId), [groupId, version])

  function join() {
    joinGroup(groupId)
    setVersion((value) => value + 1)
  }

  function leave() {
    if (!window.confirm(group.isOwner ? '내가 만든 그룹을 삭제할까요?' : '그룹에서 나갈까요?')) return
    leaveGroup(groupId)
    navigate('/campus/groups', { replace: true })
  }

  return (
    <div className="fit-campus">
      <GroupHeader back="/campus/groups" subtitle="그룹 상세" />

      {loading && !group && (
        <div className="fit-campus__card fit-skeleton" role="status" aria-label="그룹을 불러오는 중이에요"><span /><span /><span /></div>
      )}
      {error && <p className="fit-campus__card fit-campus__empty" role="alert">{error.message}</p>}
      {!loading && !error && !group && <p className="fit-campus__card fit-campus__empty">그룹을 찾을 수 없어요.</p>}

      {group && (
        <>
          <section className="fit-group__hero">
            {group.image
              ? <img className="fit-group__hero-image" src={group.image} alt="" />
              : <span className="fit-group__hero-icon"><GroupIcon name={group.icon} /></span>}
            <h2>{group.name}</h2>
            {group.intro && <p>{group.intro}</p>}
          </section>

          <dl className="fit-group__stats">
            <div><dt>참여 인원</dt><dd>{group.participants}명</dd></div>
            <div><dt>이번 주 수행률</dt><dd>{rateText(group.rate)}</dd></div>
          </dl>
          <RateBar rate={group.rate} label="그룹 이번 주 수행률" />

          <section className="fit-group__ranking" aria-labelledby="group-ranking">
            <h2 id="group-ranking" className="fit-group__title">이번 주 그룹 순위</h2>
            {group.ranking ? (
              <ol className="fit-campus__ranking">
                {group.ranking.map((member, index) => (
                  <li key={member.name} className="fit-campus__row" data-mine={member.isMe || undefined}>
                    <span className="fit-campus__badge" data-top={index === 0 ? '' : undefined}>{index + 1}</span>
                    <div>
                      <p><strong>{member.name}</strong><b>{rateText(member.rate)}</b></p>
                      <RateBar rate={member.rate} label={`${member.name} 수행률`} />
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="fit-campus__empty">단과대 학생별 순위는 개인정보 보호를 위해 보여주지 않아요. 캠퍼스 현황에서 단과대 순위를 확인해 보세요.</p>
            )}
          </section>

          {group.isAuto ? null : group.isJoined ? (
            <button className="fit-group__secondary" type="button" onClick={leave}>
              {group.isOwner ? '그룹 삭제하기' : '그룹 나가기'}
            </button>
          ) : (
            <button className="fit-group__primary" type="button" onClick={join}>그룹 가입하기</button>
          )}
          {!group.isAuto && <p className="fit-campus__note">그룹 기능은 준비 중이라 가입 정보가 이 기기에만 저장돼요.</p>}
        </>
      )}

      <FitNavigation />
    </div>
  )
}
