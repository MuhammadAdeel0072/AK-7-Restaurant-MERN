import { useState, useEffect, useRef, useCallback } from 'react';
import { Mail, Loader2, ArrowRight, Shield, ChevronLeft, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';



const SignIn = () => {
    const { sendOTP, verifyOTP, isSignedIn, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    // Step management: 'phone' or 'otp'
    const [step, setStep] = useState('phone');

    // Email input state
    const [email, setEmail] = useState('');

    // OTP input state
    const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
    const otpRefs = useRef([]);

    // Timer state
    const [resendTimer, setResendTimer] = useState(0);
    const timerRef = useRef(null);

    // Loading/error states
    const [loading, setLoading] = useState(false);

    // Redirect if already signed in
    useEffect(() => {
        if (isSignedIn) {
            navigate('/');
        }
    }, [isSignedIn, navigate]);

    // Resend timer countdown
    useEffect(() => {
        if (resendTimer > 0) {
            timerRef.current = setTimeout(() => setResendTimer(t => t - 1), 1000);
            return () => clearTimeout(timerRef.current);
        }
    }, [resendTimer]);

    // Validate email
    const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    // Handle email input
    const handleEmailChange = (e) => {
        setEmail(e.target.value);
    };

    // Send OTP handler
    const handleSendOTP = async (e) => {
        e?.preventDefault();
        if (!isEmailValid) {
            toast.error('Please enter a valid email address');
            return;
        }

        setLoading(true);
        try {
            await sendOTP(email);
            setStep('otp');
            setResendTimer(30);
            setOtpDigits(['', '', '', '', '', '']);
            // Auto-focus first OTP input
            setTimeout(() => otpRefs.current[0]?.focus(), 300);
        } catch (err) {
            // Error toast handled in AuthContext
        } finally {
            setLoading(false);
        }
    };

    // Resend OTP
    const handleResend = async () => {
        if (resendTimer > 0) return;
        setLoading(true);
        try {
            await sendOTP(email);
            setResendTimer(30);
            setOtpDigits(['', '', '', '', '', '']);
            otpRefs.current[0]?.focus();
        } catch (err) {
            // handled in context
        } finally {
            setLoading(false);
        }
    };

    // Handle OTP digit input with auto-focus
    const handleOtpChange = useCallback((index, value) => {
        // Only allow single digit
        const digit = value.replace(/\D/g, '').slice(-1);
        const newDigits = [...otpDigits];
        newDigits[index] = digit;
        setOtpDigits(newDigits);

        // Auto-focus next input
        if (digit && index < 5) {
            otpRefs.current[index + 1]?.focus();
        }
    }, [otpDigits]);

    // Handle backspace on OTP inputs
    const handleOtpKeyDown = useCallback((index, e) => {
        if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
    }, [otpDigits]);

    // Handle OTP paste
    const handleOtpPaste = useCallback((e) => {
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (pasted.length > 0) {
            e.preventDefault();
            const newDigits = [...otpDigits];
            for (let i = 0; i < 6; i++) {
                newDigits[i] = pasted[i] || '';
            }
            setOtpDigits(newDigits);
            const focusIndex = Math.min(pasted.length, 5);
            otpRefs.current[focusIndex]?.focus();
        }
    }, [otpDigits]);

    // Verify OTP handler
    const handleVerifyOTP = async (e) => {
        e?.preventDefault();
        const otp = otpDigits.join('');
        if (otp.length !== 6) {
            toast.error('Please enter the complete 6-digit code');
            return;
        }

        setLoading(true);
        try {
            await verifyOTP(email, otp);
            navigate('/');
        } catch (err) {
            // Error handled in context
        } finally {
            setLoading(false);
        }
    };

    // Auto-submit when all 6 digits entered
    useEffect(() => {
        if (otpDigits.every(d => d !== '') && step === 'otp') {
            handleVerifyOTP();
        }
    }, [otpDigits, step]);



    return (
        <div className="min-h-[90vh] flex items-center justify-center p-4 bg-charcoal">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="bg-charcoal w-full md:max-w-md rounded-3xl border border-gold/30 shadow-[0_0_40px_rgba(212,175,55,0.15)] relative flex flex-col overflow-hidden"
            >
                {/* Loading Overlay */}
                <AnimatePresence>
                    {(loading || authLoading) && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-charcoal/95 backdrop-blur-md flex flex-col items-center justify-center z-50"
                        >
                            <Loader2 className="w-16 h-16 text-gold animate-spin mb-6" />
                            <p className="text-xl font-bold text-gold tracking-wider font-serif">
                                {step === 'phone' ? 'Sending OTP...' : 'Verifying...'}
                            </p>
                            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-2">Please wait</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Header */}
                <div className="p-8 border-b border-white/10 text-center">
                    <h2 className="text-4xl font-serif font-black text-gold tracking-wider uppercase">
                        {step === 'phone' ? (
                            <>SIGN <span className="text-gold">IN</span></>
                        ) : (
                            <>VERIFY <span className="text-gold">OTP</span></>
                        )}
                    </h2>
                    <p className="text-xs text-soft-white/60 font-bold uppercase tracking-widest mt-1">
                        {step === 'phone' ? 'Welcome to DineXis' : `Code sent to ${email}`}
                    </p>
                </div>

                <div className="p-8">
                    <AnimatePresence mode="wait">
                        {/* ======== STEP 1: PHONE INPUT ======== */}
                        {step === 'phone' && (
                            <motion.form
                                key="phone-step"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                                onSubmit={handleSendOTP}
                                className="space-y-6"
                            >
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gold uppercase tracking-widest ml-1">Email Address</label>
                                    <div className="flex gap-2">
                                        {/* Email Input */}
                                        <div className="relative flex-1">
                                            <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${isEmailValid ? 'text-green-400' : 'text-gray-500'}`} size={20} />
                                            <input
                                                id="email-input"
                                                type="email"
                                                autoComplete="email"
                                                className={`w-full pl-12 pr-4 py-4 bg-white/5 border rounded-2xl outline-none transition-all font-bold text-white placeholder:text-gray-600 text-lg tracking-wider ${isEmailValid ? 'border-green-400/50 focus:border-green-400' : 'border-white/10 focus:border-gold'}`}
                                                placeholder="alex@example.com"
                                                value={email}
                                                onChange={handleEmailChange}
                                                autoFocus
                                            />
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-gray-500 font-medium ml-1 mt-1">Enter your email address to receive a verification code</p>
                                </div>

                                <button
                                    type="submit"
                                    disabled={!isEmailValid || loading}
                                    className={`w-full py-4 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-3 shadow-xl ${(!isEmailValid || loading) ? 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/10' : 'bg-gold hover:bg-yellow-400 text-charcoal hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] active:scale-[0.98]'}`}
                                >
                                    Send OTP
                                    <ArrowRight size={20} />
                                </button>
                            </motion.form>
                        )}

                        {/* ======== STEP 2: OTP VERIFICATION ======== */}
                        {step === 'otp' && (
                            <motion.form
                                key="otp-step"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.3 }}
                                onSubmit={handleVerifyOTP}
                                className="space-y-6"
                            >
                                {/* Back button */}
                                <button
                                    type="button"
                                    onClick={() => setStep('phone')}
                                    className="flex items-center gap-2 text-gray-500 hover:text-gold transition-colors text-sm font-bold"
                                >
                                    <ChevronLeft size={16} />
                                    Change Email
                                </button>

                                {/* OTP Input Grid */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gold uppercase tracking-widest ml-1">Enter 6-Digit Code</label>
                                    <div className="flex gap-2 justify-center">
                                        {otpDigits.map((digit, idx) => (
                                            <input
                                                key={idx}
                                                ref={el => otpRefs.current[idx] = el}
                                                type="text"
                                                inputMode="numeric"
                                                maxLength={1}
                                                value={digit}
                                                onChange={(e) => handleOtpChange(idx, e.target.value)}
                                                onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                                                onPaste={idx === 0 ? handleOtpPaste : undefined}
                                                className={`w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-black bg-white/5 border rounded-2xl outline-none transition-all text-white focus:border-gold focus:shadow-[0_0_15px_rgba(212,175,55,0.2)] ${digit ? 'border-gold/50' : 'border-white/10'}`}
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* Resend Timer */}
                                <div className="text-center">
                                    {resendTimer > 0 ? (
                                        <p className="text-xs text-gray-500 font-bold">
                                            Resend OTP in <span className="text-gold">{resendTimer}s</span>
                                        </p>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={handleResend}
                                            disabled={loading}
                                            className="flex items-center gap-2 text-gold hover:text-yellow-400 transition-colors text-xs font-bold uppercase tracking-widest mx-auto"
                                        >
                                            <RefreshCw size={12} />
                                            Resend Code
                                        </button>
                                    )}
                                </div>

                                {/* Verify Button */}
                                <button
                                    type="submit"
                                    disabled={otpDigits.some(d => !d) || loading}
                                    className={`w-full py-4 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-3 shadow-xl ${(otpDigits.some(d => !d) || loading) ? 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/10' : 'bg-gold hover:bg-yellow-400 text-charcoal hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] active:scale-[0.98]'}`}
                                >
                                    Verify & Continue
                                    <Shield size={20} />
                                </button>

                                <p className="text-[10px] text-center text-soft-white/40 uppercase tracking-widest px-4 leading-relaxed">
                                    Check your email for the 6-digit verification code.
                                    {process.env.NODE_ENV === 'development' && ' (Dev: Check server console)'}
                                </p>
                            </motion.form>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer */}
                <div className="bg-white/5 p-4 border-t border-white/10 flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-gray-500 px-8">
                    <span className="flex items-center gap-2 text-green-400">
                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse shadow-[0_0_5px_currentColor]"></span>
                        Secure Connection
                    </span>
                    <span>DineXis</span>
                </div>
            </motion.div>
        </div>
    );
};

export default SignIn;
