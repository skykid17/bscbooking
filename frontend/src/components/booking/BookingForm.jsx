import { useState, useEffect } from 'react';
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
    
    // For admin booking on behalf of users
    const [users, setUsers] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState(user.id);
    const [selectedUserName, setSelectedUserName] = useState(user.name);
    const [loadingUsers, setLoadingUsers] = useState(false);
    
    // Fetch all users if current user is admin
    useEffect(() => {
        if (user.role === 'admin') {
            const fetchUsers = async () => {
                try {
                    setLoadingUsers(true);
                    const token = localStorage.getItem('token');
                    
                    const response = await axios.get('http://localhost:5000/api/users', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    
                    setUsers(response.data);
                } catch (error) {
                    console.error('Error fetching users:', error);
                    setError('Failed to load users. You may not be able to book on behalf of users.');
                } finally {
                    setLoadingUsers(false);
                }
            };
            
            fetchUsers();
        }
    }, [user.role]);
    
    // Handle user selection change
    const handleUserChange = (e) => {
        const userId = e.target.value;
        const selectedUser = users.find(u => u.id === userId);
        
        if (selectedUser) {
            setSelectedUserId(selectedUser.id);
            setSelectedUserName(selectedUser.name);
        } else {
            setSelectedUserId(user.id);
            setSelectedUserName(user.name);
        }
    };
    
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
        
        // If admin is booking on behalf of someone else, use that user's details
        // Otherwise, use the current user's details
        const bookingUserId = user.role === 'admin' ? selectedUserId : user.id;
        const bookingUserName = user.role === 'admin' ? selectedUserName : user.name;
        
        const bookingData = {
            room,
            startDate,
            endDate: isMultipleDays ? endDate : startDate,
            startTime,
            endTime,
            eventName,
            frequency,
            userId: bookingUserId,
            userName: bookingUserName
        };
        
        try {
            setIsLoading(true);
            
            // Log the request details for debugging
            console.log('Sending booking request:', bookingData);
            console.log('Auth token exists:', !!localStorage.getItem('token'));
            
            const token = localStorage.getItem('token');
            const response = await axios.post(
                'http://localhost:5000/api/bookings',
                bookingData,
                {
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
            
            console.log('Server response:', response.data);
            
            // Add created booking to state
            const createdBooking = response.data.booking;
            onBookingCreated(createdBooking);
            
            // Show different success message based on who created the booking
            if (user.role === 'admin' && bookingUserId !== user.id) {
                setSuccess(`Booking for ${bookingUserName} has been ${createdBooking.status === 'approved' ? 'created' : 'submitted for approval'}.`);
            } else {
                setSuccess('Your booking request has been submitted and is pending approval.');
            }
            
            // Reset form
            setEventName('');
            setStartTime('09:00');
            setEndTime('10:00');
            setIsMultipleDays(false);
            setEndDate(formattedToday);
            setFrequency('single');
            
        } catch (err) {
            console.error('Booking error:', err);
            if (err.response) {
                console.error('Error response data:', err.response.data);
                console.error('Error response status:', err.response.status);
                setError(err.response?.data?.message || `Error ${err.response.status}: Failed to create booking.`);
            } else if (err.request) {
                console.error('No response received:', err.request);
                setError('Server did not respond. Please check if the backend is running.');
            } else {
                console.error('Request setup error:', err.message);
                setError('Failed to send request: ' + err.message);
            }
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <h2 className="text-xl font-semibold mb-6 text-gray-800">
                {user.role === 'admin' ? 'Create Booking' : 'Book a Room'}
            </h2>
            
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
                {/* User selection dropdown for admins only */}
                {user.role === 'admin' && (
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Book for User *</label>
                        <select
                            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={selectedUserId}
                            onChange={handleUserChange}
                            disabled={loadingUsers}
                            required
                        >
                            {loadingUsers ? (
                                <option>Loading users...</option>
                            ) : (
                                <>
                                    <option value={user.id}>{user.name} (You)</option>
                                    {users
                                        .filter(u => u.id !== user.id) // Filter out the current admin
                                        .map(u => (
                                            <option key={u.id} value={u.id}>
                                                {u.name} ({u.username})
                                            </option>
                                        ))
                                    }
                                </>
                            )}
                        </select>
                    </div>
                )}
                
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
                    {isLoading ? 'Submitting...' : user.role === 'admin' ? 'Create Booking' : 'Submit Booking Request'}
                </button>
            </div>
        </form>
    );
}