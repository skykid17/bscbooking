export default function Footer() {
    return (
        <footer className="bg-gray-100 text-gray-600 py-4 text-center border-t">
            <div className="container mx-auto px-4">
                <p className="text-sm">© {new Date().getFullYear()} BSC Booking System</p>
            </div>
        </footer>
    );
}