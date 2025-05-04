import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faCalendarDays, 
    faClipboardList, 
    faPlusCircle,
    faUsers,
    faDoorOpen,
    faHome,
    faSignOutAlt,
    faUser
} from '@fortawesome/free-solid-svg-icons';

export default function TopNav({ user, onLogout }) {
    const navigate = useNavigate();
    const location = useLocation();
    const [activeTab, setActiveTab] = useState(() => {
        // Determine initial active tab based on localStorage
        return localStorage.getItem('activeTab') || (user?.role === 'admin' ? 'home' : 'booking');
    });

    useEffect(() => {
        // Sync with any external changes to activeTab
        const storedTab = localStorage.getItem('activeTab');
        if (storedTab && storedTab !== activeTab) {
            setActiveTab(storedTab);
        }
    }, [location.pathname]);

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        localStorage.setItem('activeTab', tab);
        
        // Update localStorage and trigger a storage event for other components to detect
        const event = new Event('storage');
        window.dispatchEvent(event);
    };

    // Define navigation items based on user role
    const navItems = user.role === 'admin' ? [
        { id: 'home', label: 'Dashboard', icon: faHome },
        { id: 'bookings', label: 'Manage Bookings', icon: faClipboardList },
        { id: 'create-booking', label: 'Create Booking', icon: faPlusCircle },
        { id: 'calendar', label: 'Calendar', icon: faCalendarDays },
        { id: 'rooms', label: 'Manage Rooms', icon: faDoorOpen },
        { id: 'users', label: 'Manage Users', icon: faUsers }
    ] : [
        { id: 'booking', label: 'Book', icon: faPlusCircle },
        { id: 'calendar', label: 'Calendar', icon: faCalendarDays },
        { id: 'mybookings', label: 'My Bookings', icon: faClipboardList }
    ];

    return (
        <div className="bg-white shadow-sm sticky top-0 z-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between">
                    {/* Navigation items on the left */}
                    <nav className="flex items-center space-x-4 py-3">
                        {navItems.map(item => (
                            <button
                                key={item.id}
                                onClick={() => handleTabChange(item.id)}
                                className={`p-3 rounded-md group relative ${
                                    activeTab === item.id 
                                        ? 'text-blue-600 bg-blue-50' 
                                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                } transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
                                aria-label={item.label}
                                title={item.label}
                            >
                                <FontAwesomeIcon icon={item.icon} size="lg" />
                                
                                {/* Enhanced tooltip */}
                                <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 text-sm font-medium text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity shadow-lg whitespace-nowrap">
                                    {item.label}
                                </span>
                            </button>
                        ))}
                    </nav>
                    
                    {/* User info and logout on the right */}
                    <div className="flex items-center space-x-4 py-3">
                        {/* User info */}
                        <div className="flex items-center text-gray-700">
                            <FontAwesomeIcon icon={faUser} className="mr-2 text-gray-500" />
                            <span className="text-sm font-medium">{user.name}</span>
                        </div>
                        
                        {/* Logout button */}
                        <button
                            onClick={onLogout}
                            className="p-3 rounded-md group relative text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                            aria-label="Logout"
                            title="Logout"
                        >
                            <FontAwesomeIcon icon={faSignOutAlt} size="lg" />
                            
                            {/* Tooltip */}
                            <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 text-xs font-medium text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity shadow-lg whitespace-nowrap">
                                Logout
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}