import { useState } from 'react';
import axios from 'axios';

export default function RegisterModal({ onRegisterSuccess, onLoginClick }) {
    const [showModal, setShowModal] = useState(true);
    const [username, setUsername] = useState('');
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [role, setRole] = useState('user');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleRegister = async () => {
        // Reset messages
        setError('');
        setSuccess('');
        
        // Validation
        if (!username || !name || !password || !role) {
            setError("All fields are required.");
            return;
        }
        
        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        try {
            await axios.post('http://localhost:5000/api/auth/register', {
                username,
                name,
                password,
                role
            });
            
            setSuccess("Registration successful! You can now login.");
            
            // Clear form after successful registration
            setUsername('');
            setName('');
            setPassword('');
            setConfirmPassword('');
            
            // Optionally call the success callback
            if (onRegisterSuccess) {
                onRegisterSuccess();
            }
        } catch (err) {
            setError(err.response?.data?.message || "Registration failed.");
        }
    };

    return (
        <>
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-xl w-96 shadow-xl transform transition-all duration-300 scale-100">
                        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Register</h2>
                        
                        {error && (
                            <div className="mb-4 p-2 bg-red-50 text-red-600 text-sm rounded border border-red-200">
                                {error}
                            </div>
                        )}
                        
                        {success && (
                            <div className="mb-4 p-2 bg-green-50 text-green-600 text-sm rounded border border-green-200">
                                {success}
                            </div>
                        )}
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Username</label>
                                <input
                                    type="text"
                                    placeholder="Choose a username"
                                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Full Name</label>
                                <input
                                    type="text"
                                    placeholder="Enter your full name"
                                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Password</label>
                                <input
                                    type="password"
                                    placeholder="Create a password"
                                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Confirm Password</label>
                                <input
                                    type="password"
                                    placeholder="Confirm your password"
                                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Role</label>
                                <select
                                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                >
                                    <option value="user">User</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            
                            <button
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-md transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                                onClick={handleRegister}
                            >
                                Register
                            </button>
                            
                            <div className="text-center mt-4">
                                <p className="text-sm text-gray-600">
                                    Already have an account?{' '}
                                    <button 
                                        className="text-blue-600 hover:text-blue-800 font-medium"
                                        onClick={onLoginClick}
                                    >
                                        Login
                                    </button>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}