import { useState } from 'react';
import EditBookingModal from '../bookings/EditBookingModal';
import DeleteBookingModal from '../bookings/DeleteBookingModal';

export default function AdminBookingTable({ bookings, onApprove, onReject }) {
    const [editBooking, setEditBooking] = useState(null);
    const [deleteBooking, setDeleteBooking] = useState(null);
    
    // Format date for display
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };
    
    // Format datetime for display
    const formatDateTime = (dateString) => {
        if (!dateString) return '';
        const options = { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return new Date(dateString).toLocaleString(undefined, options);
    };

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200 rounded-lg overflow-hidden">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {bookings.map((booking) => (
                        <tr key={booking.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm">
                                <div className="font-medium text-gray-800">{booking.userName}</div>
                                <div className="text-gray-500 text-xs">{booking.userId}</div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-800">{booking.room}</td>
                            <td className="px-4 py-3 text-sm text-gray-800">
                                {booking.startDate === booking.endDate 
                                    ? formatDate(booking.startDate)
                                    : `${formatDate(booking.startDate)} - ${formatDate(booking.endDate)}`
                                }
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-800">
                                {booking.startTime} - {booking.endTime}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-800">
                                <div className="font-medium">{booking.eventName}</div>
                                <div className="text-gray-500 text-xs">{booking.frequency !== 'single' ? `(${booking.frequency})` : ''}</div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500">
                                {formatDate(booking.createdAt)}
                            </td>
                            <td className="px-4 py-3 text-sm">
                                <span className={`px-2 py-1 text-xs rounded-full font-medium
                                    ${booking.status === 'approved' ? 'bg-green-100 text-green-800' : 
                                      booking.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                                      'bg-yellow-100 text-yellow-800'}`}
                                >
                                    {booking.status}
                                </span>
                                {booking.approvedAt && (
                                    <div className="text-xs text-gray-500 mt-1">
                                        {formatDateTime(booking.approvedAt)}
                                    </div>
                                )}
                            </td>
                            <td className="px-4 py-3 text-sm">
                                <div className="flex flex-col space-y-1">
                                    {booking.status === 'pending' && (
                                        <>
                                            <button
                                                onClick={() => onApprove(booking.id)}
                                                className="bg-green-100 text-green-700 hover:bg-green-200 text-xs px-2 py-1 rounded"
                                            >
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => onReject(booking.id)}
                                                className="bg-red-100 text-red-700 hover:bg-red-200 text-xs px-2 py-1 rounded"
                                            >
                                                Reject
                                            </button>
                                        </>
                                    )}
                                    <button
                                        onClick={() => setEditBooking(booking)}
                                        className="bg-blue-100 text-blue-700 hover:bg-blue-200 text-xs px-2 py-1 rounded"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => setDeleteBooking(booking)}
                                        className="bg-gray-100 text-gray-700 hover:bg-gray-200 text-xs px-2 py-1 rounded"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            
            {/* Edit Booking Modal */}
            {editBooking && (
                <EditBookingModal 
                    booking={editBooking} 
                    rooms={Array.from(new Set(bookings.map(b => b.room)))} 
                    onSave={(updatedBooking) => {
                        // Update booking in parent component
                        const updatedBookings = bookings.map(b => 
                            b.id === updatedBooking.id ? updatedBooking : b
                        );
                        // Refresh the list by calling the parent's update function
                        // This would ideally be passed as a prop like onBookingUpdated
                        setEditBooking(null);
                    }} 
                    onClose={() => setEditBooking(null)} 
                />
            )}
            
            {/* Delete Booking Modal */}
            {deleteBooking && (
                <DeleteBookingModal 
                    booking={deleteBooking} 
                    onDelete={() => {
                        // Delete booking in parent component
                        // This would ideally call a parent function like onDeleteBooking
                        setDeleteBooking(null);
                    }} 
                    onClose={() => setDeleteBooking(null)} 
                />
            )}
        </div>
    );
}