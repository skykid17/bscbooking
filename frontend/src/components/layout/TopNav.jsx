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
        return localStorage.getItem('activeTab') || (user?.role === 'admin' ? 'bookings' : 'create-booking');
    });

    useEffect(() => {
        const storedTab = localStorage.getItem('activeTab');
        if (storedTab && storedTab !== activeTab) {
            setActiveTab(storedTab);
        }
    }, [location.pathname]);

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        localStorage.setItem('activeTab', tab);
        
        const event = new Event('storage');
        window.dispatchEvent(event);
    };

    const navItems = user.role === 'admin' ? [
        { id: 'home', label: 'Dashboard', icon: faHome },
        { id: 'bookings', label: 'Manage Bookings', icon: faClipboardList },
        { id: 'create-booking', label: 'Create Booking', icon: faPlusCircle },
        { id: 'calendar', label: 'Calendar', icon: faCalendarDays },
        { id: 'rooms', label: 'Manage Rooms', icon: faDoorOpen },
        { id: 'users', label: 'Manage Users', icon: faUsers }
    ] : [
        { id: 'home', label: 'Dashboard', icon: faHome },
        { id: 'create-booking', label: 'Book', icon: faPlusCircle },
        { id: 'calendar', label: 'Calendar', icon: faCalendarDays },
        { id: 'mybookings', label: 'My Bookings', icon: faClipboardList }
    ];

    return (
        <div className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-10 backdrop-blur-sm bg-white/95">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between">
                    {/* Navigation items on the left */}
                    <nav className="flex items-center space-x-2 py-2">
                        {navItems.map(item => (
                            <button
                                key={item.id}
                                onClick={() => handleTabChange(item.id)}
                                className={`p-2.5 rounded-lg group relative ${
                                    activeTab === item.id 
                                        ? 'text-blue-600 bg-blue-50' 
                                        : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                                } transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-30`}
                                aria-label={item.label}
                                title={item.label}
                            >
                                <FontAwesomeIcon icon={item.icon} size="lg" className={`transform transition-transform ${activeTab === item.id ? 'scale-110' : ''}`} />
                                
                                {/* Enhanced tooltip */}
                                <span className="absolute top-full left-1/2 transform -translate-x-1/2 mb-1.5 px-2.5 py-1 text-xs font-medium text-white bg-gray-800 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg whitespace-nowrap pointer-events-none">
                                    {item.label}
                                </span>
                            </button>
                        ))}
                    </nav>
                    
                    {/* User info and logout on the right */}
                    <div className="flex items-center space-x-3 py-2">
                        {/* User info */}
                        <div className="flex items-center text-gray-600 px-2 py-1 rounded-full bg-gray-50 border border-gray-100">
                            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-600 mr-2">
                                <FontAwesomeIcon icon={faUser} className="text-sm" />
                            </div>
                            <span className="text-sm font-medium mr-1">{user.name}</span>
                        </div>
                        
                        {/* Logout button */}
                        <button
                            onClick={onLogout}
                            className="p-2.5 rounded-lg group relative text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-30"
                            aria-label="Logout"
                            title="Logout"
                        >
                            <FontAwesomeIcon icon={faSignOutAlt} size="lg" />
                            
                            {/* Tooltip */}
                            <span className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2.5 py-1 text-xs font-medium text-white bg-gray-800 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg whitespace-nowrap pointer-events-none">
                                Logout
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}