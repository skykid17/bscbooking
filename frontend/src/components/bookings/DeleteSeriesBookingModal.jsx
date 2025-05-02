import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

export default function DeleteSeriesBookingModal({ booking, onClose, onDelete }) {
    const [deleteType, setDeleteType] = useState('this');
    const [isSeriesBooking, setIsSeriesBooking] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    
    useEffect(() => {
        // Check if this is part of a series
        setIsSeriesBooking(booking?.seriesId ? true : false);
    }, [booking]);
    
    const handleDelete = async () => {
        try {
            setIsLoading(true);
            setError('');
            
            // Don't make API call or show toast here
            // Just notify parent component
            onDelete(deleteType);
            onClose(); // Close modal
        } catch (err) {
            setError('An error occurred');
            console.error('Error:', err);
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 modal-backdrop">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Delete Booking</h2>
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
                    <p className="text-gray-800">Are you sure you want to delete this booking?</p>
                    <div className="mt-2 p-3 bg-gray-50 rounded">
                        <p className="font-medium">{booking?.eventName}</p>
                        <p className="text-sm text-gray-600">
                            {booking?.room} • {new Date(booking?.startDate).toLocaleDateString()} • {booking?.startTime} - {booking?.endTime}
                        </p>
                    </div>
                </div>
                
                {/* Series options - Only show if it's part of a series */}
                {isSeriesBooking && (
                    <div className="mb-4 p-3 bg-red-50 rounded border border-red-200">
                        <h3 className="text-sm font-medium text-red-800 mb-2">This is part of a recurring series</h3>
                        <div className="space-y-2">
                            <div className="flex items-center">
                                <input 
                                    type="radio" 
                                    id="delete-this" 
                                    name="delete-type" 
                                    value="this" 
                                    checked={deleteType === 'this'} 
                                    onChange={() => setDeleteType('this')}
                                    className="h-4 w-4 text-red-600 focus:ring-red-500"
                                />
                                <label htmlFor="delete-this" className="ml-2 text-sm text-gray-700">
                                    This event only
                                </label>
                            </div>
                            <div className="flex items-center">
                                <input 
                                    type="radio" 
                                    id="delete-future" 
                                    name="delete-type" 
                                    value="future" 
                                    checked={deleteType === 'future'} 
                                    onChange={() => setDeleteType('future')}
                                    className="h-4 w-4 text-red-600 focus:ring-red-500"
                                />
                                <label htmlFor="delete-future" className="ml-2 text-sm text-gray-700">
                                    This and future events
                                </label>
                            </div>
                            <div className="flex items-center">
                                <input 
                                    type="radio" 
                                    id="delete-all" 
                                    name="delete-type" 
                                    value="all" 
                                    checked={deleteType === 'all'} 
                                    onChange={() => setDeleteType('all')}
                                    className="h-4 w-4 text-red-600 focus:ring-red-500"
                                />
                                <label htmlFor="delete-all" className="ml-2 text-sm text-gray-700">
                                    All events in series
                                </label>
                            </div>
                        </div>
                    </div>
                )}
                
                <div className="flex justify-between pt-4">
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
                        onClick={handleDelete}
                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Deleting...' : 'Delete Booking'}
                    </button>
                </div>
            </div>
        </div>
    );
}