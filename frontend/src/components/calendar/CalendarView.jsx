import { useState, useEffect } from 'react';
import BookingModal from './BookingModal';

export default function CalendarView({ room, bookings = [] }) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [calendarDays, setCalendarDays] = useState([]);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [showModal, setShowModal] = useState(false);
    
    // Filter bookings for current room and approved status
        const filteredBookings = bookings.filter(booking => {
        // Debug logging
        console.log("Comparing booking:", {
            bookingRoom: booking.room,
            bookingRoomName: booking.roomName,
            requestedRoom: room,
            status: booking.status
        });
        
        // Check both room and roomName to be more flexible
        const roomMatches = booking.room === room || booking.roomName === room;
        const isApproved = booking.status === 'approved';
        
        return roomMatches && isApproved;
    });
    
    // Log filtered bookings for debugging
    useEffect(() => {
        console.log("All bookings:", bookings);
        console.log("Filtered bookings for room:", room, filteredBookings);
    }, [bookings, room, filteredBookings]);
    
    // Log filtered bookings for debugging
    useEffect(() => {
        console.log("All bookings:", bookings);
        console.log("Filtered bookings for room:", room, filteredBookings);
    }, [bookings, room, filteredBookings]);
    
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
    
    // Format date as YYYY-MM-DD for comparison
    const formatDateForCompare = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };
    
    // Get bookings for a specific day
    const getBookingsForDay = (date) => {
        const calendarDateStr = formatDateForCompare(date);
        
        return filteredBookings.filter(booking => {
            try {
                // Parse booking dates, handling SQL date-time strings and ISO strings
                let startDateTime, endDateTime;
                
                if (typeof booking.startDateTime === 'string') {
                    // Handle SQL date-time format (YYYY-MM-DD HH:MM:SS) or ISO format
                    startDateTime = new Date(booking.startDateTime.replace(' ', 'T'));
                } else {
                    startDateTime = new Date(booking.startDateTime);
                }
                
                if (typeof booking.endDateTime === 'string') {
                    endDateTime = new Date(booking.endDateTime.replace(' ', 'T'));
                } else {
                    endDateTime = new Date(booking.endDateTime);
                }
                
                // Format as YYYY-MM-DD for comparison
                const startDateStr = formatDateForCompare(startDateTime);
                const endDateStr = formatDateForCompare(endDateTime);
                
                // Debug comparisons
                console.log(`Comparing dates for booking ${booking.id}:`, {
                    calendarDate: calendarDateStr,
                    startDate: startDateStr,
                    endDate: endDateStr,
                    isWithinRange: calendarDateStr >= startDateStr && calendarDateStr <= endDateStr
                });
                
                // Check if calendar date is within the booking date range
                return (
                    calendarDateStr >= startDateStr && 
                    calendarDateStr <= endDateStr
                );
            } catch (error) {
                console.error("Error parsing date:", error, booking);
                return false;
            }
        });
    };
    
    // Check if booking starts on this day
    const doesBookingStartOnDay = (booking, date) => {
        const calendarDateStr = formatDateForCompare(date);
        const startDateTime = new Date(booking.startDateTime);
        const startDateStr = formatDateForCompare(startDateTime);
        
        return calendarDateStr === startDateStr;
    };
    
    // Check if booking is continuing from previous day
    const isBookingContinuing = (booking, date) => {
        const calendarDateStr = formatDateForCompare(date);
        const startDateTime = new Date(booking.startDateTime);
        const startDateStr = formatDateForCompare(startDateTime);
        
        return calendarDateStr !== startDateStr;
    };
    
    // Format time for display (12-hour format with AM/PM)
    const formatTimeDisplay = (dateTimeString) => {
        const date = new Date(dateTimeString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
                <h2 className="text-2xl font-light text-gray-800 tracking-wide">
                    {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </h2>
                <div className="flex space-x-3">
                    <button 
                        className="px-4 py-2 text-gray-600 rounded-md hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-200"
                        onClick={handlePrevMonth}
                    >
                        &larr;
                    </button>
                    <button 
                        className="px-4 py-2 text-gray-600 rounded-md hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-200"
                        onClick={handleNextMonth}
                    >
                        &rarr;
                    </button>
                </div>
            </div>
            
            <div className="rounded-lg shadow-sm overflow-hidden bg-white">
                {/* Calendar Header */}
                <div className="grid grid-cols-7 bg-gray-50">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="text-center py-3 font-medium text-xs text-gray-500 uppercase tracking-wider">
                            {day}
                        </div>
                    ))}
                </div>
                
                {/* Calendar Grid */}
                <div className="grid grid-cols-7 grid-rows-6 border-t border-gray-100">
                    {calendarDays.map((day, index) => {
                        const dayBookings = getBookingsForDay(day.date);
                        const isToday = day.isCurrentMonth && 
                            new Date().toDateString() === day.date.toDateString();
                        
                        return (
                            <div 
                                key={index} 
                                className={`p-2 ${index % 7 !== 6 ? 'border-r' : ''} ${
                                    Math.floor(index / 7) !== 5 ? 'border-b' : ''
                                } border-gray-100 h-28 ${
                                    day.isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                                } transition-colors relative`}
                            >
                                <div className={`text-right mb-1 ${
                                    isToday ? 'relative' : ''
                                }`}>
                                    <span className={`text-xs font-medium ${
                                        isToday 
                                        ? 'bg-blue-500 text-white w-6 h-6 rounded-full inline-flex items-center justify-center'
                                        : day.isCurrentMonth ? 'text-gray-700' : 'text-gray-400'
                                    }`}>
                                        {day.dayOfMonth}
                                    </span>
                                </div>
                                <div className="overflow-y-auto max-h-16">
                                    {dayBookings.map(booking => (
                                        <div 
                                            key={booking.id}
                                            className={`text-xs mb-1 p-1 rounded cursor-pointer 
                                              ${doesBookingStartOnDay(booking, day.date) 
                                                ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' 
                                                : 'bg-blue-50 text-blue-600 hover:bg-blue-100 border-l-4 border-blue-300'}`}
                                            onClick={() => handleBookingClick(booking)}
                                        >
                                            <div className="font-medium truncate flex justify-between text-xs text-blue-700 flex-wrap">
                                                {booking.eventName}
                                                {doesBookingStartOnDay(booking, day.date) ? (
                                                    <span>
                                                        {formatTimeDisplay(booking.startDateTime)}-
                                                        {formatTimeDisplay(booking.endDateTime)}
                                                    </span>
                                                ) : (
                                                    <span className="italic">continued</span>
                                                )}
                                            </div>
                                            <div className="">
                                                {booking.ministryName && (
                                                    <span className="italic truncate">{booking.ministryName}</span>
                                                )}
                                            </div>
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