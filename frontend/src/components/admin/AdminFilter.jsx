import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRotateRight } from '@fortawesome/free-solid-svg-icons';

export default function AdminFilter({ users, rooms, onFilter, onRefresh }) {
    const [userId, setUserId] = useState('');
    const [room, setRoom] = useState('');
    const [date, setDate] = useState('');
    const [status, setStatus] = useState('');
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        onFilter(userId, room, date, status);
    };
    
    const handleReset = () => {
        setUserId('');
        setRoom('');
        setDate('');
        setStatus('');
        onFilter('', '', '', '');
    };

    const handleRefresh = async () => {
        if (!onRefresh || typeof onRefresh !== 'function') {
            console.error('onRefresh prop is not a function');
            return;
        }
        
        // Set refreshing state to show spinner
        setIsRefreshing(true);
        
        try {
            // Call the refresh function from props
            await onRefresh();
            
            // Also apply current filters to the refreshed data
            if (userId || room || date || status) {
                onFilter(userId, room, date, status);
            }
        } catch (error) {
            console.error('Error refreshing data:', error);
        } finally {
            // Add a small delay for better UX
            setTimeout(() => {
                setIsRefreshing(false);
            }, 500);
        }
    };

    return (
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="font-medium text-gray-700 mb-3">Filter Bookings</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">User</label>
                    <select
                        className="w-full p-2 border border-gray-300 rounded-md"
                        value={userId}
                        onChange={(e) => setUserId(e.target.value)}
                    >
                        <option value="">All Users</option>
                        {users && users.map(user => (
                            <option key={user.id} value={user.id}>{user.name} ({user.username})</option>
                        ))}
                    </select>
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Room</label>
                    <select
                        className="w-full p-2 border border-gray-300 rounded-md"
                        value={room}
                        onChange={(e) => setRoom(e.target.value)}
                    >
                        <option value="">All Rooms</option>
                        {rooms.map(room => (
                            <option key={room.id} value={room.name}>{room.name}</option>
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
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                        className="w-full p-2 border border-gray-300 rounded-md"
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                    >
                        <option value="">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                    </select>
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