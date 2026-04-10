import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
    LayoutDashboard, 
    Truck, 
    User as UserIcon, 
    LogOut, 
    Clock, 
    Menu as MenuIcon, 
    X 
} from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import { useRider } from '../context/RiderContext';
import { useAuth } from '../context/AuthContext';
import { BrandLogo, typographyClasses } from './BrandingUtils';

const RiderLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const location = useLocation();
    const { stats } = useRider();
    const { user, logout } = useAuth();

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const navItems = [
        { path: '/', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/orders', label: 'Deliveries', icon: Truck },
        { path: '/profile', label: 'Station', icon: UserIcon },
    ];

    return (
        <div className="flex min-h-screen bg-charcoal text-soft-white font-sans selection:bg-gold selection:text-charcoal relative">
            <Toaster position="top-center" />
            
            {/* Sidebar Overlay */}
            {isSidebarOpen && (
                <div 
                    className="lg:hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-50 transition-opacity"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Premium Sidebar Navigation */}
            <aside className={`
                fixed top-0 left-0 h-full w-72 bg-charcoal border-r border-white/5 z-50 transition-transform duration-500 ease-in-out lg:translate-x-0
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="flex flex-col h-full p-8">
                    {/* Synchronized Logo - Matching Reference Image */}
                    <div className="mb-12">
                        <BrandLogo size="md" />
                        <span className={`${typographyClasses.labelSmall} block mt-2`}>Rider Logistics Terminal</span>
                    </div>

                    <nav className="flex-1 space-y-2">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setIsSidebarOpen(false)}
                                    className={`
                                        flex items-center gap-4 px-6 py-4 rounded-md transition-all group
                                        ${isActive ? 'glass-gold text-gold shadow-[0_0_20px_rgba(212,175,55,0.1)]' : 'text-soft-white/40 hover:bg-white/5 hover:text-white'}
                                    `}
                                >
                                    <Icon className={`w-5 h-5 ${isActive ? 'text-gold' : 'text-gold/40 group-hover:scale-110 group-hover:text-gold transition-transform'}`} />
                                    <span className="text-lg font-bold uppercase tracking-widest">{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Stats Card - Aligned with Card Premium */}
                    <div className="mt-auto p-6 glass rounded-2xl border border-white/5 text-center">
                        <p className="text-[10px] text-soft-white/20 font-bold uppercase tracking-widest mb-2">My Stats Today</p>
                        <p className="text-3xl font-serif font-black text-gold italic leading-none">{stats?.completedToday || 0}</p>
                        <p className="text-[10px] font-bold text-soft-white/40 uppercase tracking-widest mt-1">Completed Missions</p>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 lg:ml-72 flex flex-col min-h-screen">
                {/* Standardized Header */}
                <header className="flex items-center justify-between px-8 py-6 sticky top-0 bg-charcoal/80 backdrop-blur-xl border-b border-white/5 z-40">
                    <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 text-gold">
                        <MenuIcon className="w-6 h-6" />
                    </button>

                    <div className="flex items-center gap-6 ml-auto">
                        {/* Profile Summary */}
                        <div className="flex items-center gap-4 pl-6 border-l border-white/5">
                            <div className="text-right">
                                <p className="text-xs font-bold text-white leading-none">{user?.firstName}</p>
                                <p className="text-[10px] font-bold text-gold/40 uppercase tracking-widest mt-1">Online</p>
                            </div>
                            {user?.avatar
                                ? <img src={user.avatar} className="w-10 h-10 rounded-md border border-white/10 object-cover" alt="avatar" />
                                : <div className="w-10 h-10 rounded-md border border-white/10 bg-white/5 flex items-center justify-center"><UserIcon className="w-5 h-5 text-gold/40" /></div>
                            }
                        </div>
                        <button
                            onClick={logout}
                            className="p-2 text-crimson/60 hover:text-crimson hover:bg-crimson/5 rounded-lg transition-all ml-2"
                            title="Sign Out"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </header>

                {/* Main Content Area */}
                <div className="flex-1 p-8 md:p-12 relative overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.03),transparent)]">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default RiderLayout;
