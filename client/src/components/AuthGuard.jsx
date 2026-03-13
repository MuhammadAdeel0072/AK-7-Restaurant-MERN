import { useAuth } from '@clerk/clerk-react';
import { useState, useEffect } from 'react';
import AuthModal from './AuthModal';

const AuthGuard = ({ children }) => {
  const { isSignedIn, isLoaded } = useAuth();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      setShowModal(true);
    } else {
      setShowModal(false);
    }
  }, [isLoaded, isSignedIn]);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <>
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Authentication Required</h2>
            <p className="text-gray-600 mb-6">Please sign in to access this page.</p>
            <button 
                onClick={() => setShowModal(true)}
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-full transition-all transform hover:scale-105 shadow-lg"
            >
                Sign In Now
            </button>
        </div>
        {showModal && <AuthModal onClose={() => setShowModal(false)} />}
      </>
    );
  }

  return children;
};

export default AuthGuard;
