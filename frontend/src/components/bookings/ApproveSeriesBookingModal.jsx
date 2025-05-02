import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

export default function ApproveSeriesBookingModal({ booking, onClose, onApproved }) {
    const [approveType, setApproveType] = useState('this');
    const [isSeriesBooking, setIsSeriesBooking] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [action, setAction] = useState('approve'); // 'approve' or 'reject'
    
    useEffect(() => {
        // Check if this is part of a series
        setIsSeriesBooking(booking?.seriesId ? true : false);
    }, [booking]);
    
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

    const handleAction = async () => {
        try {
            setIsLoading(true);
            setError('');
            
            const token = localStorage.getItem('token');
            const url = isSeriesBooking 
                ? `http://localhost:5000/api/bookings/series/${booking.id}/${action}?approveType=${approveType}`
                : `http://localhost:5000/api/bookings/${booking.id}/${action}`;
                
            await axios.put(url, {}, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            onApproved(action, approveType); // Notify parent component
            onClose(); // Close the modal
            
        } catch (err) {
            console.error(`${action.charAt(0).toUpperCase() + action.slice(1)} error:`, err);
            if (err.response) {
                setError(err.response?.data?.message || `Error ${err.response.status}: Failed to ${action} booking.`);
            } else if (err.request) {
                setError('Server did not respond. Please check if the backend is running.');
            } else {
                setError('Failed to send request: ' + err.message);
            }
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 modal-backdrop">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">
                        {action === 'approve' ? 'Approve Booking' : 'Reject Booking'}
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                
                {error && (
                    <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded border border-red-200">
                        {error}
                    </div>
                )}
                
                <div className="mb-4">
                    <p className="text-gray-800">
                        {action === 'approve' 
                            ? 'Are you sure you want to approve this booking?' 
                            : 'Are you sure you want to reject this booking?'}
                    </p>
                    <div className="mt-2 p-3 bg-gray-50 rounded">
                        <p className="font-medium">{booking?.eventName}</p>
                        <p className="text-sm text-gray-600">
                            {booking?.room} • {new Date(booking?.startDate).toLocaleDateString()} • {booking?.startTime} - {booking?.endTime}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                            Requested by: {booking?.userName}
                        </p>
                    </div>
                </div>
                
                {/* Series options - Only show if it's part of a series */}
                {isSeriesBooking && (
                    <div className="mb-4 p-3 bg-blue-50 rounded border border-blue-200">
                        <h3 className="text-sm font-medium text-blue-800 mb-2">This is part of a recurring series</h3>
                        <div className="space-y-2">
                            <div className="flex items-center">
                                <input 
                                    type="radio" 
                                    id="approve-this" 
                                    name="approve-type" 
                                    value="this" 
                                    checked={approveType === 'this'} 
                                    onChange={() => setApproveType('this')}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                />
                                <label htmlFor="approve-this" className="ml-2 text-sm text-gray-700">
                                    This event only
                                </label>
                            </div>
                            <div className="flex items-center">
                                <input 
                                    type="radio" 
                                    id="approve-future" 
                                    name="approve-type" 
                                    value="future" 
                                    checked={approveType === 'future'} 
                                    onChange={() => setApproveType('future')}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                />
                                <label htmlFor="approve-future" className="ml-2 text-sm text-gray-700">
                                    This and future events
                                </label>
                            </div>
                            <div className="flex items-center">
                                <input 
                                    type="radio" 
                                    id="approve-all" 
                                    name="approve-type" 
                                    value="all" 
                                    checked={approveType === 'all'} 
                                    onChange={() => setApproveType('all')}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                />
                                <label htmlFor="approve-all" className="ml-2 text-sm text-gray-700">
                                    All events in series
                                </label>
                            </div>
                        </div>
                    </div>
                )}
                
                <div className="flex justify-between pt-4">
                    <div>
                        <button
                            type="button"
                            onClick={() => setAction(action === 'approve' ? 'reject' : 'approve')}
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-100 mr-2"
                            disabled={isLoading}
                        >
                            {action === 'approve' ? 'Switch to Reject' : 'Switch to Approve'}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-100"
                            disabled={isLoading}
                        >
                            Cancel
                        </button>
                    </div>
                    <button
                        type="button"
                        onClick={handleAction}
                        className={`px-4 py-2 ${action === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} text-white rounded`}
                        disabled={isLoading}
                    >
                        {isLoading 
                            ? (action === 'approve' ? 'Approving...' : 'Rejecting...') 
                            : (action === 'approve' ? 'Approve' : 'Reject')
                        }
                    </button>
                </div>
            </div>
        </div>
    );
}