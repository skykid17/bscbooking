import Header from './Header';
import Footer from './Footer';

export default function Layout({ children, user, onLogout }) {
    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <Header user={user} onLogout={onLogout} />
            <main className="flex-grow container mx-auto px-4 py-8">
                {children}
            </main>
            <Footer />
        </div>
    );
}