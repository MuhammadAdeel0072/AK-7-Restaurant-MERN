import { Routes, Route, Navigate } from "react-router-dom";
import ChefLayout from "./components/ChefLayout";
import Dashboard from "./pages/Dashboard";
import ActiveOrders from "./pages/ActiveOrders";
import OrderDetails from "./pages/OrderDetails";
import ReadyQueue from "./pages/ReadyQueue";
import Alerts from "./pages/Alerts";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import { AlertProvider } from "./context/AlertContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Toaster } from "react-hot-toast";

const ProtectedRoute = ({ children }) => {
  const { isSignedIn, isLoaded } = useAuth();
  
  if (!isLoaded) return (
    <div className="min-h-screen bg-[#121212] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
  
  if (!isSignedIn) return <Navigate to="/login" />;
  
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route element={
          <ProtectedRoute>
            <AlertProvider>
              <ChefLayout />
            </AlertProvider>
          </ProtectedRoute>
        }>
          <Route path="/" element={<Dashboard />} />
          <Route path="/orders" element={<ActiveOrders />} />
          <Route path="/orders/:id" element={<OrderDetails />} />
          <Route path="/ready" element={<ReadyQueue />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;

