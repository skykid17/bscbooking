import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function LoginPage({ onLoginSuccess }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async () => {
        setError('');
        
        if (!username || !password) {
            setError('Please enter both username and password');
            return;
        }
        
        try {
            setIsLoading(true);
            const response = await axios.post('http://localhost:5000/api/auth/login', {
                username,
                password
            });
            
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            
            onLoginSuccess(response.data.user);
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please try again.');
            console.error('Login error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Login</h2>
            
            {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded border border-red-200">
                    {error}
                </div>
            )}
            
            <div className="space-y-5">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                    <input
                        type="text"
                        placeholder="Enter your username"
                        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <input
                        type="password"
                        placeholder="Enter your password"
                        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>
                
                <button
                    className={`mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-md transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                    onClick={handleLogin}
                    disabled={isLoading}
                >
                    {isLoading ? 'Logging in...' : 'Login'}
                </button>
                
                <div className="text-center">
                    <p className="text-sm text-gray-600">
                        Don't have an account?{' '}
                        <button 
                            className="text-blue-600 hover:text-blue-800 font-medium"
                            onClick={() => navigate('/register')}
                        >
                            Register
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}