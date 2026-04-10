import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Utensils, Lock, User, ChefHat } from 'lucide-react';

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
        <div className="min-h-screen bg-[#121212] flex items-center justify-center p-6 font-sans">
            <div className="w-full max-w-md bg-[#1e1e1e] border border-white/5 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden group">
                {/* Visual Background Elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-gold/10 rounded-full blur-3xl -ml-16 -mb-16"></div>

                <div className="text-center mb-10 relative">
                    <div className="w-20 h-20 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-orange-500/20 group-hover:scale-110 transition-transform duration-500">
                        <ChefHat className="text-orange-500" size={40} />
                    </div>
                    <h1 className="text-3xl font-serif font-black text-white tracking-wide mb-2 uppercase italic">Kitchen <span className="text-orange-500">HQ</span></h1>
                    <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.5em]">Executive Chef Access Only</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 relative">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-white/50 uppercase tracking-widest ml-1">Chef Identifier</label>
                        <div className="relative group/input">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within/input:text-orange-500 transition-colors" size={20} />
                            <input 
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full bg-white/[0.02] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white font-bold placeholder:text-white/10 focus:border-orange-500/50 outline-none transition-all"
                                placeholder="chef@ak7rest.com"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-white/50 uppercase tracking-widest ml-1">Kitchen Secret</label>
                        <div className="relative group/input">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within/input:text-orange-500 transition-colors" size={20} />
                            <input 
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full bg-white/[0.02] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white font-bold placeholder:text-white/10 focus:border-orange-500/50 outline-none transition-all"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <button 
                        type="submit"
                        disabled={loading}
                        className="w-full bg-orange-600 hover:bg-orange-500 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-xl shadow-orange-900/20 flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
                    >
                        {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : (
                            <>
                                <Utensils size={20} />
                                Open Station
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-10 pt-6 border-t border-white/5 flex items-center justify-between text-[8px] font-black text-white/10 uppercase tracking-[0.3em]">
                    <span>Secure Line 07</span>
                    <span>AK-7 CulinaryOS</span>
                </div>
            </div>
        </div>
    );
};

export default Login;
