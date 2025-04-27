import { useState } from 'react';
import LoginModal from './components/LoginModal';

function App() {
    const [user, setUser] = useState(null);

    const handleLoginSuccess = (userData) => {
        setUser(userData);
    };

    return (
        <div className="min-h-screen bg-blue-100 flex items-center justify-center">
            <div className="bg-white shadow-md rounded-lg p-6">
                <h1 className="text-xl font-bold mb-4">Booking System</h1>
                {!user && <LoginModal onLoginSuccess={handleLoginSuccess} />}
                {user && (
                    <div className="p-6">
                        <h1 className="text font-bold">Welcome, {user.name}!</h1>
                        <p className="mt-2 text-gray-700">Role: {user.role}</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default App;