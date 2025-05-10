import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { setupAuthInterceptors, isAuthenticated } from './utils/authUtils';
import LoginPage from './components/auth/LoginPage';
import RegisterPage from './components/auth/RegisterPage';
import Dashboard from './components/dashboard/Dashboard';
import AdminDashboard from './components/dashboard/AdminDashboard';
import Layout from './components/layout/Layout';
import backgroundImage from './assets/bsc.jpg';
import EmailVerifiedPage from './components/auth/EmailVerifiedPage';

function AuthInterceptorSetup({ setUser }) {
  const navigate = useNavigate();
  
  useEffect(() => {
    setupAuthInterceptors(navigate, setUser);
  }, [navigate, setUser]);
  
  return null;
}

function App() {
  const [user, setUser] = useState(() => {
    if (isAuthenticated()) {
      const savedUser = localStorage.getItem('user');
      return savedUser ? JSON.parse(savedUser) : null;
    }
    return null;
  });

  const handleLoginSuccess = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const [authPage, setAuthPage] = useState('login');

  return (
    <>
      {/* Background Container */}
      <div 
        className="fixed inset-0 z-[-1] bg-cover bg-center"
        style={{ backgroundImage: `url(${backgroundImage})`, opacity: 0.8 }}
      />

      <BrowserRouter>
        <AuthInterceptorSetup setUser={setUser} />

        <ToastContainer 
          position="top-right" 
          autoClose={4000} 
          hideProgressBar={true}
          newestOnTop={false} 
          closeOnClick 
          toastClassName="shadow-sm rounded-lg overflow-hidden border-0"
          bodyClassName="border-0"
          pauseOnFocusLoss 
          draggable 
        />

        <Layout user={user} onLogout={handleLogout}>
          <Routes>
            <Route path="/login" element={
              user ? <Navigate to="/" /> : <LoginPage onLoginSuccess={handleLoginSuccess} />
            } />
            <Route path="/register" element={
              user ? <Navigate to="/" /> : <RegisterPage onRegisterSuccess={() => setAuthPage('login')} onLoginClick={() => setAuthPage('login')} />
            } />
            <Route path="/" element={
              user ? (
                user.role === 'admin' ? 
                  <AdminDashboard user={user} /> : 
                  <Dashboard user={user} />
              ) : <Navigate to="/login" />
            } />
            <Route path="/verify-email/:token" element={<EmailVerifiedPage />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </>
  );
}

export default App;