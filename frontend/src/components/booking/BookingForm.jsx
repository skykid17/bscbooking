import { useState } from 'react';
import axios from 'axios';

export default function BookingForm({ user, rooms, onBookingCreated }) {
    const today = new Date();
    const formattedToday = today.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    const [room, setRoom] = useState(rooms[0]);
    const [startDate, setStartDate] = useState(formattedToday);
    const [isMultipleDays, setIsMultipleDays] = useState(false);
    const [endDate, setEndDate] = useState(formattedToday);
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('10:00');
    const [eventName, setEventName] = useState('');
    const [frequency, setFrequency] = useState('single');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
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
        setSuccess('');
        
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
        
        const bookingData = {
            room,
            startDate,
            endDate: isMultipleDays ? endDate : startDate,
            startTime,
            endTime,
            eventName,
            frequency,
            userId: user.id,
            userName: user.name,
            status: 'pending'
        };
        
        try {
            setIsLoading(true);
            
            // In a real app, you'd send this to your backend
            // const response = await axios.post('http://localhost:5000/api/bookings', bookingData);
            
            // For now, simulate a successful booking
            setTimeout(() => {
                // Add an ID to simulate database created record
                const createdBooking = { ...bookingData, id: Date.now().toString() };
                
                // Call the callback to update parent state
                onBookingCreated(createdBooking);
                
                setSuccess('Your booking request has been submitted and is pending approval.');
                
                // Reset form
                setEventName('');
                setStartTime('09:00');
                setEndTime('10:00');
                setIsMultipleDays(false);
                setEndDate(formattedToday);
                setFrequency('single');
                
                setIsLoading(false);
            }, 1000);
            
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create booking.');
            setIsLoading(false);
        }
    };
    
    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <h2 className="text-xl font-semibold mb-6 text-gray-800">Book a Room</h2>
            
            {error && (
                <div className="p-3 bg-red-50 text-red-600 text-sm rounded border border-red-200">
                    {error}
                </div>
            )}
            
            {success && (
                <div className="p-3 bg-green-50 text-green-600 text-sm rounded border border-green-200">
                    {success}
                </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Room *</label>
                    <select
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={room}
                        onChange={(e) => setRoom(e.target.value)}
                        required
                    >
                        {rooms.map(room => (
                            <option key={room} value={room}>{room}</option>
                        ))}
                    </select>
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Event Name *</label>
                    <input
                        type="text"
                        placeholder="Enter event name"
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={eventName}
                        onChange={(e) => setEventName(e.target.value)}
                        required
                    />
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                    <input
                        type="date"
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        min={formattedToday}
                        required
                    />
                </div>
                
                <div className="flex items-center">
                    <input
                        type="checkbox"
                        id="multipleDays"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        checked={isMultipleDays}
                        onChange={(e) => setIsMultipleDays(e.target.checked)}
                    />
                    <label htmlFor="multipleDays" className="ml-2 block text-sm text-gray-700">
                        Multiple days booking
                    </label>
                </div>
                
                {isMultipleDays && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
                        <input
                            type="date"
                            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            min={startDate}
                            required={isMultipleDays}
                        />
                    </div>
                )}
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Time *</label>
                    <select
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            
            <div className="pt-4">
                <button
                    type="submit"
                    className={`px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                    disabled={isLoading}
                >
                    {isLoading ? 'Submitting...' : 'Submit Booking Request'}
                </button>
            </div>
        </form>
    );
}