import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { ShieldCheck, Mail, Lock, CheckCircle, ArrowRight, RefreshCw, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const StaffSetup = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1: OTP, 2: Password
    const [loading, setLoading] = useState(false);
    
    const [email, setEmail] = useState(searchParams.get('email') || '');
    const [otp, setOtp] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        if (otp.length !== 6) return toast.error('Please enter 6-digit OTP');
        
        setLoading(true);
        try {
            const { data } = await api.post('/auth/staff/verify-otp', { email, otp });
            toast.success(data.message);
            setStep(2);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Verification failed');
        } finally {
            setLoading(false);
        }
    };

    const handleSetupPassword = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) return toast.error('Passwords do not match');
        if (password.length < 8) return toast.error('Password must be at least 8 characters');
        
        // Regex for strong password: 1 uppercase, 1 lowercase, 1 number, 1 special char
        const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!strongRegex.test(password)) {
            return toast.error('Password must include uppercase, lowercase, number and special character');
        }

        setLoading(true);
        try {
            const { data } = await api.post('/auth/staff/setup-password', { email, otp, password });
            toast.success('Account activated successfully!');
            // After setup, redirect to their specific panel or just a success state
            setTimeout(() => {
                const role = data.role?.toLowerCase();
                if (role === 'rider') window.location.href = '/rider'; // Placeholder for redirection logic
                else if (role === 'chef') window.location.href = '/chef';
                else navigate('/login');
            }, 2000);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Account setup failed');
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
                        <ShieldCheck className="text-gold" size={32} />
                    </div>
                    <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Staff <span className="text-gold">Onboarding</span></h1>
                    <p className="text-xs font-medium text-white/40 uppercase tracking-[0.3em]">
                        {step === 1 ? 'Verify Your Invitation' : 'Setup Your Account'}
                    </p>
                </div>

                <AnimatePresence mode="wait">
                    {step === 1 ? (
                        <motion.form 
                            key="step1"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            onSubmit={handleVerifyOTP} 
                            className="space-y-6 relative"
                        >
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-white/60 uppercase tracking-widest ml-1">Email Address</label>
                                <div className="relative group/input">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within/input:text-gold transition-colors" size={20} />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white font-medium placeholder:text-white/10 focus:border-gold/50 focus:bg-white/[0.05] outline-none transition-all"
                                        placeholder="your@email.com"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-white/60 uppercase tracking-widest ml-1">Verification Code (OTP)</label>
                                <div className="relative group/input">
                                    <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within/input:text-gold transition-colors" size={20} />
                                    <input
                                        type="text"
                                        maxLength={6}
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                        required
                                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white font-bold tracking-[1em] placeholder:text-white/10 focus:border-gold/50 focus:bg-white/[0.05] outline-none transition-all"
                                        placeholder="••••••"
                                    />
                                </div>
                                <p className="text-[9px] text-white/30 text-center mt-2">Enter the 6-digit code sent to your phone</p>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || otp.length !== 6}
                                className="w-full bg-gold hover:bg-yellow-400 text-[#0f1115] py-4 rounded-full font-bold uppercase tracking-widest text-sm transition-all shadow-xl shadow-gold/10 flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
                            >
                                {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : (
                                    <>
                                        Verify OTP
                                        <ArrowRight size={20} />
                                    </>
                                )}
                            </button>
                        </motion.form>
                    ) : (
                        <motion.form 
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            onSubmit={handleSetupPassword} 
                            className="space-y-6 relative"
                        >
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-white/60 uppercase tracking-widest ml-1">New Password</label>
                                <div className="relative group/input">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within/input:text-gold transition-colors" size={20} />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white font-medium placeholder:text-white/10 focus:border-gold/50 focus:bg-white/[0.05] outline-none transition-all"
                                        placeholder="Create password"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-white/60 uppercase tracking-widest ml-1">Confirm Password</label>
                                <div className="relative group/input">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within/input:text-gold transition-colors" size={20} />
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white font-medium placeholder:text-white/10 focus:border-gold/50 focus:bg-white/[0.05] outline-none transition-all"
                                        placeholder="Repeat password"
                                    />
                                </div>
                            </div>

                            <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl space-y-2">
                                <p className="text-[9px] font-bold text-white/40 uppercase tracking-wider">Security Requirements:</p>
                                <ul className="space-y-1">
                                    <li className={`text-[8px] flex items-center gap-2 ${password.length >= 8 ? 'text-emerald-400' : 'text-white/20'}`}>
                                        <CheckCircle size={10} /> 8+ Characters
                                    </li>
                                    <li className={`text-[8px] flex items-center gap-2 ${/[A-Z]/.test(password) && /[a-z]/.test(password) ? 'text-emerald-400' : 'text-white/20'}`}>
                                        <CheckCircle size={10} /> Case Sensitive (Abc)
                                    </li>
                                    <li className={`text-[8px] flex items-center gap-2 ${/\d/.test(password) && /[@$!%*?&]/.test(password) ? 'text-emerald-400' : 'text-white/20'}`}>
                                        <CheckCircle size={10} /> Number & Special Character
                                    </li>
                                </ul>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || password !== confirmPassword || password.length < 8}
                                className="w-full bg-gold hover:bg-yellow-400 text-[#0f1115] py-4 rounded-full font-bold uppercase tracking-widest text-sm transition-all shadow-xl shadow-gold/10 flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
                            >
                                {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : (
                                    <>
                                        Complete Setup
                                        <ShieldCheck size={20} />
                                    </>
                                )}
                            </button>
                        </motion.form>
                    )}
                </AnimatePresence>

                <div className="mt-10 pt-6 border-t border-white/5 flex items-center justify-center gap-4 text-[9px] font-bold text-white/20 uppercase tracking-widest">
                    <span>V3.0 Secure</span>
                    <span className="w-1 h-1 bg-white/10 rounded-full"></span>
                    <span>Onboarding System</span>
                </div>
            </div>
        </div>
    );
};

export default StaffSetup;
