import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Coffee, Lock, User, ShieldCheck } from 'lucide-react';

const Login = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await login(email, password);
            navigate('/');
        } catch (error) {
            // Error handled in toast
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
                        <Coffee className="text-gold" size={32} />
                    </div>
                    <h1 className="text-3xl font-bold text-white tracking-tight mb-2">AK-7 <span className="text-gold">Admin</span></h1>
                    <p className="text-xs font-medium text-white/40 uppercase tracking-[0.3em]">Command Center Authorization</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 relative">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-white/60 uppercase tracking-widest ml-1">Admin Identity</label>
                        <div className="relative group/input">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within/input:text-gold transition-colors" size={20} />
                            <input 
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white font-medium placeholder:text-white/10 focus:border-gold/50 focus:bg-white/[0.05] outline-none transition-all"
                                placeholder="admin@ak7rest.com"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-white/60 uppercase tracking-widest ml-1">Master Key</label>
                        <div className="relative group/input">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within/input:text-gold transition-colors" size={20} />
                            <input 
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white font-medium placeholder:text-white/10 focus:border-gold/50 focus:bg-white/[0.05] outline-none transition-all"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <button 
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gold hover:bg-yellow-400 text-[#0f1115] py-4 rounded-2x font-bold uppercase tracking-widest text-sm transition-all shadow-xl shadow-gold/10 flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
                    >
                        {loading ? <div className="w-5 h-5 border-2 border-[#0f1115]/30 border-t-[#0f1115] rounded-full animate-spin"></div> : (
                            <>
                                <ShieldCheck size={20} />
                                Authenticate
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-10 pt-6 border-t border-white/5 flex items-center justify-center gap-4 text-[9px] font-bold text-white/20 uppercase tracking-widest">
                    <span>V3.0 Secure</span>
                    <span className="w-1 h-1 bg-white/10 rounded-full"></span>
                    <span>Admin Protocol</span>
                </div>
            </div>
        </div>
    );
};

export default Login;
