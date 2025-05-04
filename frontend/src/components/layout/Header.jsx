export default function Header({ user }) {
    return (
        <header className="bg-gray-600 text-white shadow-md">
            <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                <div className="flex items-center space-x-6">
                    <h1 className="text-xl font-bold flex items-center space-x-2">
                        <img src="../../BSC_logo_(2025_v1).png" alt="BSC Booking System" style={{ height: '24px' }}/> BSC Booking System
                    </h1>
                </div>
            </div>
        </header>
    );
}