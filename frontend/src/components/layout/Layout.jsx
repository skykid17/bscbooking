import Header from './Header';
import Footer from './Footer';

export default function Layout({ children, user, onLogout }) {
    return (
        <div className="min-h-screen flex flex-col bg-background font-sans text-primary">
            <Header user={user} onLogout={onLogout} />
            <main className="flex-grow w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                <div className="max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
            <Footer />
        </div>
    );
}