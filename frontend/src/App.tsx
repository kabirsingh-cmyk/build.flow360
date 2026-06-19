import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import Dashboard from './pages/Dashboard'
import Editor from './pages/Editor'
import SiteSettings from './pages/SiteSettings'
import AeoDashboard from './pages/AeoDashboard'
import NotFound from './pages/NotFound'

function App() {
  const { user, isAuthenticated, isLoading, refreshUser } = useAuthStore()

  useEffect(() => {
    refreshUser()
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" /> : <LoginPage />} />
        <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" /> : <RegisterPage />} />
        <Route path="/dashboard" element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} />
        <Route path="/editor/:siteId" element={isAuthenticated ? <Editor /> : <Navigate to="/login" />} />
        <Route path="/editor/:siteId/:pageId" element={isAuthenticated ? <Editor /> : <Navigate to="/login" />} />
        <Route path="/settings/:siteId" element={isAuthenticated ? <SiteSettings /> : <Navigate to="/login" />} />
        <Route path="/aeo/:siteId" element={isAuthenticated ? <AeoDashboard /> : <Navigate to="/login" />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  )
}

export default App
