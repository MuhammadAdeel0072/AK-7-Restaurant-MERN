import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Bike, Lock, User, ShieldCheck, XCircle } from 'lucide-react';

const Login = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleClear = () => {
        setEmail('');
        setPassword('');
        toast.success('Inputs cleared');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const loadingToast = toast.loading('Signing in...');
        try {
            await login(email, password);
            toast.dismiss(loadingToast);
            toast.success('Welcome back, Rider! 🚴', { duration: 3000 });
            navigate('/');
        } catch (error) {
            toast.dismiss(loadingToast);
            toast.error(error.response?.data?.message || 'Wrong email or password.', { duration: 4000 });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0f1115] flex items-center justify-center p-6 font-sans">
            <div className="w-full max-w-md bg-[#1a1d23] border border-white/5 rounded-[2rem] p-10 shadow-2xl relative overflow-hidden group">
                {/* Visual Background Elements */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-gold/10 rounded-full blur-[80px]"></div>
                <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-crimson/10 rounded-full blur-[80px]"></div>

                <div className="text-center mb-10 relative">
                    <div className="w-16 h-16 bg-gold/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-gold/20 rotate-3 group-hover:rotate-6 transition-transform">
                        <Bike className="text-gold" size={32} />
                    </div>
                    <h1 className="text-3xl font-bold text-white tracking-tight mb-2">AK-7 <span className="text-gold">Rider</span></h1>
                    <p className="text-xs font-medium text-white/40 uppercase tracking-[0.3em]">Logistics Terminal Authorization</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 relative" autoComplete="off">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-white/60 uppercase tracking-widest ml-1">Rider Identity</label>
                        <div className="relative group/input">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within/input:text-gold transition-colors" size={20} />
                            <input 
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoComplete="off"
                                className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-12 pr-12 text-white font-medium placeholder:text-white/10 focus:border-gold/50 focus:bg-white/[0.05] outline-none transition-all"
                                placeholder="rider@ak7rest.com"
                            />
                            {email && (
                                <button 
                                    type="button" 
                                    onClick={() => setEmail('')}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/10 hover:text-crimson transition-colors"
                                >
                                    <XCircle size={18} />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-white/60 uppercase tracking-widest ml-1">Personnel Key</label>
                        <div className="relative group/input">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within/input:text-gold transition-colors" size={20} />
                            <input 
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                autoComplete="off"
                                className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-12 pr-12 text-white font-medium placeholder:text-white/10 focus:border-gold/50 focus:bg-white/[0.05] outline-none transition-all"
                                placeholder="••••••••"
                            />
                            {password && (
                                <button 
                                    type="button" 
                                    onClick={() => setPassword('')}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/10 hover:text-crimson transition-colors"
                                >
                                    <XCircle size={18} />
                                </button>
                            )}
                        </div>
                    </div>

                    <button 
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gold hover:bg-yellow-400 text-[#0f1115] py-4 rounded-full font-bold uppercase tracking-widest text-sm transition-all shadow-xl shadow-gold/10 flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
                    >
                        {loading ? <div className="w-5 h-5 border-2 border-[#0f1115]/30 border-t-[#0f1115] rounded-full animate-spin"></div> : (
                            <>
                                <ShieldCheck size={20} />
                                Authenticate Identity
                            </>
                        )}
                    </button>

                    <button 
                        type="button"
                        onClick={handleClear}
                        className="w-full text-xs font-bold text-white/30 uppercase tracking-[0.2em] hover:text-crimson transition-all pt-3 flex items-center justify-center gap-2"
                    >
                        <XCircle size={14} />
                        Clear Entries
                    </button>
                </form>

                <div className="mt-10 pt-6 border-t border-white/5 flex items-center justify-center gap-4 text-[9px] font-bold text-white/20 uppercase tracking-widest">
                    <span>V3.0 Secure</span>
                    <span className="w-1 h-1 bg-white/10 rounded-full"></span>
                    <span>Rider Protocol</span>
                </div>
            </div>
        </div>
    );
};

export default Login;
