export default function BookingModal({ booking, onClose }) {
    if (!booking) return null;
    
    return (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}>
            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg relative">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">{booking.eventName}</h3>
                    <button 
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        &times;
                    </button>
                </div>
                
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Room</p>
                            <p>{booking.room}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Booked By</p>
                            <p>{booking.userName}</p>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Date</p>
                            <p>
                                {booking.startDate === booking.endDate ? 
                                    new Date(booking.startDate).toLocaleDateString() : 
                                    `${new Date(booking.startDate).toLocaleDateString()} - ${new Date(booking.endDate).toLocaleDateString()}`
                                }
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Time</p>
                            <p>{booking.startTime} - {booking.endTime}</p>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Status</p>
                            <p className={`inline-block px-2 py-1 text-xs rounded-full font-medium
                              ${booking.status === 'approved' ? 'bg-green-100 text-green-800' : 
                                booking.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                                'bg-yellow-100 text-yellow-800'}`}
                            >
                                {booking.status}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Frequency</p>
                            <p className="capitalize">{booking.frequency}</p>
                        </div>
                    </div>
                </div>
                
                <div className="mt-6 flex justify-end">
                    <button
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                        onClick={onClose}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}