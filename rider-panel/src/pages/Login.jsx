import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Loader2, Key } from 'lucide-react';

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
            // Error handled in context toast
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="min-h-screen bg-charcoal flex items-center justify-center p-6">
            <div className="w-full max-w-md bg-charcoal-light border border-gold/20 rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Key size={120} className="text-gold -rotate-12" />
                </div>

                <div className="text-center mb-10">
                    <h1 className="text-4xl font-serif font-black text-gold tracking-tighter italic uppercase mb-2">Rider <span className="text-white">Terminal</span></h1>
                    <p className="text-[10px] font-bold text-soft-white/40 uppercase tracking-[0.4em]">Logistics Authentication Protocol</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gold uppercase tracking-widest ml-1">Personnel ID (Email)</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gold/50" size={18} />
                            <input 
                                type="email"
                                value={email}
                                required
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white font-bold placeholder:text-white/20 focus:border-gold/50 outline-none transition-all"
                                placeholder="rider@ak7rest.com"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gold uppercase tracking-widest ml-1">Security Key</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gold/50" size={18} />
                            <input 
                                type="password"
                                value={password}
                                required
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white font-bold placeholder:text-white/20 focus:border-gold/50 outline-none transition-all"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <button 
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gold hover:bg-yellow-400 text-charcoal py-4 rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-lg shadow-gold/20 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : 'Authorize Access'}
                    </button>
                </form>

                <div className="mt-10 pt-6 border-t border-white/5 flex items-center justify-between text-[8px] font-black text-soft-white/20 uppercase tracking-widest">
                    <span>Terminal AK-7-R3</span>
                    <span>Encrypted Connection Active</span>
                </div>
            </div>
        </div>
    );
};

export default Login;
