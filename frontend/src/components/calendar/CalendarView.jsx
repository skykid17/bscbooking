import { useState, useEffect } from 'react';
import BookingModal from './BookingModal';

export default function CalendarView({ room, bookings = [] }) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [calendarDays, setCalendarDays] = useState([]);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [showModal, setShowModal] = useState(false);
    
    // Filter bookings for current room and approved status
    const filteredBookings = bookings.filter(booking => 
        booking.room === room && booking.status === 'approved'
    );
    
    // Generate calendar days for the current month
    useEffect(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        
        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);
        const daysInMonth = lastDayOfMonth.getDate();
        
        // Get day of week of first day (0 = Sunday, 6 = Saturday)
        const firstDayOfWeek = firstDayOfMonth.getDay();
        
        const days = [];
        
        // Add previous month days to fill the first week
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        for (let i = 0; i < firstDayOfWeek; i++) {
            const day = prevMonthLastDay - firstDayOfWeek + i + 1;
            days.push({
                date: new Date(year, month - 1, day),
                dayOfMonth: day,
                isCurrentMonth: false
            });
        }
        
        // Add current month days
        for (let day = 1; day <= daysInMonth; day++) {
            days.push({
                date: new Date(year, month, day),
                dayOfMonth: day,
                isCurrentMonth: true
            });
        }
        
        // Add next month days to complete the grid
        const remainingDays = 42 - days.length; // 6 rows of 7 days
        for (let day = 1; day <= remainingDays; day++) {
            days.push({
                date: new Date(year, month + 1, day),
                dayOfMonth: day,
                isCurrentMonth: false
            });
        }
        
        setCalendarDays(days);
    }, [currentDate]);
    
    // Get bookings for a specific day
    const getBookingsForDay = (date) => {
        // Convert the calendar day to a date string (YYYY-MM-DD) for comparison
        const calendarDateStr = date.toISOString().split('T')[0];
        
        return filteredBookings.filter(booking => {
            // Extract just the date parts (YYYY-MM-DD) from the ISO strings
            const startDateStr = new Date(booking.start).toISOString().split('T')[0];
            const endDateStr = new Date(booking.end).toISOString().split('T')[0];
            
            // Check if the calendar date is between or equal to the start/end dates
            return (
                calendarDateStr >= startDateStr && 
                calendarDateStr <= endDateStr
            );
        });
    };
    
    const handlePrevMonth = () => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    };
    
    const handleNextMonth = () => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    };
    
    const handleBookingClick = (booking) => {
        setSelectedBooking(booking);
        setShowModal(true);
    };
    
    const closeModal = () => {
        setShowModal(false);
        setSelectedBooking(null);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">
                    {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </h2>
                <div className="flex space-x-2">
                    <button 
                        className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
                        onClick={handlePrevMonth}
                    >
                        &larr; Prev
                    </button>
                    <button 
                        className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
                        onClick={handleNextMonth}
                    >
                        Next &rarr;
                    </button>
                </div>
            </div>
            
            <div className="border rounded-lg shadow overflow-hidden">
                {/* Calendar Header */}
                <div className="grid grid-cols-7 bg-gray-100 border-b">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="text-center py-2 font-medium text-sm text-gray-600">
                            {day}
                        </div>
                    ))}
                </div>
                
                {/* Calendar Grid */}
                <div className="grid grid-cols-7 grid-rows-6">
                    {calendarDays.map((day, index) => {
                        const dayBookings = getBookingsForDay(day.date);
                        
                        return (
                            <div 
                                key={index} 
                                className={`p-1 border-b border-r h-24 ${day.isCurrentMonth ? 'bg-white' : 'bg-gray-50 text-gray-400'}`}
                            >
                                <div className="text-right text-sm mb-1">
                                    {day.dayOfMonth}
                                </div>
                                <div className="overflow-y-auto max-h-16">
                                    {dayBookings.map(booking => (
                                        <div 
                                            key={booking.id}
                                            className="text-xs mb-1 p-1 bg-blue-100 text-blue-800 rounded cursor-pointer hover:bg-blue-200"
                                            onClick={() => handleBookingClick(booking)}
                                        >
                                            {booking.eventName} (
                                                {new Date(booking.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}-
                                                {new Date(booking.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            )
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
            
            {showModal && selectedBooking && (
                <BookingModal booking={selectedBooking} onClose={closeModal} />
            )}
        </div>
    );
}