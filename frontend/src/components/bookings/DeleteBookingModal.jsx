export default function DeleteBookingModal({ booking, onDelete, onClose }) {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">Delete Booking</h3>
                    <button 
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        &times;
                    </button>
                </div>
                
                <div className="py-4">
                    <p className="text-gray-800">Are you sure you want to delete your booking for:</p>
                    <div className="mt-2 p-3 bg-gray-50 rounded">
                        <p className="font-medium">{booking.eventName}</p>
                        <p className="text-sm text-gray-600">
                            {booking.room} • {new Date(booking.startDate).toLocaleDateString()} • {booking.startTime} - {booking.endTime}
                        </p>
                    </div>
                    <p className="mt-4 text-sm text-red-600">This action cannot be undone.</p>
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-100"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onDelete}
                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
}