import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../utils/apiConfig';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faCircleCheck,
    faCircleXmark,
    faXmark
} from '@fortawesome/free-solid-svg-icons';

export default function UserManagement({ users = [], setUsers }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [editingUser, setEditingUser] = useState(null);
    
    // New user form state
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [role, setRole] = useState('user');
    const [selectedMinistries, setSelectedMinistries] = useState([]);
    
    // Edit form state
    const [editName, setEditName] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [editPassword, setEditPassword] = useState('');
    const [editConfirmPassword, setEditConfirmPassword] = useState('');
    const [editRole, setEditRole] = useState('');
    const [editMinistries, setEditMinistries] = useState([]);
    
    // Ministries state
    const [ministries, setMinistries] = useState([]);
    const [userMinistries, setUserMinistries] = useState({});

    // Email validation function
    const validateEmail = (email) => {
        const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(String(email).toLowerCase());
    };

    // Fetch all ministries
    useEffect(() => {
        const fetchMinistries = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(
                    `${API_BASE_URL}/ministries`,
                    {
                        headers: { 
                            'Authorization': `Bearer ${token}`
                        }
                    }
                );
                setMinistries(response.data);
            } catch (error) {
                console.error('Error fetching ministries:', error);
                setError('Failed to load ministries. Some features may be limited.');
            }
        };
        
        fetchMinistries();
    }, []);

    // Fetch user ministries for all users
    useEffect(() => {
        if (users.length === 0) return;
        
        const fetchUserMinistries = async () => {
            try {
                const token = localStorage.getItem('token');
                const userMinistryMap = {};
                
                // Fetch ministries for each user
                for (const user of users) {
                    const response = await axios.get(
                        `${API_BASE_URL}/users/${user.id}/ministries`,
                        {
                            headers: { 'Authorization': `Bearer ${token}` }
                        }
                    );
                    userMinistryMap[user.id] = response.data;
                }
                
                setUserMinistries(userMinistryMap);
            } catch (error) {
                console.error('Error fetching user ministries:', error);
            }
        };
        
        fetchUserMinistries();
    }, [users]);

    // Handle adding a ministry to selection
    const handleAddMinistry = (ministryId) => {
        if (selectedMinistries.length >= 3) {
            setError('Users can only belong to a maximum of 3 ministries.');
            return;
        }
        
        if (!selectedMinistries.includes(ministryId)) {
            setSelectedMinistries([...selectedMinistries, ministryId]);
        }
    };

    // Handle removing a ministry from selection
    const handleRemoveMinistry = (ministryId) => {
        setSelectedMinistries(selectedMinistries.filter(id => id !== ministryId));
    };

    // Handle adding a ministry to edit selection
    const handleAddEditMinistry = (ministryId) => {
        if (editMinistries.length >= 3) {
            setError('Users can only belong to a maximum of 3 ministries.');
            return;
        }
        
        if (!editMinistries.includes(ministryId)) {
            setEditMinistries([...editMinistries, ministryId]);
        }
    };

    // Handle removing a ministry from edit selection
    const handleRemoveEditMinistry = (ministryId) => {
        setEditMinistries(editMinistries.filter(id => id !== ministryId));
    };

    // Handle creating a new user
    const handleCreateUser = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        
        if (!email || !name || !password) {
            setError('All fields are required');
            return;
        }
        
        if (!validateEmail(email)) {
            setError('Please enter a valid email address');
            return;
        }
        
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            
            const response = await axios.post(
                `${API_BASE_URL}/users`,
                { 
                    name, 
                    email, 
                    password, 
                    role,
                    ministry_ids: selectedMinistries
                },
                {
                    headers: { 
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
            
            // Add the new user to the list
            const newUser = response.data.user;
            setUsers([...users, newUser]);
            
            // Update user ministries
            setUserMinistries({
                ...userMinistries,
                [newUser.id]: selectedMinistries.map(id => {
                    const ministry = ministries.find(m => m.id === id);
                    return { id, name: ministry ? ministry.name : 'Unknown' };
                })
            });
            
            setSuccess('User created successfully. ' + 
                (role !== 'admin' ? 'A verification email has been sent to the user.' : ''));
            
            // Reset form
            setName('');
            setEmail('');
            setPassword('');
            setConfirmPassword('');
            setRole('user');
            setSelectedMinistries([]);
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
        setEditName(user.name);
        setEditEmail(user.email || '');
        setEditPassword('');
        setEditConfirmPassword('');
        setEditRole(user.role);
        
        // Set edit ministries from user's current ministries
        const userMins = userMinistries[user.id] || [];
        setEditMinistries(userMins.map(m => m.id));
    };
    
    // Handle updating a user
    const handleUpdateUser = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        
        if (!editName) {
            setError('Name is required');
            return;
        }
        
        if (editEmail && !validateEmail(editEmail)) {
            setError('Please enter a valid email address');
            return;
        }
        
        if (editPassword && editPassword !== editConfirmPassword) {
            setError('Passwords do not match');
            return;
        }
        
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            
            const userData = {
                name: editName,
                role: editRole,
                ministry_ids: editMinistries
            };
            
            // Only include email if it's provided
            if (editEmail) {
                userData.email = editEmail;
            }
            
            // Only include password if it was changed
            if (editPassword) {
                userData.password = editPassword;
            }
            
            const response = await axios.put(
                `${API_BASE_URL}/users/${editingUser.id}`,
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
                    name: editName,
                    email: editEmail,
                    role: editRole
                } : user
            );
            
            // Update user ministries
            setUserMinistries({
                ...userMinistries,
                [editingUser.id]: editMinistries.map(id => {
                    const ministry = ministries.find(m => m.id === id);
                    return { id, name: ministry ? ministry.name : 'Unknown' };
                })
            });
            
            setUsers(updatedUsers);
            setSuccess('User updated successfully' + 
                (editEmail && editEmail !== editingUser.email ? '. A new verification email has been sent.' : ''));
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
                `${API_BASE_URL}/users/${userId}`,
                {
                    headers: { 
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
            
            // Remove the user from the list
            const updatedUsers = users.filter(user => user.id !== userId);
            setUsers(updatedUsers);
            
            // Remove user from ministries map
            const updatedUserMinistries = { ...userMinistries };
            delete updatedUserMinistries[userId];
            setUserMinistries(updatedUserMinistries);
            
            setSuccess('User deleted successfully');
        } catch (error) {
            console.error('Error deleting user:', error);
            setError(error.response?.data?.message || 'Failed to delete user');
        } finally {
            setLoading(false);
        }
    };

    // Get ministry names for a user
    const getUserMinistryNames = (userId) => {
        const userMins = userMinistries[userId] || [];
        return userMins.map(m => m.name).join(', ') || 'None';
    };

    // Find ministry name by ID
    const getMinistryName = (ministryId) => {
        if (!ministryId) return 'None';
        const ministry = ministries.find(m => m.id === ministryId);
        return ministry ? ministry.name : 'Unknown';
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
            
            {/* Create user form */}
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h4 className="font-medium text-gray-700 mb-3">Create New User</h4>
                <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                        <input
                            type="email"
                            className="w-full p-2 border border-gray-300 rounded-md"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ministries (Up to 3)</label>
                        <select
                            className="w-full p-2 border border-gray-300 rounded-md"
                            value=""
                            onChange={(e) => {
                                if (e.target.value) {
                                    handleAddMinistry(e.target.value);
                                    e.target.value = "";
                                }
                            }}
                        >
                            <option value="">Select ministry</option>
                            {ministries
                                .filter(ministry => !selectedMinistries.includes(ministry.id))
                                .map(ministry => (
                                    <option key={ministry.id} value={ministry.id}>{ministry.name}</option>
                                ))
                            }
                        </select>
                        
                        {/* Display selected ministries with remove option */}
                        <div className="mt-2 flex flex-wrap gap-2">
                            {selectedMinistries.map(ministryId => (
                                <div 
                                    key={ministryId} 
                                    className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded flex items-center"
                                >
                                    {getMinistryName(ministryId)}
                                    <button 
                                        type="button"
                                        onClick={() => handleRemoveMinistry(ministryId)}
                                        className="ml-1 text-blue-600 hover:text-blue-800"
                                    >
                                        <FontAwesomeIcon icon={faXmark} />
                                    </button>
                                </div>
                            ))}
                        </div>
                        
                        {selectedMinistries.length === 3 && (
                            <p className="mt-1 text-xs text-amber-600">
                                Maximum of 3 ministries reached.
                            </p>
                        )}
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
                        <input
                            type="password"
                            className="w-full p-2 border border-gray-300 rounded-md"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
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
                    
                    <div className="md">
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
                        >
                            {loading ? 'Creating...' : 'Create User'}
                        </button>
                    </div>
                    {success && (
                        <div className="mb-4 p-3 bg-green-50 text-green-600 text-sm rounded border border-green-200 md:col-span-2">
                            {success}
                        </div>
                    )}
                </form>
            </div>
            
            {/* User list */}
            <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ministries</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Verified</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {users.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm text-gray-800">{user.email}</td>
                                <td className="px-4 py-3 text-sm text-gray-800">{user.name}</td>
                                <td className="px-4 py-3 text-sm text-gray-800">{getUserMinistryNames(user.id)}</td>
                                <td className="px-4 py-3 text-sm text-gray-800">
                                    <span className={`px-2 py-1 text-xs rounded-full font-medium
                                        ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}
                                    >
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-800">
                                <FontAwesomeIcon 
                                    icon={user.is_verified ? faCircleCheck : faCircleXmark} 
                                    className={user.is_verified ? 'text-green-500' : 'text-red-500'} 
                                />
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
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                    value={editEmail}
                                    onChange={(e) => setEditEmail(e.target.value)}
                                    placeholder="user@example.com"
                                    required
                                />
                                {editEmail && editEmail !== editingUser.email && (
                                    <p className="mt-1 text-xs text-amber-600">
                                        Changing email will require re-verification.
                                    </p>
                                )}
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
                                <label className="block text-sm font-medium text-gray-700 mb-1">Ministries (Up to 3)</label>
                                <select
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                    value=""
                                    onChange={(e) => {
                                        if (e.target.value) {
                                            handleAddEditMinistry(e.target.value);
                                            e.target.value = "";
                                        }
                                    }}
                                >
                                    <option value="">Select ministry</option>
                                    {ministries
                                        .filter(ministry => !editMinistries.includes(ministry.id))
                                        .map(ministry => (
                                            <option key={ministry.id} value={ministry.id}>{ministry.name}</option>
                                        ))
                                    }
                                </select>
                                
                                {/* Display selected ministries with remove option */}
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {editMinistries.map(ministryId => (
                                        <div 
                                            key={ministryId} 
                                            className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded flex items-center"
                                        >
                                            {getMinistryName(ministryId)}
                                            <button 
                                                type="button"
                                                onClick={() => handleRemoveEditMinistry(ministryId)}
                                                className="ml-1 text-blue-600 hover:text-blue-800"
                                            >
                                                <FontAwesomeIcon icon={faXmark} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                
                                {editMinistries.length === 3 && (
                                    <p className="mt-1 text-xs text-amber-600">
                                        Maximum of 3 ministries reached.
                                    </p>
                                )}
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
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Confirm Password
                                </label>
                                <input
                                    type="password"
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                    value={editConfirmPassword}
                                    onChange={(e) => setEditConfirmPassword(e.target.value)}
                                    placeholder="Confirm new password"
                                    disabled={!editPassword}
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