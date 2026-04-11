import { useState, useEffect } from 'react';
import { Mail, Lock, Loader2, ArrowRight, CheckCircle2, AlertCircle, Eye, EyeOff, Hash, KeyRound } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const SignIn = () => {
    const { login, isSignedIn, loading: authLoading, forgotPassword, resetPassword } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isValidEmail, setIsValidEmail] = useState(null);

    // Recovery states
    const [view, setView] = useState('login'); // 'login' or 'forgot'
    const [recoveryStep, setRecoveryStep] = useState(1); // 1: Email, 2: OTP+Pass
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');

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
        const loadingToast = toast.loading('Signing in...');
        try {
            await login(email, password);
            toast.dismiss(loadingToast);
            toast.success('Welcome back! ✅');
            navigate('/');
        } catch (err) {
            toast.dismiss(loadingToast);
            const errorMsg = err.response?.data?.message || 'Authentication failed. Please check your credentials.';
            toast.error(errorMsg);
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const handleRequestOTP = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await forgotPassword(email);
            setRecoveryStep(2);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await resetPassword(email, otp, newPassword);
            setView('login');
            setRecoveryStep(1);
            setOtp('');
            setNewPassword('');
        } catch (err) {
            console.error(err);
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
                        <p className="text-xl font-bold text-gold tracking-wider font-serif">Processing Protocol...</p>
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-2">Identity terminal active</p>
                    </div>
                )}

                <div className="p-8 border-b border-white/10 text-center">
                    <h2 className="text-4xl font-serif font-black text-gold tracking-wider uppercase">
                        {view === 'login' ? <>SIGN <span className="text-crimson">IN</span></> : <>RESET <span className="text-crimson">KEY</span></>}
                    </h2>
                    <p className="text-xs text-soft-white/60 font-bold uppercase tracking-widest mt-1">
                        {view === 'login' ? 'Welcome back to AK-7 Executive' : 'Security Recovery Terminal'}
                    </p>
                </div>

                <div className="p-8">
                    {/* Login View */}
                    {view === 'login' && (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label htmlFor="email-input" className="text-[10px] font-black text-gold uppercase tracking-widest ml-1">Email Identity</label>
                                <div className="relative">
                                    <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${isValidEmail ? 'text-green-400' : 'text-gray-500'}`} size={20} />
                                    <input
                                        id="email-input"
                                        type="email"
                                        required
                                        autoComplete="off"
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
                                <div className="flex justify-between items-center ml-1">
                                    <label htmlFor="password-input" className="text-[10px] font-black text-gold uppercase tracking-widest">Security Key</label>
                                    <button 
                                        type="button"
                                        onClick={() => setView('forgot')}
                                        className="text-[10px] font-bold text-gray-500 hover:text-gold uppercase tracking-widest transition-colors"
                                    >
                                        Forgot Key?
                                    </button>
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                                    <input
                                        id="password-input"
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        autoComplete="new-password"
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
                    )}

                    {/* Forgot Password View */}
                    {view === 'forgot' && (
                        <div className="space-y-6">
                            {recoveryStep === 1 ? (
                                <form onSubmit={handleRequestOTP} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gold uppercase tracking-widest ml-1">Registered Email</label>
                                        <div className="relative">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                                            <input
                                                type="email"
                                                required
                                                className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-gold transition-all font-bold text-white"
                                                placeholder="your@email.com"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <button
                                        type="submit"
                                        className="w-full py-4 bg-gold text-charcoal rounded-2xl font-black uppercase tracking-widest text-sm hover:scale-[1.02] active:scale-95 transition-all shadow-xl"
                                    >
                                        Get OTP Key
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => setView('login')}
                                        className="w-full text-xs font-bold text-gray-500 hover:text-white transition-colors uppercase tracking-widest"
                                    >
                                        Back to Login
                                    </button>
                                </form>
                            ) : (
                                <form onSubmit={handleResetPassword} className="space-y-6 animate-in slide-in-from-right duration-500">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gold uppercase tracking-widest ml-1">Authentication OTP</label>
                                        <div className="relative">
                                            <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                                            <input
                                                type="text"
                                                required
                                                maxLength={6}
                                                className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-gold transition-all font-bold text-white tracking-[1em] text-center"
                                                placeholder="000000"
                                                value={otp}
                                                onChange={(e) => setOtp(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gold uppercase tracking-widest ml-1">New Terminal Key</label>
                                        <div className="relative">
                                            <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                                            <input
                                                type="password"
                                                required
                                                autoComplete="new-password"
                                                className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-gold transition-all font-bold text-white"
                                                placeholder="New Security Key"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        className="w-full py-4 bg-crimson text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-crimson/20"
                                    >
                                        Initialize Reset
                                    </button>
                                    <p className="text-[10px] text-center text-soft-white/40 uppercase tracking-widest px-4 leading-relaxed">
                                        Check your server console for the 6-digit key to authorize this terminal.
                                    </p>
                                </form>
                            )}
                        </div>
                    )}

                    {view === 'login' && (
                        <div className="mt-8 text-center">
                            <p className="text-gray-400 text-sm font-medium">
                                Don't have an account?{' '}
                                <Link to="/signup" className="text-gold font-bold hover:underline underline-offset-4">
                                    Join Executive Club
                                </Link>
                            </p>
                        </div>
                    )}
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
