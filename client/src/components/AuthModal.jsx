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
                // Step 1: Create sign-in with identifier
                await signIn.create({ identifier: email });
                
                // Step 2: Prepare the first factor (send OTP code)
                const result = await signIn.prepareFirstFactor({
                    strategy: "email_code"
                });
                
                if (result.status === "needs_first_factor") {
                    setOtpSent(true);
                }
            } else {
                // Step 3: Attempt the first factor (verify OTP code)
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
            setError(err.errors ? err.errors[0].longMessage : 'Authentication failed. Please check your email and try again.');
        } finally {
            setLoading(false);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4" role="dialog" aria-modal="true" aria-labelledby="auth-title">
            <div className="glass-overlay w-full md:max-w-md max-h-[90vh] overflow-y-auto rounded-[3rem] relative flex flex-col transform transition-all duration-300 border border-white/10">
                
                {/* Branding & Status Overlay */}
                {loading && (
                    <div className="absolute inset-0 bg-[#1a1a1a]/95 backdrop-blur-md flex flex-col items-center justify-center z-50 animate-in fade-in duration-300 rounded-[3rem]">
                        <Loader2 className="w-16 h-16 text-gold animate-spin mb-6" />
                        <p className="text-xl font-bold text-gold tracking-wider font-serif">Securing Your Session...</p>
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-2 px-12 text-center">Encrypted connection active</p>
                    </div>
                )}

                {/* Header */}
                <div className="p-8 flex justify-between items-center border-b border-white/5">
                    <div>
                        <h2 id="auth-title" className="text-4xl font-serif font-black text-gold tracking-wider">AK-7 <span className="text-crimson">REST</span></h2>
                        <p className="text-[10px] text-soft-white/40 font-black uppercase tracking-[0.2em] mt-1">Premium Dining Identity</p>
                    </div>
                    <button onClick={onClose} aria-label="Close" className="p-3 hover:bg-white/5 rounded-2xl transition-all active:scale-95 text-gray-500 hover:text-white border border-transparent hover:border-white/10">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 sm:p-10 flex-1">
                    {error && (
                        <div className="mb-8 p-5 bg-crimson/10 border border-crimson/20 rounded-3xl flex items-start gap-4 animate-in slide-in-from-top-2">
                            <AlertCircle size={22} className="text-crimson shrink-0 mt-0.5" />
                            <div>
                                <p className="text-[10px] font-black text-crimson uppercase tracking-widest mb-1">Attention required</p>
                                <p className="text-sm font-medium text-red-200 leading-relaxed">{error}</p>
                            </div>
                        </div>
                    )}

                    {!otpSent && (
                        <div className="space-y-4 mb-10">
                            <button 
                                onClick={() => handleSocialLogin('google')}
                                className="w-full flex items-center justify-center gap-4 p-5 bg-white/[0.03] border border-white/5 rounded-[2rem] hover:border-gold/40 hover:bg-white/5 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] transition-all group active:scale-[0.98]"
                            >
                                <Chrome className="text-gray-400 group-hover:text-gold transition-colors" size={22} />
                                <span className="font-bold text-white tracking-wide group-hover:text-gold transition-colors">Continue with Google</span>
                            </button>
                            <button 
                                onClick={() => handleSocialLogin('x')}
                                className="w-full flex items-center justify-center gap-4 p-5 bg-black border border-white/5 rounded-[2rem] hover:border-gold/40 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] transition-all group active:scale-[0.98]"
                            >
                                <span className="text-2xl font-black text-white group-hover:scale-110 transition-transform">X</span>
                                <span className="font-bold text-white tracking-wide">Continue with X</span>
                            </button>
                        </div>
                    )}

                    <div className="relative mb-10">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
                        <div className="relative flex justify-center text-[10px] font-black uppercase tracking-[0.3em]"><span className="px-5 bg-[#1a1a1a] text-gray-500">Secure Identity</span></div>
                    </div>

                    <form onSubmit={handleEmailSignIn} className="space-y-8">
                        {!otpSent ? (
                            <div className="space-y-3">
                                <label htmlFor="email-input" className="text-[10px] font-black text-gold uppercase tracking-widest ml-1">Email Address</label>
                                <div className="relative">
                                    <Mail className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors ${isValidEmail ? 'text-green-400' : 'text-gray-500'}`} size={22} />
                                    <input 
                                        id="email-input"
                                        type="email" 
                                        required 
                                        className={`w-full pl-14 pr-14 py-5 bg-white/[0.03] border rounded-[2rem] outline-none transition-all font-bold text-white placeholder:text-white/10 ${isValidEmail === true ? 'border-green-400/30 focus:border-green-400' : isValidEmail === false ? 'border-crimson/30 focus:border-crimson' : 'border-white/10 focus:border-gold shadow-inner'}`}
                                        placeholder="chef@ak7rest.com"
                                        value={email}
                                        onChange={(e) => validateEmail(e.target.value)}
                                        aria-invalid={isValidEmail === false}
                                    />
                                    <div className="absolute right-5 top-1/2 -translate-y-1/2">
                                        {isValidEmail === true && <CheckCircle2 className="text-green-400 animate-in zoom-in" size={22} />}
                                        {isValidEmail === false && <AlertCircle className="text-crimson animate-in zoom-in" size={22} />}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6 animate-in mx-auto fade-in slide-in-from-right-4">
                                <div className="text-center">
                                    <label htmlFor="otp-input" className="text-xs font-black text-gold uppercase tracking-widest mb-4 block">Verification Code</label>
                                    <input 
                                        id="otp-input"
                                        type="text" 
                                        required 
                                        maxLength={6}
                                        className="w-full p-5 bg-white/[0.03] border border-white/10 rounded-[2rem] text-center text-4xl font-black tracking-[1rem] focus:border-gold outline-none transition-all placeholder:text-white/5 text-white shadow-inner"
                                        placeholder="000000"
                                        value={code}
                                        onChange={(e) => setCode(e.target.value)}
                                    />
                                </div>
                                <p className="text-center text-sm text-gray-500 p-6 border border-white/5 bg-white/[0.01] rounded-3xl mt-8 leading-relaxed">
                                    A verification code has been dispatched to <span className="text-gold font-bold block mt-1 underline underline-offset-4">{email}</span>
                                </p>
                            </div>
                        )}

                        <button 
                            type="submit"
                            disabled={(!otpSent && !isValidEmail) || (otpSent && code.length < 6)}
                            className={`w-full py-5 rounded-[2rem] font-black text-lg transition-all flex items-center justify-center gap-4 shadow-2xl mt-6 ${((!otpSent && !isValidEmail) || (otpSent && code.length < 6)) ? 'bg-white/5 text-gray-600 cursor-not-allowed border border-white/5' : 'bg-gold hover:bg-yellow-400 text-charcoal hover:shadow-[0_20px_50px_rgba(212,175,55,0.3)] active:scale-[0.98]'}`}
                        >
                            <span className="uppercase tracking-[0.2em] text-xs">
                                {otpSent ? 'Enter Dining Room' : 'Request Access'}
                            </span>
                            <ArrowRight size={20} className={((!otpSent && !isValidEmail) || (otpSent && code.length < 6)) ? 'opacity-30' : 'text-charcoal'} />
                        </button>
                    </form>
                </div>

                {/* Footer Micro-interaction */}
                <div className="bg-white/[0.02] p-5 border-t border-white/5 flex justify-between items-center text-[9px] font-black uppercase tracking-[0.3em] text-gray-500 px-10 rounded-b-[3rem] mt-auto">
                    <span className="flex items-center gap-2 text-green-500"><span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_currentColor]"></span> SECURE</span>
                    <span>AK-7 EXECUTIVE</span>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default AuthModal;
