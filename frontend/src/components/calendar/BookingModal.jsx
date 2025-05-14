import { formatDateTime } from '../../utils/dateUtils';

export default function BookingModal({ booking, onClose }) {
    // Format dates for display
    const formatDateDisplay = (dateTimeString) => {
        const date = new Date(dateTimeString);
        return date.toLocaleDateString(undefined, {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };
    
    // Format times for display
    const formatTimeDisplay = (dateTimeString) => {
        const date = new Date(dateTimeString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };
    
    // Check if booking spans multiple days
    const isMultiDayBooking = () => {
        const startDate = new Date(booking.startDateTime).setHours(0, 0, 0, 0);
        const endDate = new Date(booking.endDateTime).setHours(0, 0, 0, 0);
        return startDate !== endDate;
    };
    
    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-800">{booking.eventName}</h3>
                    <button 
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                
                <div className="space-y-4 text-gray-700">
                    {/* Room */}
                    <div className="flex">
                        <div className="w-1/3 font-medium text-gray-500">Room:</div>
                        <div className="w-2/3">{booking.room || booking.roomName}</div>
                    </div>
                    
                    {/* Date and Time */}
                    <div className="flex">
                        <div className="w-1/3 font-medium text-gray-500">Start:</div>
                        <div className="w-2/3">
                            {formatDateDisplay(booking.startDateTime)} at {formatTimeDisplay(booking.startDateTime)}
                        </div>
                    </div>
                    
                    <div className="flex">
                        <div className="w-1/3 font-medium text-gray-500">End:</div>
                        <div className="w-2/3">
                            {formatDateDisplay(booking.endDateTime)} at {formatTimeDisplay(booking.endDateTime)}
                        </div>
                    </div>
                    
                    {isMultiDayBooking() && (
                        <div className="bg-blue-50 p-2 rounded text-sm text-blue-700">
                            This booking spans multiple days
                        </div>
                    )}
                    
                    {/* User */}
                    <div className="flex">
                        <div className="w-1/3 font-medium text-gray-500">Booked By:</div>
                        <div className="w-2/3">{booking.userName || 'Unknown User'}</div>
                    </div>
                    
                    {/* Ministry (if available) */}
                    {(booking.ministryName || booking.ministryId) && (
                        <div className="flex">
                            <div className="w-1/3 font-medium text-gray-500">Ministry:</div>
                            <div className="w-2/3">{booking.ministryName || 'Unknown Ministry'}</div>
                        </div>
                    )}
                    
                    {/* Booking Type */}
                    <div className="flex">
                        <div className="w-1/3 font-medium text-gray-500">Type:</div>
                        <div className="w-2/3">
                            {booking.seriesId ? 'Recurring' : 'One-time'}
                            {booking.frequency && booking.frequency !== 'single' && (
                                <span className="ml-1 text-sm text-blue-600">({booking.frequency})</span>
                            )}
                        </div>
                    </div>
                    
                    {/* Status */}
                    <div className="flex">
                        <div className="w-1/3 font-medium text-gray-500">Status:</div>
                        <div className="w-2/3">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold
                                ${booking.status === 'approved' ? 'bg-green-100 text-green-800' : 
                                booking.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                                'bg-yellow-100 text-yellow-800'}`}
                            >
                                {booking.status}
                            </span>
                        </div>
                    </div>
                    
                    {/* Created/Approved Info */}
                    {booking.createdAt && (
                        <div className="flex">
                            <div className="w-1/3 font-medium text-gray-500">Created:</div>
                            <div className="w-2/3">{formatDateTime(booking.createdAt)}</div>
                        </div>
                    )}
                    
                    {booking.approvedAt && (
                        <div className="flex">
                            <div className="w-1/3 font-medium text-gray-500">{booking.status === 'approved' ? 'Approved:' : 'Reviewed:'}</div>
                            <div className="w-2/3">{formatDateTime(booking.approvedAt)}</div>
                        </div>
                    )}
                </div>
                
                <div className="mt-6 text-right">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}