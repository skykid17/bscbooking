import Header from './Header';
import Footer from './Footer';
import TopNav from './TopNav';

export default function Layout({ children, user, onLogout }) {
    return (
        <div className="min-h-screen flex flex-col bg-background font-sans text-primary">
            <Header />
            {user && <TopNav user={user} onLogout={onLogout} />}
            <main className="flex-grow w-full">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    {children || <div className="text-center text-gray-400">No content available</div>}
                </div>
            </main>
            <Footer />
        </div>
    ); 
}