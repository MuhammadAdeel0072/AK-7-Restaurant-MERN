import { useAuth } from '@clerk/clerk-react';
import { useState, useEffect } from 'react';
import { Shield as AuthIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

const AuthGuard = ({ children }) => {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
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
              to="/sign-in"
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
