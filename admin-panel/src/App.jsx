import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import AdminLayout from './components/AdminLayout';
import Dashboard from './pages/Dashboard';
import MenuManagement from './pages/MenuManagement';
import DealManagement from './pages/DealManagement';
import OrderManagement from './pages/OrderManagement';
import ReservationManagement from './pages/ReservationManagement';
import PaymentManagement from './pages/PaymentManagement';
import StaffManagement from './pages/StaffManagement';
import UserManagement from './pages/UserManagement';
import ReportManagement from './pages/ReportManagement';
import MealSchedule from './pages/MealSchedule';
import Login from './pages/Login';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';

const ProtectedRoute = ({ children }) => {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) return (
    <div className="min-h-screen bg-[#0f1115] flex items-center justify-center">
      <div className="w-10 h-10 border-3 border-gold border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (!isSignedIn) return <Navigate to="/login" />;

  return children;
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Toaster position="top-right" />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route path="/" element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Dashboard />} />
              <Route path="/menu" element={<MenuManagement />} />
              <Route path="/deals" element={<DealManagement />} />
              <Route path="/orders" element={<OrderManagement />} />
              <Route path="/schedule" element={<MealSchedule />} />
              <Route path="/reservations" element={<ReservationManagement />} />
              <Route path="/payments" element={<PaymentManagement />} />
              <Route path="/staff" element={<StaffManagement />} />
              <Route path="/users" element={<UserManagement />} />
              <Route path="/reports" element={<ReportManagement />} />
            </Route>

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;

