import { NavLink } from 'react-router'
import './FitNavigation.css'

export default function FitNavigation() {
  return (
    <nav className="fit-nav" aria-label="주요 메뉴">
      <NavLink to="/" aria-label="홈" end>
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="5" y="5" width="4" height="14" rx="1.5" />
          <rect x="15" y="5" width="4" height="14" rx="1.5" />
          <path d="M9 10h6m-6 4h6M5 9H3v6h2m14-6h2v6h-2" />
        </svg>
      </NavLink>
      <NavLink to="/schedule" aria-label="일정">
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="4" y="5" width="16" height="15" rx="2" />
          <path d="M4 9h16M8 3v4m8-4v4" />
        </svg>
      </NavLink>
      <NavLink to="/profile" aria-label="프로필">
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="8" />
          <circle cx="12" cy="10" r="2.5" />
          <path d="M7.5 17a4.5 4.5 0 0 1 9 0" />
        </svg>
      </NavLink>
    </nav>
  )
}
