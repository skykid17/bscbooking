import { useState } from 'react';
import axios from 'axios';

export default function UserManagement({ users = [], setUsers }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [editingUser, setEditingUser] = useState(null);
    
    // New user form state
    const [username, setUsername] = useState('');
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('user');
    
    // Edit form state
    const [editUsername, setEditUsername] = useState('');
    const [editName, setEditName] = useState('');
    const [editPassword, setEditPassword] = useState('');
    const [editRole, setEditRole] = useState('');

    // Handle creating a new user
    const handleCreateUser = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        
        if (!username || !name || !password) {
            setError('All fields are required');
            return;
        }
        
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            
            const response = await axios.post(
                'http://localhost:5000/api/users',
                { username, name, password, role },
                {
                    headers: { 
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
            
            // Add the new user to the list
            setUsers([...users, response.data.user]);
            setSuccess('User created successfully');
            
            // Reset form
            setUsername('');
            setName('');
            setPassword('');
            setRole('user');
        } catch (error) {
            console.error('Error creating user:', error);
            setError(error.response?.data?.message || 'Failed to create user');
        } finally {
            setLoading(false);
        }
    };
    
    // Handle editing a user
    const handleEditClick = (user) => {
        setEditingUser(user);
        setEditUsername(user.username);
        setEditName(user.name);
        setEditPassword('');
        setEditRole(user.role);
    };
    
    // Handle updating a user
    const handleUpdateUser = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        
        if (!editUsername || !editName) {
            setError('Username and name are required');
            return;
        }
        
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            
            const userData = {
                username: editUsername,
                name: editName,
                role: editRole
            };
            
            // Only include password if it was changed
            if (editPassword) {
                userData.password = editPassword;
            }
            
            const response = await axios.put(
                `http://localhost:5000/api/users/${editingUser.id}`,
                userData,
                {
                    headers: { 
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
            
            // Update the user in the list
            const updatedUsers = users.map(user => 
                user.id === editingUser.id ? { 
                    ...user, 
                    username: editUsername,
                    name: editName,
                    role: editRole
                } : user
            );
            
            setUsers(updatedUsers);
            setSuccess('User updated successfully');
            setEditingUser(null);
        } catch (error) {
            console.error('Error updating user:', error);
            setError(error.response?.data?.message || 'Failed to update user');
        } finally {
            setLoading(false);
        }
    };
    
    // Handle deleting a user
    const handleDeleteUser = async (userId) => {
        if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            return;
        }
        
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            
            await axios.delete(
                `http://localhost:5000/api/users/${userId}`,
                {
                    headers: { 
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
            
            // Remove the user from the list
            const updatedUsers = users.filter(user => user.id !== userId);
            setUsers(updatedUsers);
            setSuccess('User deleted successfully');
        } catch (error) {
            console.error('Error deleting user:', error);
            setError(error.response?.data?.message || 'Failed to delete user');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h3 className="text-xl font-semibold mb-6 text-gray-800">User Management</h3>
            
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
            
            {/* Create user form */}
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h4 className="font-medium text-gray-700 mb-3">Create New User</h4>
                <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
                        <input
                            type="text"
                            className="w-full p-2 border border-gray-300 rounded-md"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                        <input
                            type="text"
                            className="w-full p-2 border border-gray-300 rounded-md"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                        <input
                            type="password"
                            className="w-full p-2 border border-gray-300 rounded-md"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                        <select
                            className="w-full p-2 border border-gray-300 rounded-md"
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                        >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                    
                    <div className="md:col-span-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
                        >
                            {loading ? 'Creating...' : 'Create User'}
                        </button>
                    </div>
                </form>
            </div>
            
            {/* User list */}
            <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {users.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm text-gray-800">{user.username}</td>
                                <td className="px-4 py-3 text-sm text-gray-800">{user.name}</td>
                                <td className="px-4 py-3 text-sm text-gray-800">
                                    <span className={`px-2 py-1 text-xs rounded-full font-medium
                                        ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}
                                    >
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-sm">
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => handleEditClick(user)}
                                            className="bg-blue-100 text-blue-700 hover:bg-blue-200 text-xs px-2 py-1 rounded"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDeleteUser(user.id)}
                                            className="bg-red-100 text-red-700 hover:bg-red-200 text-xs px-2 py-1 rounded"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                
                {users.length === 0 && (
                    <div className="text-center py-4 bg-gray-50 rounded-md">
                        <p className="text-gray-500">No users found</p>
                    </div>
                )}
            </div>
            
            {/* Edit user modal */}
            {editingUser && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold">Edit User</h3>
                            <button 
                                onClick={() => setEditingUser(null)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                &times;
                            </button>
                        </div>
                        
                        <form onSubmit={handleUpdateUser} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
                                <input
                                    type="text"
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                    value={editUsername}
                                    onChange={(e) => setEditUsername(e.target.value)}
                                    required
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                                <input
                                    type="text"
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    required
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Password (leave blank to keep current)
                                </label>
                                <input
                                    type="password"
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                    value={editPassword}
                                    onChange={(e) => setEditPassword(e.target.value)}
                                    placeholder="Enter new password"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                                <select
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                    value={editRole}
                                    onChange={(e) => setEditRole(e.target.value)}
                                >
                                    <option value="user">User</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            
                            <div className="flex justify-end space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setEditingUser(null)}
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