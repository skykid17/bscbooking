import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

export default function EditSeriesBookingModal({ booking, onClose, onUpdate, rooms }) {
    const [room, setRoom] = useState(booking?.room || '');
    const [startDate, setStartDate] = useState(booking?.startDate || '');
    const [endDate, setEndDate] = useState(booking?.endDate || '');
    const [startTime, setStartTime] = useState(booking?.startTime || '');
    const [endTime, setEndTime] = useState(booking?.endTime || '');
    const [eventName, setEventName] = useState(booking?.eventName || '');
    const [frequency, setFrequency] = useState(booking?.frequency || 'single');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    
    // Series options
    const [updateType, setUpdateType] = useState('this');
    const [isSeriesBooking, setIsSeriesBooking] = useState(false);
    
    useEffect(() => {
        // Check if this is part of a series
        setIsSeriesBooking(booking?.seriesId ? true : false);
    }, [booking]);

    // Generate time slots (6:00 AM to 12:00 AM in 30-minute increments)
    const generateTimeSlots = () => {
        const slots = [];
        for (let hour = 6; hour <= 23; hour++) {
            const hourFormatted = hour.toString().padStart(2, '0');
            slots.push(`${hourFormatted}:00`);
            slots.push(`${hourFormatted}:30`);
        }
        slots.push('00:00'); // Midnight (12:00 AM)
        return slots;
    };
    
    const timeSlots = generateTimeSlots();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        // Validation
        if (!room || !startDate || !startTime || !endTime || !eventName) {
            setError('Please fill in all required fields.');
            return;
        }
        
        if (startDate === endDate && startTime >= endTime) {
            setError('End time must be after start time.');
            return;
        }

        const start_datetime = `${startDate} ${startTime}`;
        const end_datetime = `${endDate} ${endTime}`;

        try {
            setIsLoading(true);
            
            const token = localStorage.getItem('token');
            const response = await axios.put(
                `http://localhost:5000/api/bookings/series/${booking.id}`,
                {
                    room,
                    start_datetime,
                    end_datetime,
                    eventName,
                    frequency,
                    updateType // 'this', 'future', or 'all'
                },
                {
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
            
            toast.success('Booking updated successfully');
            const updatedBooking = {
                ...booking,
                room,
                start_datetime,
                end_datetime,
                eventName,
                frequency,
                updateType
            };
            await onUpdate(updatedBooking); // Refresh the bookings list
            onClose(); // Close the modal
            
        } catch (err) {
            console.error('Update error:', err);
            if (err.response) {
                setError(err.response?.data?.message || `Error ${err.response.status}: Failed to update booking.`);
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
                    <h2 className="text-xl font-semibold">Edit Booking</h2>
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
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Series options - Only show if it's part of a series */}
                    {isSeriesBooking && (
                        <div className="mb-4 p-3 bg-blue-50 rounded border border-blue-200">
                            <h3 className="text-sm font-medium text-blue-800 mb-2">This is part of a recurring series</h3>
                            <div className="space-y-2">
                                <div className="flex items-center">
                                    <input 
                                        type="radio" 
                                        id="edit-this" 
                                        name="update-type" 
                                        value="this" 
                                        checked={updateType === 'this'} 
                                        onChange={() => setUpdateType('this')}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                    />
                                    <label htmlFor="edit-this" className="ml-2 text-sm text-gray-700">
                                        This event only
                                    </label>
                                </div>
                                <div className="flex items-center">
                                    <input 
                                        type="radio" 
                                        id="edit-future" 
                                        name="update-type" 
                                        value="future" 
                                        checked={updateType === 'future'} 
                                        onChange={() => setUpdateType('future')}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                    />
                                    <label htmlFor="edit-future" className="ml-2 text-sm text-gray-700">
                                        This and future events
                                    </label>
                                </div>
                                <div className="flex items-center">
                                    <input 
                                        type="radio" 
                                        id="edit-all" 
                                        name="update-type" 
                                        value="all" 
                                        checked={updateType === 'all'} 
                                        onChange={() => setUpdateType('all')}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                    />
                                    <label htmlFor="edit-all" className="ml-2 text-sm text-gray-700">
                                        All events in series
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Room *</label>
                        <select
                            className="w-full p-2 border border-gray-300 rounded-md"
                            value={room}
                            onChange={(e) => setRoom(e.target.value)}
                            required
                        >
                            {rooms.map((r) => (
                                <option key={r.id} value={r.name}>{r.name}</option>
                            ))}
                        </select>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Event Name *</label>
                        <input
                            type="text"
                            className="w-full p-2 border border-gray-300 rounded-md"
                            value={eventName}
                            onChange={(e) => setEventName(e.target.value)}
                            required
                        />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                            <input
                                type="date"
                                className="w-full p-2 border border-gray-300 rounded-md"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                required
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
                            <input
                                type="date"
                                className="w-full p-2 border border-gray-300 rounded-md"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                min={startDate}
                                required
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Start Time *</label>
                            <select
                                className="w-full p-2 border border-gray-300 rounded-md"
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                required
                            >
                                {timeSlots.map(time => (
                                    <option key={`start-${time}`} value={time}>{time}</option>
                                ))}
                            </select>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">End Time *</label>
                            <select
                                className="w-full p-2 border border-gray-300 rounded-md"
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                                required
                            >
                                {timeSlots.map(time => (
                                    <option key={`end-${time}`} value={time}>{time}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    
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
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}