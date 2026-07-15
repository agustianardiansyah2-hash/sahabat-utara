import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import InputData from './pages/InputData';
import EvacuationCenters from './pages/EvacuationCenters';
import Evacuees from './pages/Evacuees';
import Population from './pages/Population';
import Informasi from './pages/Informasi';
import Laporan from './pages/Laporan';
import LaporanRW from './pages/LaporanRW';
import CCTV from './pages/CCTV';
import Settings from './pages/Settings';
import UserManagement from './pages/UserManagement';
import LoadingSpinner from './components/LoadingSpinner';
import { getStoredUser, getToken, removeToken, removeStoredUser } from './api/api';

// Protected Route wrapper
function ProtectedRoute({ children, allowedRoles = [] }) {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = getToken();
    const storedUser = getStoredUser();

    if (token && storedUser) {
      setIsAuthenticated(true);
      setUser(storedUser);
    } else {
      setIsAuthenticated(false);
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-100">
        <LoadingSpinner text="Memuat..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

// Layout wrapper for authenticated pages
function AuthenticatedLayout({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  const handleLogout = () => {
    removeToken();
    removeStoredUser();
    window.location.href = '/login';
  };

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar user={user} onLogout={handleLogout} />
      <div className="flex-1 ml-64">
        <Navbar user={user} onLogout={handleLogout} />
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout>
                <Dashboard />
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/input-data"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout>
                <InputData />
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/evacuation-centers"
          element={
            <ProtectedRoute allowedRoles={['super_admin', 'pic_rw']}>
              <AuthenticatedLayout>
                <EvacuationCenters />
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/evacuees"
          element={
            <ProtectedRoute allowedRoles={['super_admin', 'pic_rw']}>
              <AuthenticatedLayout>
                <Evacuees />
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/population"
          element={
            <ProtectedRoute allowedRoles={['super_admin', 'pic_rw']}>
              <AuthenticatedLayout>
                <Population />
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/informasi"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout>
                <Informasi />
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/laporan"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout>
                <Laporan />
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/laporan-rw"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout>
                <LaporanRW />
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/cctv"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout>
                <CCTV />
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute allowedRoles={['super_admin']}>
              <AuthenticatedLayout>
                <Settings />
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute allowedRoles={['super_admin']}>
              <AuthenticatedLayout>
                <UserManagement />
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />

        {/* Catch all - redirect to dashboard or login */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
