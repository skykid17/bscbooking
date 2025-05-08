import { useState, useEffect } from 'react';
import axios from 'axios';

const VITE_API_URL = import.meta.env.VITE_API_URL;

export default function RoomManagement({ rooms, setRooms }) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    // Form states
    const [name, setName] = useState('');
    const [floor, setFloor] = useState(2);
    const [capacity, setCapacity] = useState(10);
    
    // Edit states
    const [editingRoom, setEditingRoom] = useState(null);
    const [editName, setEditName] = useState('');
    const [editFloor, setEditFloor] = useState(2);
    const [editCapacity, setEditCapacity] = useState(10);
    
    // Room data with details (not just names)
    const [roomsData, setRoomsData] = useState([]);

    // Fetch all rooms with details
    useEffect(() => {
        const fetchRooms = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('token');
                
                const response = await axios.get(
                    `${VITE_API_URL}/rooms`,
                    {
                        headers: { 
                            'Authorization': `Bearer ${token}`
                        }
                    }
                );
                
                setRoomsData(response.data);
                setRooms(response.data.map(room => ({
                    id: room.id,
                    name: room.name
                })));
            } catch (error) {
                console.error('Error fetching rooms:', error);
                setError('Failed to load rooms');
            } finally {
                setLoading(false);
            }
        };
        
        fetchRooms();
    }, [setRooms]);
    
    // Create new room
    const handleCreateRoom = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        
        if (!name) {
            setError('Room name is required');
            return;
        }
        
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            
            // Use the correct API endpoint for room creation (should be /rooms, not /api/rooms)
            const response = await axios.post(
                `${VITE_API_URL}/rooms`,
                { 
                    name: name, 
                    floor: parseInt(floor), 
                    pax: parseInt(capacity) 
                },
                {
                    headers: { 
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
            
            // Add new room to state
            const newRoom = response.data.room;
            setRoomsData([...roomsData, newRoom]);
            setRooms([...rooms, {
                id: newRoom.id,
                name: newRoom.name
            }]);
            setSuccess('Room created successfully');
            
            // Reset form
            setName('');
            setFloor(2);
            setCapacity(10);
        } catch (error) {
            console.error('Error creating room:', error);
            setError(error.response?.data?.message || 'Failed to create room');
        } finally {
            setLoading(false);
        }
    };
    
    // Handle editing a room
    const handleEditClick = (room) => {
        setEditingRoom(room);
        setEditName(room.name);
        setEditFloor(room.floor);
        setEditCapacity(room.pax);
    };
    
    // Update a room
    const handleUpdateRoom = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        
        if (!editName) {
            setError('Room name is required');
            return;
        }
        
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            
            await axios.put(
                `${VITE_API_URL}/api/rooms/${editingRoom.id}`,
                { 
                    name: editName, 
                    floor: parseInt(editFloor), 
                    pax: parseInt(editCapacity) 
                },
                {
                    headers: { 
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
            
            // Update room in state
            const updatedRoomsData = roomsData.map(room => 
                room.id === editingRoom.id ? {
                    ...room,
                    name: editName,
                    floor: parseInt(editFloor),
                    pax: parseInt(editCapacity)
                } : room
            );
            
            setRoomsData(updatedRoomsData);
            setRooms(updatedRoomsData.map(room));
            setSuccess('Room updated successfully');
            setEditingRoom(null);
        } catch (error) {
            console.error('Error updating room:', error);
            setError(error.response?.data?.message || 'Failed to update room');
        } finally {
            setLoading(false);
        }
    };
    
    // Delete a room
    const handleDeleteRoom = async (roomId) => {
        if (!confirm('Are you sure you want to delete this room? All bookings for this room will also be deleted.')) {
            return;
        }
        
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            
            await axios.delete(
                `${VITE_API_URL}/api/rooms/${roomId}`,
                {
                    headers: { 
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
            
            // Remove room from state
            const updatedRoomsData = roomsData.filter(room => room.id !== roomId);
            setRoomsData(updatedRoomsData);
            setRooms(updatedRoomsData.map(room));
            setSuccess('Room deleted successfully');
        } catch (error) {
            console.error('Error deleting room:', error);
            setError(error.response?.data?.message || 'Failed to delete room');
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div>
            <h3 className="text-xl font-semibold mb-6 text-gray-800">Room Management</h3>
            
            {/* Error and success messages */}
            {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded border border-red-200">
                    {error}
                </div>
            )}
            
            {success && (
                <div className="mb-4 p-3 bg-green-50 text-green-600 text-sm rounded border border-green-200">
                    {success}
                </div>
            )}
            
            {/* Create room form */}
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h4 className="font-medium text-gray-700 mb-3">Add New Room</h4>
                <form onSubmit={handleCreateRoom} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Room Name *</label>
                        <input
                            type="text"
                            className="w-full p-2 border border-gray-300 rounded-md"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Conference Room C"
                            required
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Floor</label>
                        <input
                            type="number"
                            className="w-full p-2 border border-gray-300 rounded-md"
                            value={floor}
                            onChange={(e) => setFloor(e.target.value)}
                            min="1"
                            max="100"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Capacity (pax)</label>
                        <input
                            type="number"
                            className="w-full p-2 border border-gray-300 rounded-md"
                            value={capacity}
                            onChange={(e) => setCapacity(e.target.value)}
                            min="1"
                            max="1000"
                        />
                    </div>
                    
                    <div className="md:col-span-3">
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
                        >
                            {loading ? 'Creating...' : 'Create Room'}
                        </button>
                    </div>
                </form>
            </div>
            
            {/* Room list */}
            <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Floor</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capacity</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {loading && !roomsData.length ? (
                            <tr>
                                <td colSpan="4" className="px-4 py-3 text-center text-sm text-gray-500">
                                    Loading rooms...
                                </td>
                            </tr>
                        ) : roomsData.length === 0 ? (
                            <tr>
                                <td colSpan="4" className="px-4 py-3 text-center text-sm text-gray-500">
                                    No rooms found
                                </td>
                            </tr>
                        ) : (
                            roomsData.map((room) => (
                                <tr key={room.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm text-gray-800">{room.name}</td>
                                    <td className="px-4 py-3 text-sm text-gray-800">{room.floor}</td>
                                    <td className="px-4 py-3 text-sm text-gray-800">{room.pax}</td>
                                    <td className="px-4 py-3 text-sm">
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => handleEditClick(room)}
                                                className="bg-blue-100 text-blue-700 hover:bg-blue-200 text-xs px-2 py-1 rounded"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDeleteRoom(room.id)}
                                                className="bg-red-100 text-red-700 hover:bg-red-200 text-xs px-2 py-1 rounded"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            
            {/* Edit room modal */}
            {editingRoom && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold">Edit Room</h3>
                            <button 
                                onClick={() => setEditingRoom(null)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                &times;
                            </button>
                        </div>
                        
                        <form onSubmit={handleUpdateRoom} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Room Name *</label>
                                <input
                                    type="text"
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    required
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Floor</label>
                                <input
                                    type="number"
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                    value={editFloor}
                                    onChange={(e) => setEditFloor(e.target.value)}
                                    min="1"
                                    max="100"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Capacity (pax)</label>
                                <input
                                    type="number"
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                    value={editCapacity}
                                    onChange={(e) => setEditCapacity(e.target.value)}
                                    min="1"
                                    max="1000"
                                />
                            </div>
                            
                            <div className="flex justify-end space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setEditingRoom(null)}
                                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-100"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
                                >
                                    {loading ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}