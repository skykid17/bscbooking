import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import AdminBookingTable from './AdminBookingTable';
import AdminFilter from './AdminFilter';
import UserManagement from './UserManagement';
import BookingForm from '../bookings/BookingForm';
import CalendarView from '../calendar/CalendarView';
import RoomManagement from './RoomManagement';
import { toast } from 'react-toastify';

const VITE_API_URL = import.meta.env.VITE_API_URL;

export default function AdminDashboard({ user }) {
    // Get active tab from localStorage (or default to 'bookings')
    const [activeTab, setActiveTab] = useState(() => {
        return localStorage.getItem('activeTab') || 'bookings';
    });
    
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

    const [bookings, setBookings] = useState([]);
    const [filteredBookings, setFilteredBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [selectedRoom, setSelectedRoom] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [userId, setUserId] = useState(null);
    const [roomFilter, setRoomFilter] = useState(null);
    const [dateFilter, setDateFilter] = useState(null);
    const [statusFilter, setStatusFilter] = useState(null);

    // Fetch rooms
    useEffect(() => {
        const fetchRooms = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(
                    `${VITE_API_URL}/rooms`,
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
    
    // Make fetchBookings memoized with useCallback
    const fetchBookings = useCallback(async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            
            const response = await axios.get(
                `${VITE_API_URL}/bookings`,
                {
                    headers: { 
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
            
            // Format the data from backend to match frontend structure
            const formattedBookings = response.data.map(booking => ({
                id: booking.id,
                userId: booking.user_id,
                userName: booking.user_name,
                room: booking.room,
                eventName: booking.event_name,
                startDateTime: booking.start_datetime, // Make sure this is a valid date string
                endDateTime: booking.end_datetime,     // Make sure this is a valid date string
                frequency: booking.frequency,
                status: booking.status,
                createdAt: booking.created_at,
                approvedAt: booking.approved_at,
                approvedBy: booking.approved_by,
                seriesId: booking.series_id
            }));
            
            setBookings(formattedBookings);
            
            // Re-apply filters if any are active
            if (userId || roomFilter || dateFilter || statusFilter) {
                handleFilter(userId, roomFilter, dateFilter, statusFilter);
            } else {
                setFilteredBookings(formattedBookings);
            }
            
            return formattedBookings;
        } catch (error) {
            console.error('Error fetching bookings:', error);
            toast.error('Failed to refresh booking data');
            return [];
        } finally {
            setLoading(false);
        }
    }, [userId, roomFilter, dateFilter, statusFilter]);

    // Use the named function in useEffect
    useEffect(() => {
        fetchBookings();
    }, [fetchBookings]);
    
    // Fetch all users
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const token = localStorage.getItem('token');
                
                const response = await axios.get(
                    `${VITE_API_URL}/users`,
                    {
                        headers: { 
                            'Authorization': `Bearer ${token}`
                        }
                    }
                );
                
                setUsers(response.data);
            } catch (error) {
                console.error('Error fetching users:', error);
            }
        };
        
        if (activeTab === 'users') {
            fetchUsers();
        }
    }, [activeTab]);
    
    // Filter bookings
    const handleFilter = (userId, roomObjects, date, statusValue) => {
        let filtered = [...bookings];
        
        if (userId) {
            filtered = filtered.filter(booking => booking.userId === userId);
        }
        
        if (roomObjects) {
            filtered = filtered.filter(booking => roomObjects.some(room => room.name === booking.room));
        }
        
        if (date) {
            filtered = filtered.filter(booking => {
                const bookingStart = new Date(booking.startDateTime);
                const bookingEnd = new Date(booking.endDateTime);
                const filterDate = new Date(date);
                
                return filterDate >= bookingStart && filterDate <= bookingEnd;
            });
        }
        
        if (statusValue) {
            filtered = filtered.filter(booking => booking.status === statusValue);
        }
        
        setFilteredBookings(filtered);
        setCurrentPage(1);
    };
    
    // Handle booking actions
    const handleApproveBooking = async (bookingId, approveType) => {
        try {
            const token = localStorage.getItem('token');
            
            const url = approveType 
                ? `${VITE_API_URL}/bookings/series/${bookingId}/approve?approveType=${approveType}`
                : `${VITE_API_URL}/bookings/${bookingId}/approve`;
                
            await axios.put(url, {}, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            // Standardized toast - only show here, not in modal
            toast.success('Booking approved successfully');
            
            // Refresh data
            await fetchBookings();
        } catch (error) {
            console.error('Error approving booking:', error);
            toast.error('Failed to approve booking');
        }
    };
    
    const handleRejectBooking = async (bookingId) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(
                `${VITE_API_URL}/bookings/${bookingId}/reject`,
                {},
                {
                    headers: { 
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
            
            toast.success('Booking rejected successfully');
            
            // Refresh data instead of manual state updates
            await fetchBookings();
        } catch (error) {
            console.error('Error rejecting booking:', error);
            alert('Failed to reject booking. Please try again.');
        }
    };
    
    const handleDeleteBooking = async (bookingId, deleteType) => {
        try {
            const token = localStorage.getItem('token');
            
            // Set the appropriate URL based on deleteType
            const url = deleteType 
                ? `${VITE_API_URL}/bookings/series/${bookingId}?deleteType=${deleteType}`
                : `${VITE_API_URL}/bookings/${bookingId}`;
                
            await axios.delete(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            toast.success('Booking deleted successfully');
            
            // Refresh data instead of manual state updates
            await fetchBookings();
        } catch (error) {
            console.error('Error deleting booking:', error);
            toast.error(error.response?.data?.message || 'Failed to delete booking');
        }
    };
    
    // Handle a new booking created from the form
    const handleBookingCreated = async (newBooking) => {
        setBookings(prevBookings => [...prevBookings, newBooking]);
        
        // Show success toast notification
        toast.success(
            newBooking.status === 'approved' 
                ? 'Booking created successfully' 
                : 'Booking submitted for approval'
        );
        
        // Refresh data to ensure consistency
        await fetchBookings();
        
        setActiveTab('bookings'); // Switch to bookings tab to see the new booking
    };
    
    // Pagination
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentBookings = filteredBookings.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
    
    return (
        <div className="bg-white rounded-lg shadow">
            <div className="p-6">
                {/* Conditional rendering based on active tab */}
                {activeTab === 'create-booking' && (
                    <BookingForm 
                        user={user} 
                        rooms={rooms} 
                        onBookingCreated={handleBookingCreated}
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
                
                {activeTab === 'bookings' && (
                    <>
                        <h3 className="text-xl font-semibold mb-6 text-gray-800">All Bookings</h3>
                        
                        <AdminFilter 
                            users={users}
                            rooms={rooms}
                            onFilter={handleFilter} 
                            onRefresh={fetchBookings}
                        />
                        
                        {/* Bookings table */}
                        {loading ? (
                            <div className="text-center py-8">
                                <p className="text-gray-500">Loading bookings...</p>
                            </div>
                        ) : filteredBookings.length === 0 ? (
                            <div className="text-center py-8 bg-gray-50 rounded-md">
                                <p className="text-gray-500">No bookings found.</p>
                            </div>
                        ) : (
                            <>
                                <AdminBookingTable 
                                    bookings={currentBookings} 
                                    onApprove={handleApproveBooking}
                                    onReject={handleRejectBooking}
                                    onDelete={handleDeleteBooking}
                                    onRefresh={fetchBookings}
                                    rooms={rooms}
                                />
                                
                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="flex justify-center mt-6">
                                        <div className="flex space-x-1">
                                            <button 
                                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                                disabled={currentPage === 1}
                                                className={`px-3 py-1 rounded ${currentPage === 1 ? 'bg-gray-100 text-gray-400' : 'bg-gray-200 hover:bg-gray-300'}`}
                                            >
                                                &laquo; Prev
                                            </button>
                                            
                                            {[...Array(totalPages)].map((_, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => setCurrentPage(i + 1)}
                                                    className={`px-3 py-1 rounded ${currentPage === i + 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
                                                >
                                                    {i + 1}
                                                </button>
                                            ))}
                                            
                                            <button 
                                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                                disabled={currentPage === totalPages}
                                                className={`px-3 py-1 rounded ${currentPage === totalPages ? 'bg-gray-100 text-gray-400' : 'bg-gray-200 hover:bg-gray-300'}`}
                                            >
                                                Next &raquo;
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </>
                )}
                
                {activeTab === 'rooms' && (
                    <RoomManagement 
                        rooms={rooms} 
                        setRooms={setRooms}
                    />
                )}
                
                {activeTab === 'users' && (
                    <UserManagement users={users} setUsers={setUsers} />
                )}

                {activeTab === 'home' && (
                    <div className="text-center py-8">
                        <h3 className="text-xl font-semibold mb-6 text-gray-800">Welcome to Admin Dashboard</h3>
                        <p className="text-gray-600">Use the navigation icons above to manage bookings, users, and rooms.</p>
                    </div>
                )}
            </div>
        </div>
    );
}