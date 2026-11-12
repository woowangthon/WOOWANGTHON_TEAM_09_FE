import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router'

import { getToken } from './api/client.js'
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

// 로그인하지 않았으면 로그인 화면으로 보내요.
function RequireAuth() {
  return getToken() ? <Outlet /> : <Navigate to="/login" replace />
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
          </Route>
          <Route path="*" element={<h1>페이지를 찾을 수 없어요</h1>} />
        </Routes>
      </main>
    </BrowserRouter>
  )
}
