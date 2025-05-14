import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../../utils/apiConfig';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';

export default function RegisterPage({ onRegisterSuccess, onLoginClick }) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [selectedMinistries, setSelectedMinistries] = useState([]);
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

    // Handle adding a ministry
    const handleAddMinistry = (ministryId) => {
        if (selectedMinistries.length >= 3) {
            setError('You can only select up to 3 ministries');
            return;
        }
        
        if (!selectedMinistries.includes(ministryId)) {
            setSelectedMinistries([...selectedMinistries, ministryId]);
        }
    };

    // Handle removing a ministry
    const handleRemoveMinistry = (ministryId) => {
        setSelectedMinistries(selectedMinistries.filter(id => id !== ministryId));
    };

    // Find ministry name by ID
    const getMinistryName = (ministryId) => {
        const ministry = ministries.find(m => m.id === ministryId);
        return ministry ? ministry.name : 'Unknown';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        
        if (!name || !email || !password || !confirmPassword) {
            setError('All fields are required');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        try {
            setIsLoading(true);
            
            const response = await axios.post(`${API_BASE_URL}/auth/register`, {
                name,
                email,
                password,
                ministry_ids: selectedMinistries.length > 0 ? selectedMinistries : undefined
            });
            
            setSuccess(response.data.message);
            
            // Reset form
            setName('');
            setEmail('');
            setPassword('');
            setConfirmPassword('');
            setSelectedMinistries([]);
            
            // Optionally redirect or show a success message
            if (onRegisterSuccess) {
                onRegisterSuccess();
            }
            
        } catch (err) {
            console.error('Registration error:', err);
            setError(err.response?.data?.message || 'Registration failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Register</h2>
            
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
            
            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                    <input
                        type="text"
                        placeholder="Enter your name"
                        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input
                        type="email"
                        placeholder="Enter your email"
                        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ministries (Up to 3)</label>
                    <select
                        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value=""
                        onChange={(e) => {
                            if (e.target.value) {
                                handleAddMinistry(e.target.value);
                                e.target.value = "";
                            }
                        }}
                        disabled={loadingMinistries || selectedMinistries.length >= 3}
                    >
                        <option value="">Select a ministry</option>
                        {ministries
                            .filter(ministry => !selectedMinistries.includes(ministry.id))
                            .map(ministry => (
                                <option key={ministry.id} value={ministry.id}>
                                    {ministry.name}
                                </option>
                            ))
                        }
                    </select>
                    
                    {/* Display selected ministries */}
                    <div className="mt-2 flex flex-wrap gap-2">
                        {selectedMinistries.map(ministryId => (
                            <div 
                                key={ministryId} 
                                className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded flex items-center"
                            >
                                {getMinistryName(ministryId)}
                                <button 
                                    type="button"
                                    onClick={() => handleRemoveMinistry(ministryId)}
                                    className="ml-1 text-blue-600 hover:text-blue-800"
                                >
                                    <FontAwesomeIcon icon={faXmark} />
                                </button>
                            </div>
                        ))}
                    </div>
                    
                    {selectedMinistries.length === 3 && (
                        <p className="mt-1 text-xs text-amber-600">
                            Maximum of 3 ministries reached.
                        </p>
                    )}
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
                    <input
                        type="password"
                        placeholder="Confirm your password"
                        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                    />
                </div>
                
                <button
                    className={`mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-md transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                    type="submit"
                    disabled={isLoading}
                >
                    {isLoading ? 'Registering...' : 'Register'}
                </button>
                
                <div className="text-center">
                    <p className="text-sm text-gray-600">
                        Already have an account?{' '}
                        <button 
                            className="text-blue-600 hover:text-blue-800 font-medium"
                            onClick={onLoginClick}
                            type="button"
                        >
                            Login
                        </button>
                    </p>
                </div>
            </form>
        </div>
    );
}