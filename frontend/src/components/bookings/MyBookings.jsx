import { useState, useEffect } from 'react';
import BookingTable from './BookingTable';
import BookingFilter from './BookingFilter';
import EditBookingModal from './EditBookingModal';
import DeleteBookingModal from './DeleteBookingModal';
import axios from 'axios';

export default function MyBookings({ user, rooms, bookings, setBookings }) {
    const [filteredBookings, setFilteredBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(5);
    const [selectedRoom, setSelectedRoom] = useState('');
    const [selectedDate, setSelectedDate] = useState('');
    const [editBooking, setEditBooking] = useState(null);
    const [deleteBooking, setDeleteBooking] = useState(null);
    
    // Load user's bookings
    useEffect(() => {
        const fetchBookings = async () => {
            try {
                setLoading(true);
                // In a real app, fetch from API
                // const response = await axios.get(`http://localhost:5000/api/bookings?userId=${user.id}`);
                // const userBookings = response.data;
                
                // For now, filter from our local state
                const userBookings = bookings.filter(booking => booking.userId === user.id);
                setFilteredBookings(userBookings);
            } catch (error) {
                console.error('Error fetching bookings:', error);
            } finally {
                setLoading(false);
            }
        };
        
        fetchBookings();
    }, [user.id, bookings]);
    
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
                // Check if the booking date range includes the selected date
                const bookingStart = new Date(booking.startDate);
                const bookingEnd = new Date(booking.endDate);
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
    const handleUpdateBooking = (updatedBooking) => {
        // In a real app, make API call
        // const updateBooking = async () => {
        //     try {
        //         await axios.put(`http://localhost:5000/api/bookings/${updatedBooking.id}`, updatedBooking);
        //     } catch (error) {
        //         console.error('Error updating booking:', error);
        //     }
        // };
        // updateBooking();
        
        // Update local state
        const updatedBookings = bookings.map(booking => 
            booking.id === updatedBooking.id ? updatedBooking : booking
        );
        
        setBookings(updatedBookings);
        setEditBooking(null);
    };
    
    // Delete a booking
    const handleDeleteBooking = (bookingId) => {
        // In a real app, make API call
        // const deleteBookingRequest = async () => {
        //     try {
        //         await axios.delete(`http://localhost:5000/api/bookings/${bookingId}`);
        //     } catch (error) {
        //         console.error('Error deleting booking:', error);
        //     }
        // };
        // deleteBookingRequest();
        
        // Update local state
        const updatedBookings = bookings.filter(booking => booking.id !== bookingId);
        setBookings(updatedBookings);
        setDeleteBooking(null);
    };
    
    // Calculate pagination
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentBookings = filteredBookings.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
    
    return (
        <div>
            <h2 className="text-xl font-semibold mb-6 text-gray-800">My Bookings</h2>
            
            {/* Filter form */}
            <BookingFilter 
                rooms={rooms} 
                onFilter={handleFilter} 
                selectedRoom={selectedRoom}
                selectedDate={selectedDate}
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
                <DeleteBookingModal 
                    booking={deleteBooking} 
                    onDelete={() => handleDeleteBooking(deleteBooking.id)} 
                    onClose={() => setDeleteBooking(null)} 
                />
            )}
        </div>
    );
}