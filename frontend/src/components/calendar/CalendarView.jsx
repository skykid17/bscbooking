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
        // Format the calendar date as YYYY-MM-DD for comparison
        const calendarYear = date.getFullYear();
        const calendarMonth = String(date.getMonth() + 1).padStart(2, '0');
        const calendarDay = String(date.getDate()).padStart(2, '0');
        const calendarDateStr = `${calendarYear}-${calendarMonth}-${calendarDay}`;
        
        return filteredBookings.filter(booking => {
            try {
                // Format booking start date
                const startDate = new Date(booking.startDateTime);
                const startYear = startDate.getFullYear();
                const startMonth = String(startDate.getMonth() + 1).padStart(2, '0');
                const startDay = String(startDate.getDate()).padStart(2, '0');
                const startDateStr = `${startYear}-${startMonth}-${startDay}`;
                
                // Format booking end date
                const endDate = new Date(booking.endDateTime);
                const endYear = endDate.getFullYear();
                const endMonth = String(endDate.getMonth() + 1).padStart(2, '0');
                const endDay = String(endDate.getDate()).padStart(2, '0');
                const endDateStr = `${endYear}-${endMonth}-${endDay}`;
                
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
                                } transition-colors`}
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
                                            className="text-xs mb-1 p-1 bg-blue-100 text-blue-800 rounded cursor-pointer hover:bg-blue-200"
                                            onClick={() => handleBookingClick(booking)}
                                        >
                                            {booking.eventName} (
                                                {new Date(booking.startDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}-
                                                {new Date(booking.endDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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