import { useAuth } from '../context/AuthContext';
import { Shield as AuthIcon, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const AuthGuard = ({ children }) => {
  const { isSignedIn, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin h-12 w-12 text-gold mb-4" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gold/60">Verifying Identity</p>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
        <div className="w-20 h-20 bg-gold/10 rounded-full flex items-center justify-center mb-6">
          <AuthIcon className="w-10 h-10 text-gold/40" />
        </div>
        <h2 className="text-3xl font-serif font-bold text-white mb-2">Private Experience</h2>
        <p className="text-gold/60 font-medium tracking-widest uppercase text-[10px] mb-8">Identification required for gourmet access</p>
        <Link
          to="/signin"
          className="bg-gold text-charcoal font-black py-4 px-12 rounded-2xl transition-all transform hover:scale-105 shadow-xl shadow-gold/20 active:scale-95"
        >
          Secure Identity
        </Link>
      </div>
    );
  }

  return children;
};

export default AuthGuard;

