import { useState, useEffect } from 'react';
import LoginPage from './components/auth/LoginPage';
import RegisterPage from './components/auth/RegisterPage';
import Dashboard from './components/dashboard/Dashboard';
import Layout from './components/layout/Layout';

function App() {
    // User state with localStorage persistence
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem('user');
        return savedUser ? JSON.parse(savedUser) : null;
    });
    
    // Auth page state (login or register)
    const [authPage, setAuthPage] = useState('login');

    // Handle user authentication
    const handleLoginSuccess = (userData) => {
        setUser(userData);
    };

    // Handle logout
    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };

    return (
        <Layout user={user} onLogout={handleLogout}>
            {!user ? (
                authPage === 'login' ? (
                    <LoginPage 
                        onLoginSuccess={handleLoginSuccess} 
                        onRegisterClick={() => setAuthPage('register')} 
                    />
                ) : (
                    <RegisterPage 
                        onRegisterSuccess={() => setAuthPage('login')}
                        onLoginClick={() => setAuthPage('login')} 
                    />
                )
            ) : (
                <Dashboard user={user} />
            )}
        </Layout>
    );
}

export default App;