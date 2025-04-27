export default function Header({ user, onLogout }) {
    return (
        <header className="bg-gray-600 text-white shadow-md">
            <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                <div className="flex items-center space-x-6">
                    <h1 className="text-xl font-bold">BSC Booking System</h1>
                </div>
                {user && (
                    <div className="flex items-center space-x-4">
                        <nav className="text-sm text-gray-200">
                            <a href="/dashboard" className="hover:text-gray-300">Dashboard</a>
                            <a href="/bookings" className="hover:text-gray-300">Bookings</a>
                        </nav>
                        <button 
                            onClick={onLogout}
                            className="bg-blue-700 hover:bg-blue-800 px-3 py-1 rounded text-sm"
                        >
                            Logout
                        </button>
                    </div>
                )}
            </div>
        </header>
    );
}