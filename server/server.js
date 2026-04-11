const express = require('express');
const http = require('http');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/db');
const { init } = require('./services/socketService');
const { errorHandler } = require('./middleware/errorHandler');

// Load environment variables
dotenv.config();

// Database connection is handled in startServer()

const app = express();
const server = http.createServer(app);
const io = init(server);

// ======================
// ⚙️ CORE BRIDGE & HANDSHAKE (ABSOLUTE TOP)
// ======================
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5176',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    'http://127.0.0.1:5175',
    'http://127.0.0.1:5176'
  ],
  credentials: true,
}));

app.use(express.json());

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

// ======================
// 🏠 ROOT ROUTE
// ======================
app.get('/', (req, res) => {
  res.send('AK-7 REST API is running');
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
// 🚀 START SERVER
// ======================
const PORT = process.env.PORT || 5000;

server.timeout = 60000;

// Handle port conflicts gracefully
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`\n❌ FATAL: Port ${PORT} is already in use!`);
    console.error('Solution: Kill the existing process or use a different PORT.');
    console.error(`\nTo kill the process using port ${PORT}:`);
    console.error('Windows: netstat -ano | findstr :' + PORT);
    console.error('Then: taskkill /PID <PID> /F\n');
    process.exit(1);
  } else {
    console.error('❌ Server crash error:', error);
    process.exit(1);
  }
});

// Main initialization
const startServer = async () => {
  try {
    // Wait for DB to connect before listening
    console.log('🔄 Initializing Database Connection...');
    await connectDB();
    
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
      console.log(`✅ Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log('✅ System Protocol: All systems operational. Awaiting incoming data streams.');
    });
  } catch (error) {
    console.error('❌ Failed to connect to database. Server will not start:', error.message);
    process.exit(1);
  }
};

startServer();