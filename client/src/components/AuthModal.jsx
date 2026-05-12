import { X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';

/**
 * AuthModal — Lightweight redirect modal to the SignIn page.
 * Phone OTP authentication — no separate signup needed.
 */
const AuthModal = ({ onClose }) => {
    return createPortal(
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-title"
        >
            <div className="bg-[#1a1a1a] w-full md:max-w-md rounded-[3rem] p-10 relative border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.9)] text-center">

                <button
                    onClick={onClose}
                    aria-label="Close"
                    className="absolute top-8 right-8 p-3 hover:bg-white/5 rounded-2xl transition-all text-gray-500 hover:text-white border border-transparent hover:border-white/10"
                >
                    <X size={24} />
                </button>

                <h2 id="auth-title" className="text-4xl font-serif font-black tracking-tighter mb-2">
                    <span className="text-white">Dine</span><span className="text-gold">Xis</span>
                </h2>
                <p className="text-[10px] text-white/40 font-black uppercase tracking-[0.2em] mb-10">Premium Smart Dining</p>

                <div className="flex flex-col gap-4">
                    <Link
                        to="/signin"
                        onClick={onClose}
                        className="w-full py-5 bg-gold hover:bg-yellow-400 text-charcoal rounded-[2rem] font-black uppercase tracking-widest text-sm transition-all shadow-2xl shadow-gold/10 active:scale-95"
                    >
                        Sign In with Phone
                    </Link>
                </div>

                <div className="mt-10 pt-6 border-t border-white/5 flex justify-between items-center">
                    <span className="flex items-center gap-2 text-green-500 text-[9px] font-black uppercase tracking-widest">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_currentColor]"></span>
                        Secure
                    </span>
                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-600">DineXis Premium</span>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default AuthModal;
