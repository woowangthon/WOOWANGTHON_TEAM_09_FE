import { useState } from 'react'
import { Link } from 'react-router'
import { loadCampus, loadDashboard } from '../campus.js'
import FitNavigation from '../components/FitNavigation.jsx'
import { useAsync } from '../hooks/useAsync.js'
import './CampusPage.css'

const tabs = [
  { id: 'mine', label: '내 단과대' },
  { id: 'all', label: '전체 단과대' },
]

const OTHERS = '기타'

// 백엔드가 추가 중인 값 (단과대별 학생 수). 아직 없으면 지금 있는 값으로 대신 보여줘요.
//   active_now      : 지금 운동 시간인 학생 수
//   today_completed : 오늘 운동을 완료한 학생 수
//   participants    : 이번 주 한 번이라도 운동한 학생 수
const has = (value) => typeof value === 'number'
const rateText = (rate) => (rate === null || rate === undefined ? '-' : `${Math.round(rate)}%`)

function RateBar({ rate, label }) {
  const value = Math.round(rate ?? 0)
  return (
    <div className="fit-campus__bar" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={value}>
      <span style={{ width: `${value}%` }} />
    </div>
  )
}

function MyCollege({ mine, department }) {
  if (!mine || mine.college === OTHERS) {
    return (
      <section className="fit-campus__card fit-campus__empty">
        <h2>소속 단과대가 없어요</h2>
        <p>학과는 회원가입할 때 입력할 수 있어요. 학과가 없으면 &apos;기타&apos;로 묶여 순위에는 들어가지 않아요.</p>
      </section>
    )
  }

  return (
    <>
      <section className="fit-campus__card fit-campus__hero" aria-labelledby="campus-college">
        <div className="fit-campus__hero-top">
          <div>
            <p>내 소속 단과대{department ? ` · ${department}` : ''}</p>
            <h2 id="campus-college">{mine.college}</h2>
          </div>
          {mine.rank && <span className="fit-campus__rank">전체 {mine.rank}위</span>}
        </div>

        {has(mine.active_now) && has(mine.today_completed) && has(mine.participants) ? (
          <dl className="fit-campus__stats">
            <div><dt>현재 운동 중</dt><dd>{mine.active_now}명</dd></div>
            <div><dt>오늘 완료</dt><dd>{mine.today_completed}명</dd></div>
            <div><dt>이번 주 참여</dt><dd>{mine.participants}명</dd></div>
          </dl>
        ) : (
          <dl className="fit-campus__stats">
            <div><dt>소속 학생</dt><dd>{mine.members}명</dd></div>
            <div><dt>계획한 운동</dt><dd>{mine.planned}개</dd></div>
            <div><dt>완료한 운동</dt><dd>{mine.completed}개</dd></div>
          </dl>
        )}
      </section>

      <section className="fit-campus__card" aria-labelledby="campus-rate">
        <h2 id="campus-rate" className="fit-campus__rate-title">이번 주 평균 수행률</h2>
        <strong className="fit-campus__rate">{rateText(mine.rate)}</strong>
        <RateBar rate={mine.rate} label={`${mine.college} 이번 주 평균 수행률`} />
      </section>

      <p className="fit-campus__card fit-campus__cheer">
        {has(mine.participants) && mine.participants > 0 ? (
          <>{mine.college}은 <strong>{mine.participants}명</strong>이 운동을 수행했어요!<br />계속 함께 운동해요!</>
        ) : mine.completed > 0 ? (
          <>{mine.college}은 이번 주 운동 <strong>{mine.completed}개</strong>를 완료했어요!<br />계속 함께 운동해요!</>
        ) : (
          <>{mine.college}의 이번 주 첫 운동을 기다리고 있어요.<br />오늘 운동으로 순위를 올려 볼까요?</>
        )}
      </p>
    </>
  )
}

function AllColleges({ colleges, myCollege }) {
  return (
    <ol className="fit-campus__ranking" aria-label="단과대별 이번 주 수행률 순위">
      {colleges.map((item) => (
        <li key={item.college} className="fit-campus__row" data-mine={item.college === myCollege || undefined}>
          <span className="fit-campus__badge" data-top={item.rank && item.rank <= 3 ? '' : undefined}>
            {item.rank ?? '-'}
          </span>
          <div>
            <p>
              <strong>{item.college}</strong>
              <span>참여 {has(item.participants) ? item.participants : item.members}명</span>
              <b>{rateText(item.rate)}</b>
            </p>
            <RateBar rate={item.rate} label={`${item.college} 수행률`} />
          </div>
        </li>
      ))}
    </ol>
  )
}

export default function CampusPage() {
  const [tab, setTab] = useState('mine')
  const [campus] = useState(loadCampus)
  const { data, error, loading, reload } = useAsync(loadDashboard, [])

  return (
    <div className="fit-campus">
      <header className="fit-campus__header">
        <div>
          <p>충북대학교 캠퍼스 운동 현황</p>
          <h1>캠퍼스 현황</h1>
        </div>
        <Link className="fit-campus__link" to="/campus/groups">그룹 관리 &gt;</Link>
      </header>

      <div className="fit-campus__tabs" role="tablist" aria-label="보기 선택">
        {tabs.map((item) => (
          <button key={item.id} type="button" role="tab" aria-selected={tab === item.id} onClick={() => setTab(item.id)}>
            {item.label}
          </button>
        ))}
      </div>

      <div role="tabpanel">
        {loading && !data && (
          <div className="fit-campus__card fit-skeleton" role="status" aria-label="캠퍼스 현황을 불러오는 중이에요">
            <span /><span /><span />
          </div>
        )}
        {error && (
          <div className="fit-campus__card fit-campus__empty" role="alert">
            <p>{error.message}</p>
            <button className="fit-campus__button" type="button" onClick={reload}>다시 불러오기</button>
          </div>
        )}
        {data && (tab === 'mine'
          ? <MyCollege mine={data.mine} department={campus.department} />
          : <AllColleges colleges={data.colleges} myCollege={data.myCollege} />)}
      </div>


      <FitNavigation />
    </div>
  )
}
