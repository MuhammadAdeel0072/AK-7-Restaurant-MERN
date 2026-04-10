import { useState, useEffect } from 'react';
import { Mail, Lock, Loader2, ArrowRight, CheckCircle2, AlertCircle, User as UserIcon, Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const SignUp = () => {
    const { register, isSignedIn, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
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
        if (!isValidEmail || !password || !firstName || password !== confirmPassword) {
            if (password !== confirmPassword) setError('Passwords do not match');
            return;
        }
        
        setLoading(true);
        setError('');
        try {
            await register({
                firstName,
                lastName,
                email,
                password
            });
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[90vh] flex items-center justify-center p-4 bg-charcoal py-12">
            <div className="bg-charcoal w-full md:max-w-md rounded-3xl border border-gold/30 shadow-[0_0_40px_rgba(212,175,55,0.15)] relative flex flex-col overflow-hidden">

                {(loading || authLoading) && (
                    <div className="absolute inset-0 bg-charcoal/95 backdrop-blur-md flex flex-col items-center justify-center z-50 animate-in fade-in duration-300">
                        <Loader2 className="w-16 h-16 text-gold animate-spin mb-6" />
                        <p className="text-xl font-bold text-gold tracking-wider font-serif">Creating Identity...</p>
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-2">Initializing Membership</p>
                    </div>
                )}

                <div className="p-8 border-b border-white/10 text-center">
                    <h2 className="text-4xl font-serif font-black text-gold tracking-wider">SIGN <span className="text-crimson">UP</span></h2>
                    <p className="text-xs text-soft-white/60 font-bold uppercase tracking-widest mt-1">Join the AK-7 Inner Circle</p>
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

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gold uppercase tracking-widest ml-1">First Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl outline-none transition-all font-bold text-white focus:border-gold"
                                    placeholder="Zarar"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gold uppercase tracking-widest ml-1">Last Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl outline-none transition-all font-bold text-white focus:border-gold"
                                    placeholder="Ahmed"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gold uppercase tracking-widest ml-1">Email Terminal</label>
                            <div className="relative">
                                <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${isValidEmail ? 'text-green-400' : 'text-gray-500'}`} size={20} />
                                <input
                                    type="email"
                                    required
                                    className={`w-full pl-12 pr-4 py-4 bg-white/5 border rounded-2xl outline-none transition-all font-bold text-white placeholder:text-gray-600 ${isValidEmail === true ? 'border-green-400/50 focus:border-green-400' : isValidEmail === false ? 'border-crimson/50 focus:border-crimson' : 'border-white/10 focus:border-gold'}`}
                                    placeholder="customer@ak7rest.com"
                                    value={email}
                                    onChange={(e) => validateEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gold uppercase tracking-widest ml-1">Security Key</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    className="w-full pl-12 pr-12 py-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-gold transition-all font-bold text-white"
                                    placeholder="Minimum 6 characters"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gold"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gold uppercase tracking-widest ml-1">Confirm Key</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                                <input
                                    type="password"
                                    required
                                    className={`w-full pl-12 pr-4 py-4 bg-white/5 border rounded-2xl outline-none transition-all font-bold text-white ${password && confirmPassword && password !== confirmPassword ? 'border-crimson' : 'border-white/10 focus:border-gold'}`}
                                    placeholder="Repeat security key"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !firstName || !isValidEmail || !password || password !== confirmPassword}
                            className={`w-full py-4 mt-4 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-3 shadow-xl ${(loading || !firstName || !isValidEmail || !password || password !== confirmPassword) ? 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/10' : 'bg-gold hover:bg-yellow-400 text-charcoal hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] active:scale-[0.98]'}`}
                        >
                            Initiate Membership
                            <ArrowRight size={20} />
                        </button>
                    </form>

                    <div className="mt-8 text-center border-t border-white/5 pt-6">
                        <p className="text-gray-400 text-sm font-medium">
                            Already a member?{' '}
                            <Link to="/signin" className="text-gold font-bold hover:underline underline-offset-4 transition-all">
                                Sign In here
                            </Link>
                        </p>
                    </div>
                </div>

                <div className="bg-white/5 p-4 border-t border-white/10 flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-gray-500 px-8">
                    <span className="flex items-center gap-2 text-gold"><span className="w-1.5 h-1.5 bg-gold rounded-full animate-pulse shadow-[0_0_5px_currentColor]"></span> Identity Secured</span>
                    <span>AK-7 Guest Protocol</span>
                </div>
            </div>
        </div>
    );
};

export default SignUp;

