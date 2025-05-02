import React, { useState } from 'react';
import axios from 'axios';

export default function LoginModal({ onLoginSuccess, onRegisterClick }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async () => {
        // Reset error state
        setError('');
        
        // Validate inputs
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
            
            // Store auth token and user data
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            
            // Notify parent component about successful login
            onLoginSuccess(response.data.user);
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please try again.');
            console.error('Login error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
            <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Login</h2>
            
            
            <div className="space-y-5">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Username</label>
                    <input
                        type="text"
                        placeholder="Enter your username"
                        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Password</label>
                    <input
                        type="password"
                        placeholder="Enter your password"
                        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>
                {error && (
                <div className="mb-4 p-2 bg-red-50 text-red-600 text-sm rounded border border-red-200">
                    {error}
                </div>
                )}
                <button
                    className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-md transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                    onClick={handleLogin}
                    disabled={isLoading}
                >
                    {isLoading ? 'Logging in...' : 'Login'}
                </button>
                
                <div className="text-center mt-4">
                    <p className="text-sm text-gray-600">
                        Don't have an account?{' '}
                        <button 
                            className="text-blue-600 hover:text-blue-800 font-medium"
                            onClick={onRegisterClick}
                        >
                            Register
                        </button>
                    </p>
                </div>
            </div>
        </div>
                
    );
}