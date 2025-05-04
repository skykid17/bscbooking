import Header from './Header';
import Footer from './Footer';
import TopNav from './TopNav';

export default function Layout({ children, user, onLogout }) {
    return (
        <div className="min-h-screen flex flex-col bg-background font-sans text-primary">
            <Header user={user} />
            {user && <TopNav user={user} onLogout={onLogout} />}
            <main className="flex-grow w-full">
                {children}
            </main>
            <Footer />
        </div>       
    ); 
}