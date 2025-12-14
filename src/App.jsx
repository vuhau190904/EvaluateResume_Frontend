import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { getAccessToken } from './utils/auth';
import { ToastProvider } from './context/ToastContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import CallbackPage from './pages/CallbackPage';
import HomePage from './pages/HomePage';
import HistoryPage from './pages/HistoryPage';
import HistoryDetailPage from './pages/HistoryDetailPage';
import ResultPage from './pages/ResultPage';
import SuggestJDPage from './pages/SuggestJDPage';
import './index.css';

const ProtectedRoute = ({ children }) => {
  const hasToken = !!getAccessToken();
  if (!hasToken) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
};

const PublicRoute = ({ children }) => {
  const hasToken = !!getAccessToken();
  if (hasToken) return <Navigate to="/home" replace />;
  return children;
};

function App() {
  return (
    <ToastProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/auth/callback" element={<CallbackPage />} />
          <Route path="/home" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
          <Route path="/history/:id" element={<ProtectedRoute><HistoryDetailPage /></ProtectedRoute>} />
          <Route path="/result/:evaluationId" element={<ProtectedRoute><ResultPage /></ProtectedRoute>} />
          <Route path="/suggest-jd" element={<ProtectedRoute><SuggestJDPage /></ProtectedRoute>} />
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </Router>
    </ToastProvider>
  );
}

export default App;

