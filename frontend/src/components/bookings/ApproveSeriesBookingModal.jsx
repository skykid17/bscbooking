import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../utils/apiConfig';

export default function ApproveSeriesBookingModal({ booking, onClose, onApproved }) {
    const [approveType, setApproveType] = useState('this');
    const [isSeriesBooking, setIsSeriesBooking] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [action, setAction] = useState('approve'); // 'approve' or 'reject'
    const [ministries, setMinistries] = useState([]);
    
    useEffect(() => {
        // Check if this is part of a series
        setIsSeriesBooking(booking?.seriesId ? true : false);
    }, [booking]);

    // Fetch ministries for display
    useEffect(() => {
        const fetchMinistries = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(
                    `${API_BASE_URL}/ministries`,
                    {
                        headers: { 
                            'Authorization': `Bearer ${token}`
                        }
                    }
                );
                setMinistries(response.data);
            } catch (error) {
                console.error('Error fetching ministries:', error);
            }
        };
        
        fetchMinistries();
    }, []);

    // Helper to get ministry name from ID
    const getMinistryName = (ministryId) => {
        if (!ministryId) return '';
        const ministry = ministries.find(m => m.id === ministryId);
        return ministry ? ministry.name : '';
    };
    
    const handleApproveReject = (action) => {
        try {
            setIsLoading(true);
            
            // Don't show toast here, just notify parent
            onApproved(action, approveType);
            onClose();
        } catch (err) {
            setError('An error occurred');
            console.error('Error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">
                        {action === 'approve' ? 'Approve Booking' : 'Reject Booking'}
                    </h3>
                    <button 
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        &times;
                    </button>
                </div>
                
                {error && (
                    <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded border border-red-200">
                        {error}
                    </div>
                )}
                
                <div className="mb-6 p-4 bg-gray-50 rounded-md">
                    <h4 className="font-medium text-gray-700 mb-2">Booking Details</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <p className="text-gray-500">Event:</p>
                        <p>{booking?.eventName}</p>
                        
                        <p className="text-gray-500">Room:</p>
                        <p>{booking?.roomName}</p>
                        
                        <p className="text-gray-500">User:</p>
                        <p>{booking?.userName}</p>
                        
                        {booking?.ministryName && (
                            <>
                                <p className="text-gray-500">Ministry:</p>
                                <p>{booking?.ministryName}</p>
                            </>
                        )}
                    </div>
                </div>
                
                {isSeriesBooking && (
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select which bookings to {action}:
                        </label>
                        <div className="space-y-2">
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    name="approveType"
                                    value="this"
                                    checked={approveType === 'this'}
                                    onChange={() => setApproveType('this')}
                                    className="mr-2"
                                />
                                <span>This occurrence only</span>
                            </label>
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    name="approveType"
                                    value="future"
                                    checked={approveType === 'future'}
                                    onChange={() => setApproveType('future')}
                                    className="mr-2"
                                />
                                <span>This and all future occurrences</span>
                            </label>
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    name="approveType"
                                    value="all"
                                    checked={approveType === 'all'}
                                    onChange={() => setApproveType('all')}
                                    className="mr-2"
                                />
                                <span>All occurrences</span>
                            </label>
                        </div>
                    </div>
                )}
                
                <div className="flex justify-between mt-6">
                    <div>
                        <button
                            type="button"
                            onClick={() => setAction('reject')}
                            className={`px-4 py-2 border rounded mr-2 ${
                                action === 'reject'
                                ? 'bg-red-600 text-white border-red-600'
                                : 'border-red-300 text-red-600'
                            }`}
                        >
                            Reject
                        </button>
                        <button
                            type="button"
                            onClick={() => setAction('approve')}
                            className={`px-4 py-2 border rounded ${
                                action === 'approve'
                                ? 'bg-green-600 text-white border-green-600'
                                : 'border-green-300 text-green-600'
                            }`}
                        >
                            Approve
                        </button>
                    </div>
                    
                    <div className="space-x-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-100"
                            disabled={isLoading}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={() => handleApproveReject(action)}
                            disabled={isLoading}
                            className={`px-4 py-2 rounded ${
                                action === 'approve'
                                ? 'bg-green-600 hover:bg-green-700 text-white'
                                : 'bg-red-600 hover:bg-red-700 text-white'
                            }`}
                        >
                            {isLoading ? 'Processing...' : action === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}