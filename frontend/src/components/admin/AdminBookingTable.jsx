import { useState } from 'react';
import EditSeriesBookingModal from '../bookings/EditSeriesBookingModal';
import DeleteSeriesBookingModal from '../bookings/DeleteSeriesBookingModal'; 
import ApproveSeriesBookingModal from '../bookings/ApproveSeriesBookingModal';

export default function AdminBookingTable({ bookings, onApprove, onReject, onEdit, onDelete, onRefresh, rooms }) {
    const [editBooking, setEditBooking] = useState(null);
    const [deleteBooking, setDeleteBooking] = useState(null);
    const [approveBooking, setApproveBooking] = useState(null);
    
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString();
    };
    
    const formatDateTime = (dateTimeString) => {
        if (!dateTimeString) return '';
        const date = new Date(dateTimeString);
        console.log(dateTimeString, date);
        return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
    };
    
    const isSeriesBooking = (booking) => {
        return booking.seriesId ? true : false;
    };
    
    const handleEdit = (booking) => {
        if (typeof onEdit === 'function') {
            onEdit(booking);
        } else {
            console.error("onEdit prop is not a function");
        }
    };
    
    const handleDelete = (bookingId, deleteType) => {
        if (typeof onDelete === 'function') {
            onDelete(bookingId, deleteType);
        } else {
            console.error("onDelete prop is not a function");
        }
        setDeleteBooking(null);
    };
    
    const handleApproveReject = (action, bookingId, approveType) => {
        if (action === 'approve' && typeof onApprove === 'function') {
            onApprove(bookingId, approveType);
        } else if (action === 'reject' && typeof onReject === 'function') {
            onReject(bookingId, approveType);
        } else {
            console.error(`on${action.charAt(0).toUpperCase() + action.slice(1)} prop is not a function`);
        }
        setApproveBooking(null);
        // No toast here - let parent component handle it
    };

    const refreshData = () => {
        if (typeof onRefresh === 'function') {
            onRefresh();
        } else {
            console.error("onRefresh prop is not a function");
        }
    };

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
                <thead>
                    <tr className="bg-gray-100 text-gray-700 text-sm uppercase">
                        <th className="px-4 py-3 text-left">User</th>
                        <th className="px-4 py-3 text-left">Date Created</th>
                        <th className="px-4 py-3 text-left">Room</th>
                        <th className="px-4 py-3 text-left">Start</th>
                        <th className="px-4 py-3 text-left">End</th>
                        <th className="px-4 py-3 text-left">Event Name</th>
                        <th className="px-4 py-3 text-left">Series</th>
                        <th className="px-4 py-3 text-left">Status</th>
                        <th className="px-4 py-3 text-left">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {bookings.map(booking => (
                        <tr key={booking.id} className="border-b hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm">{booking.userName}</td>
                            <td className="px-4 py-3 text-sm">
                                {booking.createdAt ? formatDate(booking.createdAt) : formatDate(new Date())}
                            </td>
                            <td className="px-4 py-3 text-sm">{booking.room}</td>
                            <td className="px-4 py-3 text-sm">{formatDateTime(booking.startDateTime)}</td>
                            <td className="px-4 py-3 text-sm">{formatDateTime(booking.endDateTime)}</td>
                            <td className="px-4 py-3 text-sm font-medium">
                                {booking.eventName}
                            </td>
                            <td className="px-4 py-3 text-sm">
                                {booking.seriesId ? (
                                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                                        Series
                                    </span>
                                ) : (
                                    <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                                        Single
                                    </span>
                                )}
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
                                                onClick={() => setApproveBooking(booking)}
                                                className="bg-green-100 text-green-700 hover:bg-green-200 text-xs px-2 py-1 rounded"
                                            >
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => setApproveBooking(booking)}
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
                <EditSeriesBookingModal 
                    booking={editBooking} 
                    rooms={rooms}
                    onClose={() => setEditBooking(null)}
                    onUpdate={(updatedBooking) => {
                        handleEdit(updatedBooking);
                        setEditBooking(null);
                    }}
                />
            )}
            
            {/* Delete Booking Modal */}
            {deleteBooking && (
                <DeleteSeriesBookingModal 
                    booking={deleteBooking} 
                    onClose={() => setDeleteBooking(null)}
                    onDelete={(deleteType) => handleDelete(deleteBooking.id, deleteType)}
                />
            )}
            
            {/* Approve/Reject Booking Modal */}
            {approveBooking && (
                <ApproveSeriesBookingModal 
                    booking={approveBooking} 
                    onClose={() => setApproveBooking(null)}
                    onApproved={(action, approveType) => handleApproveReject(action, approveBooking.id, approveType)}
                />
            )}
        </div>
    );
}