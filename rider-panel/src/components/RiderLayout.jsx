import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
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
import { useRider } from '../hooks/useRider';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { BrandLogo, typographyClasses } from './BrandingUtils';

const RiderLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const location = useLocation();
    const { stats } = useRider();
    const { user, logout } = useAuth();
    const { t, i18n } = useTranslation();

    const toggleLanguage = () => {
        const newLang = i18n.language === 'en' ? 'ur' : 'en';
        i18n.changeLanguage(newLang);
        document.documentElement.dir = newLang === 'ur' ? 'rtl' : 'ltr';
    };

    useEffect(() => {
        document.documentElement.dir = i18n.language === 'ur' ? 'rtl' : 'ltr';
    }, [i18n.language]);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const navItems = [
        { path: '/', label: t('dashboard'), icon: LayoutDashboard },
        { path: '/orders', label: t('deliveries'), icon: Truck },
        { path: '/profile', label: 'Profile', icon: UserIcon }, // Translation for Profile missing in i18n.js, I'll add it or use default
    ];

    return (
        <div className="flex min-h-screen bg-charcoal text-soft-white font-sans selection:bg-gold selection:text-charcoal relative">


            {/* Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-50 transition-opacity"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Premium Sidebar Navigation */}
            <aside className={`
                fixed top-0 left-0 h-full w-72 glass border-r border-white/5 z-50 transition-transform duration-500 ease-in-out lg:translate-x-0
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="flex flex-col h-full p-8">
                    <div className="mb-12">
                        <BrandLogo size="md" />
                        <span className={`${typographyClasses.labelSmall} block mt-2 font-black tracking-[0.2em]`}>RIDER TERMINAL</span>
                    </div>

                    <nav className="flex-1 space-y-4">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                onClick={() => setIsSidebarOpen(false)}
                                className={({ isActive }) =>
                                    `flex items-center space-x-4 px-5 py-4 rounded-xl transition-all duration-300 group ${isActive
                                        ? 'bg-gold/10 text-gold border border-gold/20 shadow-[0_0_20px_rgba(212,175,55,0.1)]'
                                        : 'text-soft-white/60 hover:bg-white/5 hover:text-soft-white border border-transparent'
                                    }`
                                }
                            >
                                <item.icon className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
                                <span className="text-sm font-bold tracking-wide uppercase tracking-[0.05em]">{item.label}</span>
                            </NavLink>
                        ))}
                    </nav>



                    {/* Standardized Logout - Matching Admin/Chef */}
                    <button
                        onClick={logout}
                        className="flex items-center space-x-4 w-full px-5 py-4 text-crimson hover:bg-crimson/5 rounded-xl transition-all duration-300 group border border-transparent hover:border-crimson/20"
                    >
                        <LogOut className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        <span className="font-bold tracking-wider text-sm uppercase">LOGOUT</span>
                    </button>
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
                            </div>
                            {user?.avatar
                                ? <img src={user.avatar} className="w-10 h-10 rounded-md border border-white/10 object-cover" alt="avatar" />
                                : <div className="w-10 h-10 rounded-md border border-white/10 bg-white/5 flex items-center justify-center"><UserIcon className="w-5 h-5 text-gold/40" /></div>
                            }
                        </div>
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
