import { BrowserRouter, Link, Route, Routes, useMatch } from 'react-router'

import HomePage from './pages/HomePage'
import SignupPage from './pages/SignupPage'
import PlanPage from './pages/PlanPage'
import WorkoutPage from './pages/WorkoutPage'
import SchedulePage from './pages/SchedulePage'
import ProfilePage from './pages/ProfilePage'

function PageNavigation() {
  const isHome = useMatch({ path: '/', end: true })

  const isSchedule = useMatch({ path: '/schedule', end: true })

  const isProfile = useMatch({ path: '/profile', end: true })

  const isWorkout = useMatch({ path: '/workout', end: true })

  const isPlan = useMatch({ path: '/plan', end: true })

  const isSignup = useMatch({ path: '/signup', end: true })

  if (isHome || isSchedule || isProfile || isWorkout || isPlan || isSignup) return null

  return (
    <nav aria-label="주요 메뉴">
      <ul>
        <li><Link to="/">홈</Link></li>
        <li><Link to="/signup">회원가입</Link></li>
        <li><Link to="/plan">운동 계획</Link></li>
        <li><Link to="/workout">운동</Link></li>
        <li><Link to="/schedule">일정</Link></li>
        <li><Link to="/profile">프로필</Link></li>
      </ul>
    </nav>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <PageNavigation />

      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/plan" element={<PlanPage />} />
          <Route path="/workout" element={<WorkoutPage />} />
          <Route path="/schedule" element={<SchedulePage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route
            path="*"
            element={<h1>페이지를 찾을 수 없어요</h1>}
          />
        </Routes>
      </main>
    </BrowserRouter>
  )
}