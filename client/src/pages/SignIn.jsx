import { useState, useEffect } from 'react';
import { Mail, Lock, Loader2, ArrowRight, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const SignIn = () => {
    const { login, isSignedIn, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isValidEmail, setIsValidEmail] = useState(null);

    useEffect(() => {
        if (isSignedIn) {
            navigate('/');
        }
    }, [isSignedIn, navigate]);

    const validateEmail = (val) => {
        setEmail(val);
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        setIsValidEmail(val.length > 0 ? re.test(val) : null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isValidEmail || !password) return;
        
        setLoading(true);
        setError('');
        try {
            await login(email, password);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Authentication failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[90vh] flex items-center justify-center p-4 bg-charcoal">
            <div className="bg-charcoal w-full md:max-w-md rounded-3xl border border-gold/30 shadow-[0_0_40px_rgba(212,175,55,0.15)] relative flex flex-col overflow-hidden">

                {(loading || authLoading) && (
                    <div className="absolute inset-0 bg-charcoal/95 backdrop-blur-md flex flex-col items-center justify-center z-50 animate-in fade-in duration-300">
                        <Loader2 className="w-16 h-16 text-gold animate-spin mb-6" />
                        <p className="text-xl font-bold text-gold tracking-wider font-serif">Securing Your Session...</p>
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-2">Encrypted connection active</p>
                    </div>
                )}

                <div className="p-8 border-b border-white/10 text-center">
                    <h2 className="text-4xl font-serif font-black text-gold tracking-wider">SIGN <span className="text-crimson">IN</span></h2>
                    <p className="text-xs text-soft-white/60 font-bold uppercase tracking-widest mt-1">Welcome back to AK-7 Executive</p>
                </div>

                <div className="p-8">
                    {error && (
                        <div className="mb-6 p-4 bg-crimson/10 border-l-4 border-crimson rounded-r-xl flex items-start gap-3">
                            <AlertCircle size={20} className="text-crimson shrink-0 mt-0.5" />
                            <div>
                                <p className="text-xs font-black text-crimson uppercase tracking-widest mb-1">Attention required</p>
                                <p className="text-sm font-medium text-red-200">{error}</p>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label htmlFor="email-input" className="text-[10px] font-black text-gold uppercase tracking-widest ml-1">Email Identity</label>
                            <div className="relative">
                                <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${isValidEmail ? 'text-green-400' : 'text-gray-500'}`} size={20} />
                                <input
                                    id="email-input"
                                    type="email"
                                    required
                                    className={`w-full pl-12 pr-12 py-4 bg-white/5 border rounded-2xl outline-none transition-all font-bold text-white placeholder:text-gray-600 ${isValidEmail === true ? 'border-green-400/50 focus:border-green-400' : isValidEmail === false ? 'border-crimson/50 focus:border-crimson' : 'border-white/10 focus:border-gold'}`}
                                    placeholder="chef@ak7rest.com"
                                    value={email}
                                    onChange={(e) => validateEmail(e.target.value)}
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                    {isValidEmail === true && <CheckCircle2 className="text-green-400 animate-in zoom-in" size={20} />}
                                    {isValidEmail === false && <AlertCircle className="text-crimson animate-in zoom-in" size={20} />}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="password-input" className="text-[10px] font-black text-gold uppercase tracking-widest ml-1">Security Key</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                                <input
                                    id="password-input"
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    className="w-full pl-12 pr-12 py-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-gold transition-all font-bold text-white placeholder:text-gray-600"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gold transition-colors"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={!isValidEmail || !password || loading}
                            className={`w-full py-4 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-3 shadow-xl ${(!isValidEmail || !password || loading) ? 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/10' : 'bg-gold hover:bg-yellow-400 text-charcoal hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] active:scale-[0.98]'}`}
                        >
                            Authorize Access
                            <ArrowRight size={20} />
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-gray-400 text-sm font-medium">
                            Don't have an account?{' '}
                            <Link to="/signup" className="text-gold font-bold hover:underline underline-offset-4">
                                Join Executive Club
                            </Link>
                        </p>
                    </div>
                </div>

                <div className="bg-white/5 p-4 border-t border-white/10 flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-gray-500 px-8">
                    <span className="flex items-center gap-2 text-green-400">
                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse shadow-[0_0_5px_currentColor]"></span>
                        Secure Connection
                    </span>
                    <span>Midnight Gourmet System</span>
                </div>
            </div>
        </div>
    );
};

export default SignIn;

