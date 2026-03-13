import { useSignIn, useSignUp } from '@clerk/clerk-react';
import { useState } from 'react';
import { X, Mail, Chrome, Loader2, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { createPortal } from 'react-dom';

const AuthModal = ({ onClose }) => {
    const { isLoaded: signInLoaded, signIn, setActive: setSignInActive } = useSignIn();
    const { isLoaded: signUpLoaded, signUp, setActive: setSignUpActive } = useSignUp();
    
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [code, setCode] = useState('');
    const [isValidEmail, setIsValidEmail] = useState(null);

    const validateEmail = (val) => {
        setEmail(val);
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        setIsValidEmail(val.length > 0 ? re.test(val) : null);
    };

    const handleSocialLogin = async (provider) => {
        if (!signInLoaded) return;
        setLoading(true);
        setError('');
        try {
            await signIn.authenticateWithRedirect({
                strategy: `oauth_${provider}`,
                redirectUrl: '/sso-callback',
                redirectUrlComplete: '/'
            });
        } catch (err) {
            setLoading(false);
            setError(err.errors ? err.errors[0].longMessage : 'That service is currently busy. Try again soon.');
        }
    };

    const handleEmailSignIn = async (e) => {
        e.preventDefault();
        if (!signInLoaded || !isValidEmail) return;
        setLoading(true);
        setError('');
        try {
            if (!otpSent) {
                const result = await signIn.create({
                    identifier: email,
                    strategy: "email_code"
                });
                if (result.status === "needs_first_factor") {
                    setOtpSent(true);
                }
            } else {
                const result = await signIn.attemptFirstFactor({
                    strategy: "email_code",
                    code: code
                });
                if (result.status === "complete") {
                    await setSignInActive({ session: result.createdSessionId });
                    onClose();
                }
            }
        } catch (err) {
            setError(err.errors ? err.errors[0].longMessage : 'The code seems incorrect. Please check your inbox.');
        } finally {
            setLoading(false);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4" role="dialog" aria-modal="true" aria-labelledby="auth-title">
            <div className="bg-charcoal w-full md:max-w-md max-h-[90vh] overflow-y-auto rounded-3xl border border-gold/30 shadow-[0_0_40px_rgba(212,175,55,0.15)] relative flex flex-col transform transition-all duration-300">
                
                {/* Branding & Status Overlay */}
                {loading && (
                    <div className="absolute inset-0 bg-charcoal/95 backdrop-blur-md flex flex-col items-center justify-center z-50 animate-in fade-in duration-300 rounded-3xl">
                        <Loader2 className="w-16 h-16 text-gold animate-spin mb-6" />
                        <p className="text-xl font-bold text-gold tracking-wider font-serif">Securing Your Session...</p>
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-2 px-12 text-center">Encrypted connection active</p>
                    </div>
                )}

                {/* Header */}
                <div className="p-6 flex justify-between items-center border-b border-white/10">
                    <div>
                        <h2 id="auth-title" className="text-3xl font-serif font-black text-gold tracking-wider">AK-7 <span className="text-crimson">REST</span></h2>
                        <p className="text-xs text-soft-white/60 font-bold uppercase tracking-widest mt-1">Premium Dining Identity</p>
                    </div>
                    <button onClick={onClose} aria-label="Close" className="p-2 hover:bg-white/5 rounded-full transition-all active:scale-95 text-gray-400 hover:text-gold border border-transparent hover:border-gold/30">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 sm:p-8 flex-1">
                    {error && (
                        <div className="mb-6 p-4 bg-crimson/10 border-l-4 border-crimson rounded-r-xl flex items-start gap-3 animate-in slide-in-from-top-2">
                            <AlertCircle size={20} className="text-crimson shrink-0 mt-0.5" />
                            <div>
                                <p className="text-xs font-black text-crimson uppercase tracking-widest mb-1">Attention required</p>
                                <p className="text-sm font-medium text-red-200">{error}</p>
                            </div>
                        </div>
                    )}

                    {!otpSent && (
                        <div className="space-y-4 mb-8">
                            <button 
                                onClick={() => handleSocialLogin('google')}
                                className="w-full flex items-center justify-center gap-3 p-4 bg-white/5 border border-white/10 rounded-2xl hover:border-gold hover:bg-white/10 hover:shadow-[0_0_15px_rgba(212,175,55,0.2)] transition-all group active:scale-[0.98]"
                            >
                                <Chrome className="text-gray-300 group-hover:text-gold transition-colors" size={20} />
                                <span className="font-bold text-white tracking-wide group-hover:text-gold transition-colors">Continue with Google</span>
                            </button>
                            <button 
                                onClick={() => handleSocialLogin('x')}
                                className="w-full flex items-center justify-center gap-3 p-4 bg-black border border-white/10 rounded-2xl hover:border-gold hover:shadow-[0_0_15px_rgba(212,175,55,0.2)] transition-all group active:scale-[0.98]"
                            >
                                <span className="text-xl font-black text-white group-hover:scale-110 transition-transform">X</span>
                                <span className="font-bold text-white tracking-wide">Continue with X</span>
                            </button>
                        </div>
                    )}

                    <div className="relative mb-8">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
                        <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest"><span className="px-4 bg-charcoal text-gray-400">Or use email identity</span></div>
                    </div>

                    <form onSubmit={handleEmailSignIn} className="space-y-6">
                        {!otpSent ? (
                            <div className="space-y-2">
                                <label htmlFor="email-input" className="text-[10px] font-black text-gold uppercase tracking-widest ml-1">Email Address</label>
                                <div className="relative">
                                    <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${isValidEmail ? 'text-green-400' : 'text-gray-500'}`} size={20} />
                                    <input 
                                        id="email-input"
                                        type="email" 
                                        required 
                                        className={`w-full pl-12 pr-12 py-4 bg-white/5 border rounded-2xl outline-none transition-all font-bold text-white placeholder:text-gray-600 ${isValidEmail === true ? 'border-green-400/50 focus:border-green-400' : isValidEmail === false ? 'border-crimson/50 focus:border-crimson' : 'border-white/10 focus:border-gold focus:shadow-[0_0_10px_rgba(212,175,55,0.2)]'}`}
                                        placeholder="chef@ak7rest.com"
                                        value={email}
                                        onChange={(e) => validateEmail(e.target.value)}
                                        aria-invalid={isValidEmail === false}
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                        {isValidEmail === true && <CheckCircle2 className="text-green-400 animate-in zoom-in" size={20} />}
                                        {isValidEmail === false && <AlertCircle className="text-crimson animate-in zoom-in" size={20} />}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4 animate-in mx-auto fade-in slide-in-from-right-4">
                                <div className="text-center">
                                    <label htmlFor="otp-input" className="text-xs font-black text-gold uppercase tracking-widest mb-3 block">Enter 6-digit Code</label>
                                    <input 
                                        id="otp-input"
                                        type="text" 
                                        required 
                                        maxLength={6}
                                        className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-center text-3xl font-black tracking-[0.5rem] focus:border-gold outline-none transition-all placeholder:text-gray-600 text-white"
                                        placeholder="000000"
                                        value={code}
                                        onChange={(e) => setCode(e.target.value)}
                                    />
                                </div>
                                <p className="text-center text-sm text-gray-400 p-4 border border-white/5 bg-white/5 rounded-xl mt-6">
                                    We sent a special link to <span className="text-gold font-bold block mt-1">{email}</span>
                                </p>
                            </div>
                        )}

                        <button 
                            type="submit"
                            disabled={(!otpSent && !isValidEmail) || (otpSent && code.length < 6)}
                            className={`w-full py-4 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-3 shadow-xl mt-4 ${((!otpSent && !isValidEmail) || (otpSent && code.length < 6)) ? 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/10' : 'bg-gold hover:bg-yellow-400 text-charcoal hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] active:scale-[0.98]'}`}
                        >
                            {otpSent ? 'Login to AK-7' : 'Continue'}
                            <ArrowRight size={20} className={((!otpSent && !isValidEmail) || (otpSent && code.length < 6)) ? 'opacity-50' : 'text-charcoal'} />
                        </button>
                    </form>
                </div>

                {/* Footer Micro-interaction */}
                <div className="bg-white/5 p-4 border-t border-white/10 flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-gray-500 px-8 rounded-b-3xl mt-auto">
                    <span className="flex items-center gap-2 text-green-400"><span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse shadow-[0_0_5px_currentColor]"></span> Encrypted</span>
                    <span>Midnight Gourmet</span>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default AuthModal;
