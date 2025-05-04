export default function Footer() {
    return (
        <footer className="bg-gray-800 text-white py-4 text-center">
            <div className="container mx-auto px-4">
                <p className="text-sm">© {new Date().getFullYear()} BSC Booking System</p>
            </div>
        </footer>
    );
}