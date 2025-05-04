export default function Header() {
    return (
        <header className="bg-gray-800 text-white border-b border-gray-100">
            <div className="max-w-7xl sm:px-6 lg:px-8 py-3 flex items-center">
                <h1 className="text-lg font-medium flex items-center">
                    <img 
                        src="../../BSC_logo_(2025_v1).png" 
                        alt="BSC" 
                        className="h-6 mr-3"
                    /> 
                    <span className="tracking-tight">BSC Booking</span>
                </h1>
            </div>
        </header>
    );
}