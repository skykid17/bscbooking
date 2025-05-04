import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { setupAuthInterceptors, isAuthenticated } from './utils/authUtils';
import LoginPage from './components/auth/LoginPage';
import RegisterPage from './components/auth/RegisterPage';
import Dashboard from './components/dashboard/Dashboard';
import AdminDashboard from './components/admin/AdminDashboard';
import Layout from './components/layout/Layout';

// Create a wrapper component to access navigate inside useEffect
function AuthInterceptorSetup({ setUser }) {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Pass both navigate and setUser to the interceptor
    setupAuthInterceptors(navigate, setUser);
  }, [navigate, setUser]);
  
  return null;
}

function App() {
  const [user, setUser] = useState(() => {
    // Only load the user if we have a valid token
    if (isAuthenticated()) {
      const savedUser = localStorage.getItem('user');
      return savedUser ? JSON.parse(savedUser) : null;
    }
    return null;
  });
  
  // Handle login success
  const handleLoginSuccess = (userData) => {
    setUser(userData);
  };
  
  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };
  
  // Add state for auth page management
  const [authPage, setAuthPage] = useState('login');

  return (
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
        <div className="min-h-screen bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
              {/* Other routes */}
            </Routes>
          </div>
        </div>
      </Layout>
    </BrowserRouter>
  );
}

export default App;