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

// Connect to MongoDB
connectDB();

const app = express();
const server = http.createServer(app);
const io = init(server); // Initialize Socket.io for real-time communication

// ======================
// 🔒 SECURITY & RATE LIMIT
// ======================
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: 'Too many requests, please try again later',
});
app.use('/api/', limiter);

// ======================
// ⚙️ MIDDLEWARE
// ======================

// Webhook route (must come before express.json)
const webhookRoutes = require('./routes/webhookRoutes');
app.use('/api/webhooks/clerk', webhookRoutes);

// Body parser
app.use(express.json());

// ✅ CORS: supports local dev + deployed frontend/admin
const allowedOrigins = [
  'http://localhost:5173', // client dev
  'http://localhost:5174', // admin dev
  process.env.FRONTEND_URL, // deployed client
  process.env.ADMIN_URL     // deployed admin
];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// Security headers
app.use(helmet());

// Logger for development
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ======================
// 📦 ROUTES
// ======================
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const reservationRoutes = require('./routes/reservationRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/payments', paymentRoutes);

// ======================
// 🏠 ROOT ROUTE
// ======================
app.get('/', (req, res) => {
  res.send('AK-7 REST API is running (Production Ready 🚀)');
});

// ======================
// ❌ ERROR HANDLING
// ======================
app.use((req, res, next) => {
  res.status(404);
  next(new Error(`Not Found - ${req.originalUrl}`));
});
app.use(errorHandler);

// ======================
// 🚀 START SERVER
// ======================
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});