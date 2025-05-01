import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRotateRight } from '@fortawesome/free-solid-svg-icons';

// Define the component function first
function BookingFilter({ rooms, onFilter, selectedRoom, selectedDate, onRefresh }) {
    const [room, setRoom] = useState(selectedRoom || '');
    const [date, setDate] = useState(selectedDate || '');
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        onFilter(room, date);
    };
    
    const handleReset = () => {
        setRoom('');
        setDate('');
        onFilter('', '');
    };
    
    const handleRefresh = async () => {
        if (typeof onRefresh !== 'function') {
            console.error('onRefresh prop is not a function');
            return;
        }
        
        setIsRefreshing(true);
        
        try {
            // Call the refresh function from the parent
            await onRefresh();
            
            // Reapply current filters after refresh
            if (room || date) {
                onFilter(room, date);
            }
        } catch (error) {
            console.error('Error refreshing data:', error);
        } finally {
            setTimeout(() => {
                setIsRefreshing(false);
            }, 500); // Short delay for better UX
        }
    };

    return (
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="font-medium text-gray-700 mb-3">Filter Bookings</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Room</label>
                    <select
                        className="w-full p-2 border border-gray-300 rounded-md"
                        value={room}
                        onChange={(e) => setRoom(e.target.value)}
                    >
                        <option value="">All Rooms</option>
                        {rooms.map(roomOption => (
                            <option key={roomOption} value={roomOption}>{roomOption}</option>
                        ))}
                    </select>
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <input
                        type="date"
                        className="w-full p-2 border border-gray-300 rounded-md"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                    />
                </div>
                
                <div className="flex items-end space-x-2">
                    <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Apply Filters
                    </button>
                    <button
                        type="button"
                        onClick={handleReset}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-100"
                    >
                        Reset
                    </button>
                    <button 
                        type="button"
                        onClick={handleRefresh} 
                        className={`refresh-btn p-2 rounded bg-gray-200 hover:bg-gray-300 focus:outline-none ${isRefreshing ? 'animate-spin' : ''}`}
                        disabled={isRefreshing}
                    >
                        <FontAwesomeIcon icon={faRotateRight} />
                    </button>
                </div>
            </form>
        </div>
    );
}

export default BookingFilter;