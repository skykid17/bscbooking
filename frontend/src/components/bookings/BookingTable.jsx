import { formatDate, formatBookingDateTime } from '../../utils/dateUtils';

export default function BookingTable({ bookings, onEditClick, onDeleteClick, user }) {
    console.log("BookingTable received bookings:", bookings);

    // Check if user can edit a booking (only if status is pending)
    const canEdit = (booking) => {
        return booking.status === 'pending' || user.role === 'admin';
    };
    
    return (
        <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200 rounded-lg overflow-hidden">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {bookings.map((booking) => (
                        <tr key={booking.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-500">
                                {booking.createdAt ? formatDate(booking.createdAt) : formatDate(new Date())}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-800">{booking.room}</td>
                            <td className="px-4 py-3 text-sm text-gray-800">{formatBookingDateTime(booking.startDateTime)}</td>
                            <td className="px-4 py-3 text-sm text-gray-800">{formatBookingDateTime(booking.endDateTime)}</td>
                            <td className="px-4 py-3 text-sm text-gray-800 font-medium">
                                {booking.eventName || 'No event name'}
                            </td>
                            <td className="px-4 py-3 text-sm">
                                <span className={`px-2 py-1 text-xs rounded-full font-medium
                                    ${booking.status === 'approved' ? 'bg-green-100 text-green-800' : 
                                      booking.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                                      'bg-yellow-100 text-yellow-800'}`}
                                >
                                    {booking.status}
                                </span>
                            </td>
                            <td className="px-4 py-3 text-sm whitespace-nowrap">
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => onEditClick(booking)}
                                        disabled={!canEdit(booking)}
                                        className={`text-xs px-2 py-1 rounded 
                                            ${canEdit(booking) 
                                                ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => onDeleteClick(booking)}
                                        className="bg-red-100 text-red-700 hover:bg-red-200 text-xs px-2 py-1 rounded"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}