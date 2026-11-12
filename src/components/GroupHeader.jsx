import { Link } from 'react-router'

// 그룹 화면 공통 머리말: ‹ 우왕코치 / (부제)
export default function GroupHeader({ back, subtitle }) {
  return (
    <header className="fit-group__header">
      <Link className="fit-group__back" to={back} aria-label="뒤로 가기">‹</Link>
      <p>우왕코치</p>
      <h1>{subtitle}</h1>
    </header>
  )
}
