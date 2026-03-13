import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ClerkProvider, SignedIn, SignedOut, useUser } from '@clerk/clerk-react';
import { useCart } from './context/CartContext';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { CartProvider } from './context/CartContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Menu from './pages/Menu';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import AdminDashboard from './pages/AdminDashboard';
import AuthGuard from './components/AuthGuard';
import Orders from './pages/Orders';
// Clerk configuration moved to main.jsx
const AuthRedirect = () => {
    const { user, isLoaded } = useUser();
    const { state } = useCart();
    const navigate = useNavigate();

    useEffect(() => {
        if (isLoaded && user) {
            if (state.cartItems.length > 0) {
                navigate('/checkout');
            } else {
                navigate('/menu');
            }
        }
    }, [isLoaded, user, state.cartItems, navigate]);

    return null;
};

function App() {
  return (
      <CartProvider>
        <Router>
          <div className="min-h-screen">
            <Navbar />
            <AuthRedirect />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/menu" element={<Menu />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={
                <AuthGuard>
                  <Checkout />
                </AuthGuard>
              } />
              <Route path="/order-success" element={
                <AuthGuard>
                  <OrderSuccess />
                </AuthGuard>
              } />
              <Route path="/orders" element={
                <AuthGuard>
                  <Orders />
                </AuthGuard>
              } />
              <Route path="/admin" element={<AdminDashboard />} />
            </Routes>
          </div>
        </Router>
      </CartProvider>
  );
}

export default App;
