import { Routes, Route, Navigate } from "react-router-dom";
import { SignedIn, SignedOut, RedirectToSignIn, useUser } from "@clerk/clerk-react";
import ChefLayout from "./components/ChefLayout";
import Dashboard from "./pages/Dashboard";
import ActiveOrders from "./pages/ActiveOrders";
import OrderDetails from "./pages/OrderDetails";
import { useEffect, useState } from "react";
import api from "./services/api";

const AuthGuard = ({ children }) => {
  const { user, isLoaded } = useUser();
  const [isAuthorized, setIsAuthorized] = useState(null);

  useEffect(() => {
    const checkRole = () => {
      if (isLoaded && user) {
        try {
          // If publicMetadata is set, check for 'chef' role.
          // Fallback to true if no metadata is present to avoid locking out.
          const role = user.publicMetadata?.role;
          if (role && role !== 'chef' && role !== 'admin') {
            setIsAuthorized(false);
          } else {
            setIsAuthorized(true);
          }
        } catch (error) {
          console.error("Auth check failed", error);
          setIsAuthorized(false);
        }
      }
    };
    checkRole();
  }, [isLoaded, user]);

  if (!isLoaded) return (
    <div className="h-screen w-full flex items-center justify-center bg-charcoal">
       <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (isAuthorized === false) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-charcoal text-white p-6 text-center">
        <h2 className="text-3xl font-serif font-black text-crimson mb-4 uppercase tracking-tighter">Access Restricted</h2>
        <p className="text-soft-white/60 max-w-sm mb-8">This station requires Chef-level credentials. Please contact administration for authorization.</p>
        <button className="btn-gold" onClick={() => (window.location.href = "/")}>RETURN TO BASE</button>
      </div>
    );
  }

  return children;
};

function App() {
  return (
    <Routes>
      <Route element={<ChefLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/orders" element={<ActiveOrders />} />
        <Route path="/orders/:id" element={<OrderDetails />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
