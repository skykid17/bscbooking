import { useState } from 'react';
import LoginModal from './components/LoginModal';

function App() {
    const [user, setUser] = useState(null);

    const handleLoginSuccess = (userData) => {
        setUser(userData);
    };

    return (
        <div className="min-h-screen bg-gray-100">
            {!user && <LoginModal onLoginSuccess={handleLoginSuccess} />}
            {user && (
                <div className="p-6">
                    <h1 className="text-3xl font-bold">Welcome, {user.name}!</h1>
                    <p className="mt-2 text-gray-700">Role: {user.role}</p>
                </div>
            )}
        </div>
    );
}

export default App;