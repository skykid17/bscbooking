import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

export default function VerifyEmail() {
    const [status, setStatus] = useState('verifying');
    const [message, setMessage] = useState('Verifying your email...');
    const navigate = useNavigate();
    const { token } = useParams();
    
    useEffect(() => {
        const verifyEmail = async () => {
            if (!token) {
                setStatus('error');
                setMessage('Invalid verification link.');
                return;
            }
            
            try {
                const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
                const response = await axios.get(`${apiUrl}/auth/verify-email/${token}`);
                
                if (response.data && response.data.success) {
                    setStatus('success');
                    setMessage('Your email has been verified successfully! You can now log in.');
                } else {
                    setStatus('error');
                    setMessage(response.data?.message || 'Verification failed. Please try again.');
                }
            } catch (err) {
                setStatus('error');
                setMessage(err.response?.data?.message || 'Verification failed. Please try again.');
            }
        };
        
        verifyEmail();
    }, [token]);
    
    const goToLogin = () => {
        navigate('/login');
    };
    
    const getStatusColor = () => {
        switch(status) {
            case 'verifying': return 'bg-blue-50 text-blue-600 border-blue-200';
            case 'success': return 'bg-green-50 text-green-600 border-green-200';
            case 'error': return 'bg-red-50 text-red-600 border-red-200';
            default: return 'bg-gray-50 text-gray-600 border-gray-200';
        }
    };
    
    return (
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-8 mt-16">
            <div className={`p-4 mb-6 rounded border ${getStatusColor()}`}>
                <p>{message}</p>
            </div>
            
            {status !== 'verifying' && (
                <button
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-md transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onClick={goToLogin}
                >
                    Go to Login
                </button>
            )}
        </div>
    );
}
