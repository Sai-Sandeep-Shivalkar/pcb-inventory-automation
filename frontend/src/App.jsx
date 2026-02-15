import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import AppLayout from './components/AppLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ComponentsPage from './pages/ComponentsPage';
import ProductionPage from './pages/ProductionPage';
import HistoryPage from './pages/HistoryPage';
import AnalyticsPage from './pages/AnalyticsPage';
import UploadPage from './pages/UploadPage';

function ProtectedRoute({ children }) {
  const { token } = useAuth();
  const bypassLogin = import.meta.env.VITE_BYPASS_LOGIN !== 'false';
  return token || bypassLogin ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const { token } = useAuth();
  const bypassLogin = import.meta.env.VITE_BYPASS_LOGIN !== 'false';

  return (
    <Routes>
      <Route path="/login" element={token || bypassLogin ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="components" element={<ComponentsPage />} />
        <Route path="production" element={<ProductionPage />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="upload" element={<UploadPage />} />
      </Route>
      <Route path="*" element={<Navigate to={token || bypassLogin ? '/' : '/login'} replace />} />
    </Routes>
  );
}
