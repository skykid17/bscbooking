import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../utils/apiConfig';

export default function RegisterPage({ onRegisterSuccess, onLoginClick }) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [ministryId, setMinistryId] = useState('');
    const [ministries, setMinistries] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMinistries, setLoadingMinistries] = useState(false);
    const navigate = useNavigate();

    // Fetch ministries for the dropdown
    useEffect(() => {
        const fetchMinistries = async () => {
            try {
                setLoadingMinistries(true);
                const response = await axios.get(`${API_BASE_URL}/public/ministries`);
                setMinistries(response.data);
            } catch (err) {
                console.error('Error fetching ministries:', err);
            } finally {
                setLoadingMinistries(false);
            }
        };
        
        fetchMinistries();
    }, []);

    const validateEmail = (email) => {
        const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(String(email).toLowerCase());
    };

    const handleRegister = async () => {
        setError('');
        setSuccess('');
        
        if (!name || !email || !password) {
            setError("Name, email and password are required.");
            return;
        }
        
        if (!validateEmail(email)) {
            setError("Please enter a valid email address.");
            return;
        }
        
        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        try {
            setIsLoading(true);
            
            await axios.post(`${API_BASE_URL}/auth/register`, {
                name,
                email,
                password,
                ministry_id: ministryId || null
            });
            
            setSuccess("Registration successful! Please check your email to verify your account.");
            setName('');
            setEmail('');
            setPassword('');
            setConfirmPassword('');
            setMinistryId('');
            
            // Don't auto-redirect since user needs to verify email first
        } catch (err) {
            console.error('Registration error:', err);
            setError(err.response?.data?.message || "Registration failed. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Register</h2>            
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name*</label>
                    <input
                        type="text"
                        placeholder="Enter your full name"
                        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address*</label>
                    <input
                        type="email"
                        placeholder="Enter your email address"
                        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ministry (Optional)</label>
                    <select
                        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={ministryId}
                        onChange={(e) => setMinistryId(e.target.value)}
                        disabled={loadingMinistries}
                    >
                        <option value="">None</option>
                        {loadingMinistries ? (
                            <option disabled>Loading ministries...</option>
                        ) : (
                            ministries.map(ministry => (
                                <option key={ministry.id} value={ministry.id}>
                                    {ministry.name}
                                </option>
                            ))
                        )}
                    </select>
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password*</label>
                    <input
                        type="password"
                        placeholder="Create a password"
                        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password*</label>
                    <input
                        type="password"
                        placeholder="Confirm your password"
                        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                    />
                </div>
                {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded border border-red-200">
                    {error}
                </div>
                )}
                
                {success && (
                    <div className="mb-4 p-3 bg-green-50 text-green-600 text-sm rounded border border-green-200">
                        {success}
                    </div>
                )}
                
                <button
                    className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-md transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                    onClick={handleRegister}
                    disabled={isLoading}
                >
                    {isLoading ? 'Registering...' : 'Register'}
                </button>
                
                <div className="text-center mt-4">
                    <p className="text-sm text-gray-600">
                        Already have an account?{' '}
                        <button 
                            className="text-blue-600 hover:text-blue-800 font-medium"
                            onClick={() => navigate('/login')}
                        >
                            Login
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}