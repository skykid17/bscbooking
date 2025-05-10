import { useState, useEffect, useCallback } from 'react';
import BookingForm from '../bookings/BookingForm';
import CalendarView from '../calendar/CalendarView';
import MyBookings from '../bookings/MyBookings';
import { toast } from 'react-toastify';
import axios from 'axios';

export default function Dashboard({ user }) {
    // Get active tab from localStorage (or default to 'booking')
    const [activeTab, setActiveTab] = useState(() => {
        return localStorage.getItem('activeTab') || 'booking';
    });
    const [rooms, setRooms] = useState([]);
    const [selectedRoom, setSelectedRoom] = useState('');
    const [bookings, setBookings] = useState([]);

    const fetchBookings = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            // API call to fetch bookings
            const response = await axios.get(
                `http://localhost:5000/api/bookings/user/${user.id}`,
                {
                    headers: { 
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
            
            // Format the data from backend
            const formattedBookings = response.data.map(booking => ({
                id: booking.id,
                userId: booking.user_id,
                userName: booking.user_name,
                room: booking.room,
                eventName: booking.event_name,
                startDateTime: booking.start_datetime,
                endDateTime: booking.end_datetime,
                frequency: booking.frequency,
                status: booking.status,
                createdAt: booking.created_at,
                approvedAt: booking.approved_at,
                seriesId: booking.series_id
            }));

            // Update bookings state
            setBookings(formattedBookings);
            return formattedBookings;
        } catch (error) {
            console.error('Error fetching bookings:', error);
            toast.error('Failed to refresh booking data');
            return [];
        }
    }, [user.id]);

    useEffect(() => {
        fetchBookings();
    }, [fetchBookings]);

    useEffect(() => {
        const fetchRooms = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(
                    'http://localhost:5000/api/rooms',
                    {
                        headers: { 
                            'Authorization': `Bearer ${token}`
                        }
                    }
                );
                
                const roomObjects = response.data.map(room => ({
                    id: room.id,
                    name: room.name
                }));
                setRooms(roomObjects);
                if (roomObjects.length > 0) {
                    setSelectedRoom(roomObjects[0].name);
                }
            } catch (error) {
                console.error('Error fetching rooms:', error);
                alert('Failed to fetch rooms. Please try again.');
            }
        };
        
        fetchRooms();
    }, []);

    // Update active tab when it changes in localStorage
    useEffect(() => {
        const handleStorageChange = () => {
            const newActiveTab = localStorage.getItem('activeTab');
            if (newActiveTab && newActiveTab !== activeTab) {
                setActiveTab(newActiveTab);
            }
        };
        
        window.addEventListener('storage', handleStorageChange);
        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [activeTab]);
    
    return (
        <div className="bg-white rounded-lg shadow">
            <div className="p-6">
                {activeTab === 'home' && (
                    <div className="text-center">
                        <h1 className="text-2xl font-bold mb-4">Welcome {user.username}</h1>
                        <p className="text-gray-600">Select a tab to get started.</p>
                    </div>
                )

                }
                {activeTab === 'create-booking' && (
                    <BookingForm 
                        user={user} 
                        rooms={rooms} 
                        onBookingCreated={(booking) => {
                            setBookings(prev => [...prev, booking]);
                            toast.success(
                                booking.status === 'approved' 
                                    ? 'Booking created successfully' 
                                    : 'Booking submitted for approval'
                            );
                        }} 
                        onRefresh={fetchBookings}
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
                    <MyBookings 
                        user={user} 
                        rooms={rooms} 
                        bookings={bookings} 
                        setBookings={setBookings}
                    />
                )}
            </div>
        </div>
    );
}