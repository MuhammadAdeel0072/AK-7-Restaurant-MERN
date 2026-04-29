import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
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
import OrderHistory from './pages/OrderHistory';
import SignIn from './pages/SignIn';
import TrackOrderPage from './pages/TrackOrderPage';
import Help from './pages/Help';
import Reservations from './pages/Reservations';
import Settings from './pages/Settings';
import SubscriptionManager from './pages/SubscriptionManager';

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <CartProvider>
          <Router>
            <div className="min-h-screen bg-charcoal text-white transition-colors duration-300">
              <Navbar />
              <Toaster position="top-right" />
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/signin" element={<SignIn />} />
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
                <Route path="/order-history" element={
                  <AuthGuard>
                    <OrderHistory />
                  </AuthGuard>
                } />
                <Route path="/help" element={
                  <AuthGuard>
                    <Help />
                  </AuthGuard>
                } />
                <Route path="/reservation" element={
                  <AuthGuard>
                    <Reservations />
                  </AuthGuard>
                } />
                <Route path="/track/:id" element={
                  <AuthGuard>
                    <TrackOrderPage />
                  </AuthGuard>
                } />
                <Route path="/settings" element={
                  <AuthGuard>
                    <Settings />
                  </AuthGuard>
                } />
                <Route path="/subscriptions" element={
                  <AuthGuard>
                    <SubscriptionManager />
                  </AuthGuard>
                } />
                <Route path="/admin" element={<AdminDashboard />} />
              </Routes>
            </div>
          </Router>
        </CartProvider>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
