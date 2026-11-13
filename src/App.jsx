import { useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router'

import { getToken } from './api/client.js'
import { hydrateFromServer } from './api/profile.js'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import PlanPage from './pages/PlanPage'
import PlanGeneratePage from './pages/PlanGeneratePage'
import PlanDetailPage from './pages/PlanDetailPage'
import TimetablePage from './pages/TimetablePage'
import InbodySetupPage from './pages/InbodySetupPage'
import CalendarConnectPage from './pages/CalendarConnectPage'
import SchedulePage from './pages/SchedulePage'
import ProfilePage from './pages/ProfilePage'
import ReportPage from './pages/ReportPage'
import CampusPage from './pages/CampusPage'
import GroupPage from './pages/GroupPage'
import GroupDetailPage from './pages/GroupDetailPage'
import GroupCreatePage from './pages/GroupCreatePage'

// 이 기기에 프로필 사본이 없으면 (다른 주소·기기에서 로그인했거나 사본이 지워진 경우) 서버에서 한 번 받아와요.
let restored = false
const needsRestore = () => {
  try {
    return !restored && Boolean(getToken()) && localStorage.getItem('demo-profile') === null
  } catch {
    return false
  }
}

// 로그인하지 않았으면 로그인 화면으로 보내요.
function RequireAuth() {
  const [isRestoring, setIsRestoring] = useState(needsRestore)

  useEffect(() => {
    if (!isRestoring || restored) return
    restored = true
    hydrateFromServer()
      .catch(() => {})
      .finally(() => setIsRestoring(false))
  }, [isRestoring])

  if (!getToken()) return <Navigate to="/login" replace />
  if (isRestoring) return <p className="fit-restoring" role="status">내 정보를 불러오는 중이에요...</p>
  return <Outlet />
}

export default function App() {
  return (
    <BrowserRouter>
      <main>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<RequireAuth />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/plan" element={<PlanPage />} />
            <Route path="/plan/generate" element={<PlanGeneratePage />} />
            <Route path="/plan/:sessionId" element={<PlanDetailPage />} />
            <Route path="/setup/inbody" element={<InbodySetupPage />} />
            <Route path="/setup/timetable" element={<TimetablePage />} />
            <Route path="/setup/calendar" element={<CalendarConnectPage />} />
            <Route path="/schedule" element={<SchedulePage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/report" element={<ReportPage />} />
            <Route path="/campus" element={<CampusPage />} />
            <Route path="/campus/groups" element={<GroupPage />} />
            <Route path="/campus/groups/new" element={<GroupCreatePage />} />
            <Route path="/campus/groups/:groupId" element={<GroupDetailPage />} />
          </Route>
          <Route path="*" element={<h1>페이지를 찾을 수 없어요</h1>} />
        </Routes>
      </main>
    </BrowserRouter>
  )
}
