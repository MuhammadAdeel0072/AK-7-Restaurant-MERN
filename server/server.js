const express = require('express');
const http = require('http');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const path = require('path');
const connectDB = require('./config/db');
const { init } = require('./services/socketService');
const { initSubscriptionScheduler } = require('./services/SubscriptionService');
const { errorHandler } = require('./middleware/errorHandler');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

// Database connection is handled in startServer()

const app = express();
const server = http.createServer(app);
const io = init(server);

// Initialize Subscription Scheduler
initSubscriptionScheduler();

// ======================
// ⚙️ CORE BRIDGE & HANDSHAKE (ABSOLUTE TOP)
// ======================
// ======================
// ⚙️ CORE BRIDGE & HANDSHAKE (ABSOLUTE TOP)
// ======================
app.use(cors({
  origin: "*",
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// ======================
// 🔒 SECURITY & RATE LIMIT
// ======================
const limter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,
  message: {
    status: 429,
    message: 'System Protocol: Rate limit exceeded. Please stand by.',
  },
});
app.use('/api/', limter);

// Security headers - Relaxed for cross-origin development
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginEmbedderPolicy: false
}));

// Logger for development
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ======================
// 📦 ROUTES
// ======================
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const reservationRoutes = require('./routes/reservationRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const chefRoutes = require('./routes/chefRoutes');
const riderRoutes = require('./routes/riderRoutes');
const cartRoutes = require('./routes/cartRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const dealRoutes = require('./routes/dealRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const reportRoutes = require('./routes/reportRoutes');
const staffRoutes = require('./routes/staffRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const recommendationRoutes = require('./routes/recommendationRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');

// Diagnostic: Verify all routes are correctly loaded
console.log('--- Initializing Dynamic Route Protocols ---');
[
  { name: 'Auth', handler: authRoutes },
  { name: 'Admin', handler: adminRoutes },
  { name: 'Analytics', handler: analyticsRoutes },
  { name: 'Product', handler: productRoutes },
  { name: 'Category', handler: categoryRoutes },
  { name: 'Deal', handler: dealRoutes },
  { name: 'Order', handler: orderRoutes },
  { name: 'Reservation', handler: reservationRoutes },
  { name: 'Payment', handler: paymentRoutes },
  { name: 'Chef', handler: chefRoutes },
  { name: 'Rider', handler: riderRoutes },
  { name: 'Cart', handler: cartRoutes }
].forEach(route => {
  if (!route.handler || typeof route.handler !== 'function') {
    console.error(`❌ CRITICAL: ${route.name} Route Handler is INVALID (${typeof route.handler})`);
  } else {
    console.log(`✅ ${route.name} Route Protocol: Online`);
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/deals', dealRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/chef', chefRoutes);
app.use('/api/rider', riderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/schedule', scheduleRoutes);

// ======================
// 🏠 ROOT ROUTE
// ======================
app.get('/', (req, res) => {
  res.send('DineXis API is running');
});

// Diagnostic Health Check
app.get('/api/health', (req, res) => res.json({ status: 'Server is running 🚀' }));

// ======================
// ❌ ERROR HANDLING
// ======================
// 404 catch-all (must be after all routes)
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found', path: req.originalUrl });
});

// Error handler middleware (must be last)
app.use(errorHandler);

// ======================
// 🚀 START SERVER — Dynamic Port Fallback
// ======================
const PORT = process.env.PORT || 5000;

const startServer = async (port) => {
  try {
    // Database connection (only on first attempt)
    if (port === PORT) {
      console.log('🔄 Initializing Database Connection...');
      await connectDB();
    }

    server.listen(port, () => {
      console.log(`✅ Server running on port ${port}`);
      console.log(`✅ Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log('✅ System Protocol: All systems operational.\n');
    });

    server.once("error", (err) => {
      if (err.code === "EADDRINUSE") {
        console.log(`⚠️ Port ${port} busy, switching to ${Number(port) + 1}`);
        startServer(Number(port) + 1);
      } else {
        console.error('❌ Unexpected server error:', err);
      }
    });
  } catch (error) {
    console.error('❌ Server startup failed:', error.message);
    process.exit(1);
  }
};

startServer(PORT);