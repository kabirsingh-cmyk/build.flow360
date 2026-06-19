import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import Editor from './pages/Editor';
import SiteSettings from './pages/SiteSettings';
import AeoDashboard from './pages/AeoDashboard';
import NotFound from './pages/NotFound';

function App() {
  const { user } = useAuthStore();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <LoginPage />} />
        <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <RegisterPage />} />

        {/* Protected routes */}
        <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/login" />} />
        <Route path="/editor/:siteId" element={user ? <Editor /> : <Navigate to="/login" />} />
        <Route path="/editor/:siteId/:pageId" element={user ? <Editor /> : <Navigate to="/login" />} />
        <Route path="/settings/:siteId" element={user ? <SiteSettings /> : <Navigate to="/login" />} />
        <Route path="/aeo/:siteId" element={user ? <AeoDashboard /> : <Navigate to="/login" />} />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

export default App;
