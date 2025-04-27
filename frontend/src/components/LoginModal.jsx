import { useState } from 'react';
import axios from 'axios';

export default function LoginModal({ onLoginSuccess }) {
    const [showModal, setShowModal] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = async () => {
        try {
            const response = await axios.post('http://localhost:5000/api/auth/login', {
                username,
                password
            });
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            onLoginSuccess(response.data.user);
            setShowModal(false);
        } catch (err) {
            setError(err.response?.data?.message || "Login failed.");
        }
    };

    return (
        <>
            {showModal && (
                <div className="flex items-center justify-center">
                    <div className="bg-white p-8 rounded-xl w-80 shadow-lg">
                        <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
                        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                        <div className="space-y-4">
                            <input
                                type="text"
                                placeholder="Username"
                                className="w-full p-2 border rounded"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                            <input
                                type="password"
                                placeholder="Password"
                                className="w-full p-2 border rounded"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <button
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white p-2 rounded"
                                onClick={handleLogin}
                            >
                                Login
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
