import { useState } from 'react';
import LoginModal from './LoginModal';
import RegisterModal from './RegisterModal';

function AuthContainer({ onLoginSuccess }) {
    const [showLogin, setShowLogin] = useState(true);

    const toggleAuthMode = () => {
        setShowLogin(!showLogin);
    };

    return showLogin ? (
        <LoginModal 
            onLoginSuccess={onLoginSuccess} 
            onRegisterClick={toggleAuthMode} 
        />
    ) : (
        <RegisterModal 
            onRegisterSuccess={() => setShowLogin(true)}
            onLoginClick={toggleAuthMode} 
        />
    );
}

export default AuthContainer;