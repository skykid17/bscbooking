import { useState, useEffect, useCallback } from 'react';
import BookingTable from './BookingTable';
import BookingFilter from './BookingFilter';
import EditBookingModal from './EditBookingModal';
import DeleteSeriesBookingModal from './DeleteSeriesBookingModal';
import axios from 'axios';
import { toast } from 'react-toastify';
import { formatDateTime } from '../../utils/dateUtils';
import { API_BASE_URL } from '../../utils/apiConfig';

export default function MyBookings({ user, rooms, bookings, setBookings }) {
    const [filteredBookings, setFilteredBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(5);
    const [selectedRoom, setSelectedRoom] = useState('');
    const [selectedDate, setSelectedDate] = useState('');
    const [editBooking, setEditBooking] = useState(null);
    const [deleteBooking, setDeleteBooking] = useState(null);
    
    // Define fetchBookings as a memoized function with useCallback
    const fetchBookings = useCallback(async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            
            if (!user.id) {
                console.error('User ID is missing, using local data');
                const userBookings = bookings.filter(booking => booking.userId === user.id);
                setFilteredBookings(userBookings);
                setLoading(false);
                return;
            }
            
            const response = await axios.get(
                `${API_BASE_URL}/bookings/user/${user.id}`,
                {
                    headers: { 
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
            
            const formattedBookings = response.data.map(booking => ({
                id: booking.id,
                userId: booking.user_id,
                userName: booking.user_name,
                room: booking.room,
                eventName: booking.event_name,
                startDateTime: formatDateTime(booking.start_datetime),
                endDateTime: formatDateTime(booking.end_datetime),
                frequency: booking.frequency,
                status: booking.status,
                createdAt: booking.created_at,
                approvedAt: booking.approved_at,
                seriesId: booking.series_id
            }));
            
            setFilteredBookings(formattedBookings);
            setBookings(prev => {
                // Merge existing bookings with new ones, avoiding duplicates by ID
                const existingIds = new Set(prev.map(b => b.id));
                const newBookings = formattedBookings.filter(b => !existingIds.has(b.id));
                return [...prev, ...newBookings];
            });
            
            // Reapply filters after refresh
            if (selectedRoom || selectedDate) {
                handleFilter(selectedRoom, selectedDate);
            }
            
            return formattedBookings;
        } catch (error) {
            console.error('Error fetching bookings:', error);
            // Fall back to local data if API fails
            setFilteredBookings(bookings.filter(booking => booking.userId === user.id));
            toast.error('Failed to refresh booking data');
            return [];
        } finally {
            setLoading(false);
        }
    }, [user.id, user.username]);
    
    // Load user's bookings on component mount
    useEffect(() => {
        fetchBookings();
    }, [fetchBookings]);
    
    // Apply filters
    const handleFilter = (room, date) => {
        setSelectedRoom(room);
        setSelectedDate(date);
        
        let filtered = bookings.filter(booking => booking.userId === user.id);
        
        if (room) {
            filtered = filtered.filter(booking => booking.room === room);
        }
        
        if (date) {
            filtered = filtered.filter(booking => {
                const bookingStart = new Date(booking.startDateTime);
                const bookingEnd = new Date(booking.endDateTime);
                const filterDate = new Date(date);
                
                return filterDate >= bookingStart && filterDate <= bookingEnd;
            });
        }
        
        setFilteredBookings(filtered);
        setCurrentPage(1); // Reset to first page when filtering
    };
    
    // Handle editing a booking
    const handleEditClick = (booking) => {
        setEditBooking(booking);
    };
    
    // Handle deleting a booking
    const handleDeleteClick = (booking) => {
        setDeleteBooking(booking);
    };
    
    // Update a booking
    const handleUpdateBooking = async (updatedBooking) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(
                `${API_BASE_URL}/bookings/${updatedBooking.id}`,
                {
                    room: updatedBooking.room,
                    eventName: updatedBooking.eventName,
                    start_datetime: updatedBooking.start_datetime,
                    end_datetime: updatedBooking.end_datetime,
                    frequency: updatedBooking.frequency
                },
                {
                    headers: { 
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
            
            toast.success('Booking updated successfully');
            setEditBooking(null);
            
            // Refresh data after update
            await fetchBookings();
            
        } catch (error) {
            console.error('Error updating booking:', error);
            toast.error('Failed to update booking');
        }
    };
    
    // Delete a booking
    const handleDeleteBooking = async (bookingId, deleteType) => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            
            const url = deleteType 
                ? `${API_BASE_URL}/bookings/series/${bookingId}?deleteType=${deleteType}`
                : `${API_BASE_URL}/bookings/${bookingId}`;
                
            await axios.delete(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            // Refresh bookings after deletion
            await fetchBookings();
            toast.success('Booking deleted successfully');
        } catch (error) {
            console.error('Error deleting booking:', error);
            toast.error(error.response?.data?.message || 'Failed to delete booking');
        } finally {
            setLoading(false);
        }
    };
    
    // Calculate pagination
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentBookings = filteredBookings.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
    
    return (
        <div>
            <h2 className="text-xl font-semibold mb-6 text-gray-800">My Bookings</h2>
            
            {/* Filter form with refresh capability */}
            <BookingFilter 
                rooms={rooms} 
                onFilter={handleFilter} 
                selectedRoom={selectedRoom}
                selectedDate={selectedDate}
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
                    <BookingTable 
                        bookings={currentBookings} 
                        onEditClick={handleEditClick} 
                        onDeleteClick={handleDeleteClick}
                        user={user}
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
            
            {/* Edit Booking Modal */}
            {editBooking && (
                <EditBookingModal 
                    booking={editBooking} 
                    rooms={rooms} 
                    onSave={handleUpdateBooking} 
                    onClose={() => setEditBooking(null)} 
                />
            )}
            
            {/* Delete Booking Modal */}
            {deleteBooking && (
                <DeleteSeriesBookingModal 
                    booking={deleteBooking} 
                    onClose={() => setDeleteBooking(null)}
                    onDelete={(deleteType) => handleDeleteBooking(deleteBooking.id, deleteType)}
                />
            )}
        </div>
    );
}