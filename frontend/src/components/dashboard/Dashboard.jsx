import { useState } from 'react';
import BookingForm from '../booking/BookingForm';
import CalendarView from '../calendar/CalendarView';
import MyBookings from '../bookings/MyBookings';

export default function Dashboard({ user }) {
    const [activeTab, setActiveTab] = useState('booking');
    const [rooms] = useState(['Conference Room A', 'Conference Room B', 'Meeting Room 1', 'Meeting Room 2']);
    const [selectedRoom, setSelectedRoom] = useState(rooms[0]);
    const [bookings, setBookings] = useState([]);
    
    return (
        <div className="bg-white rounded-lg shadow">
            <div className="border-b">
                <h2 className="text-lg font-semibold px-4 pt-4">Welcome, {user.name}</h2>
                <nav className="flex">
                    <button
                        className={`px-4 py-3 font-medium text-sm focus:outline-none ${activeTab === 'booking' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                        onClick={() => setActiveTab('booking')}
                    >
                        Book a Room
                    </button>
                    <button
                        className={`px-4 py-3 font-medium text-sm focus:outline-none ${activeTab === 'calendar' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                        onClick={() => setActiveTab('calendar')}
                    >
                        Calendar
                    </button>
                    <button
                        className={`px-4 py-3 font-medium text-sm focus:outline-none ${activeTab === 'mybookings' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                        onClick={() => setActiveTab('mybookings')}
                    >
                        My Bookings
                    </button>
                </nav>
            </div>
            
            <div className="p-6">
                {activeTab === 'booking' && (
                    <BookingForm 
                        user={user} 
                        rooms={rooms} 
                        onBookingCreated={(booking) => setBookings([...bookings, booking])} 
                    />
                )}
                {activeTab === 'calendar' && (
                    <div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Select Room</label>
                            <select
                                className="w-full sm:w-64 p-2 border border-gray-300 rounded-md"
                                value={selectedRoom}
                                onChange={(e) => setSelectedRoom(e.target.value)}
                            >
                                {rooms.map(room => (
                                    <option key={room.id} value={room.name}>{room.name}</option>
                                ))}
                            </select>
                        </div>
                        <CalendarView room={selectedRoom} bookings={bookings} />
                    </div>
                )}
                {activeTab === 'mybookings' && (
                    <MyBookings user={user} rooms={rooms} bookings={bookings} setBookings={setBookings} />
                )}
            </div>
        </div>
    );
}