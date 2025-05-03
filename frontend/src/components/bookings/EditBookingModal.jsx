import { useState, useEffect } from 'react';
import { formatDateForInput, formatTime } from '../../utils/dateUtils'; // Assuming you have a utility function for formatting dates

export default function EditBookingModal({ booking, rooms, onSave, onClose }) {
    const [room, setRoom] = useState(booking.room);
    const [startDate, setStartDate] = useState(formatDateForInput(booking.startDateTime));
    const [endDate, setEndDate] = useState(formatDateForInput(booking.endDateTime));
    const [startTime, setStartTime] = useState(formatTime(booking.startDateTime));
    const [endTime, setEndTime] = useState(formatTime(booking.endDateTime));
    const [eventName, setEventName] = useState(booking.eventName);
    const [frequency, setFrequency] = useState(booking.frequency || 'single');
    const [error, setError] = useState('');
    
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
    
    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        
        // Validation
        if (!room || !startDate || !startTime || !endTime || !eventName) {
            setError('Please fill in all required fields.');
            return;
        }
        
        if (isMultipleDays && new Date(endDate) < new Date(startDate)) {
            setError('End date cannot be before start date.');
            return;
        }
        
        if (startDate === endDate && startTime >= endTime) {
            setError('End time must be after start time.');
            return;
        }
        
        const start_datetime = `${startDate} ${startTime}`;
        const end_datetime = `${isMultipleDays ? endDate : startDate} ${endTime}`;

        const updatedBooking = {
            ...booking,
            room,
            start_datetime,
            end_datetime,
            eventName,
            frequency
        };
        
        onSave(updatedBooking);
    };
    
    return (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-2xl">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">Edit Booking</h3>
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
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Room *</label>
                            <select
                                className="w-full p-2 border border-gray-300 rounded-md"
                                value={room}
                                onChange={(e) => setRoom(e.target.value)}
                                required
                            >
                                {rooms.map(r => (
                                    <option key={r.id} value={r.name}>{r.name}</option>
                                ))}
                            </select>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Event Name *</label>
                            <input
                                type="text"
                                placeholder="Enter event name"
                                className="w-full p-2 border border-gray-300 rounded-md"
                                value={eventName}
                                onChange={(e) => setEventName(e.target.value)}
                                required
                            />
                        </div>
                        
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
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                            <select
                                className="w-full p-2 border border-gray-300 rounded-md"
                                value={frequency}
                                onChange={(e) => setFrequency(e.target.value)}
                            >
                                <option value="single">Single Use</option>
                                <option value="daily">Daily</option>
                                <option value="weekly">Weekly</option>
                                <option value="monthly">Monthly</option>
                            </select>
                        </div>
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
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}