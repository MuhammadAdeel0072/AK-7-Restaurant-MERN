import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { useCart } from './context/CartContext';
import { useProfile } from './context/UserContext';
import { CartProvider } from './context/CartContext';
import { UserProvider } from './context/UserContext';
import { SocketProvider } from './context/SocketContext';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Menu from './pages/Menu';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import AdminDashboard from './pages/AdminDashboard';
import AuthGuard from './components/AuthGuard';
import Orders from './pages/Orders';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';

const AuthRedirect = () => {
    const { profile, loading } = useProfile();
    const { state } = useCart();
    const navigate = useNavigate();

    // Logic to handle redirection after login if needed
    // Removed specific redirect to keep user on same page or go to destination
    return null;
};

import OrderTracker from './pages/OrderTracker';

import Profile from './pages/Profile';

import Reservations from './pages/Reservations';
import Settings from './pages/Settings';

function App() {
  return (
    <UserProvider>
      <SocketProvider>
        <CartProvider>
          <Router>
            <div className="min-h-screen bg-charcoal text-white transition-colors duration-300">
              <Navbar />
              <Toaster position="top-right" />
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/sign-in" element={<SignIn />} />
                <Route path="/sign-up" element={<SignUp />} />
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
                <Route path="/profile" element={
                  <AuthGuard>
                    <Profile />
                  </AuthGuard>
                } />
                <Route path="/reservations" element={
                  <AuthGuard>
                    <Reservations />
                  </AuthGuard>
                } />
                <Route path="/track/:id" element={
                  <AuthGuard>
                    <OrderTracker />
                  </AuthGuard>
                } />
                <Route path="/settings" element={
                  <AuthGuard>
                    <Settings />
                  </AuthGuard>
                } />
                <Route path="/admin" element={<AdminDashboard />} />
              </Routes>
            </div>
          </Router>
        </CartProvider>
      </SocketProvider>
    </UserProvider>
  );
}

export default App;
