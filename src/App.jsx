import { BrowserRouter, Link, Route, Routes } from 'react-router'

import HomePage from './pages/HomePage'
import SignupPage from './pages/SignupPage'
import WorkoutPage from './pages/WorkoutPage'
import SchedulePage from './pages/SchedulePage'
import ProfilePage from './pages/ProfilePage'

export default function App() {
  return (
    <BrowserRouter>
      <nav aria-label="주요 메뉴">
        <ul>
          <li><Link to="/">홈</Link></li>
          <li><Link to="/signup">회원가입</Link></li>
          <li><Link to="/workout">운동</Link></li>
          <li><Link to="/schedule">일정</Link></li>
          <li><Link to="/profile">프로필</Link></li>
        </ul>
      </nav>

      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/workout" element={<WorkoutPage />} />
          <Route path="/schedule" element={<SchedulePage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="*" element={<h1>페이지를 찾을 수 없어요</h1>} />
        </Routes>
      </main>
    </BrowserRouter>
  )
}