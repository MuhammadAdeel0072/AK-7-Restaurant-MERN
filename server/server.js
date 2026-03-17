const express = require('express');
const http = require('http');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/db');
const socketHandler = require('./socket/index');
const { notFound } = require('./middleware/notFound');
const { errorMiddleware } = require('./middleware/errorMiddleware');
const rateLimit = require('express-rate-limit');

dotenv.config();

connectDB();

const app = express();
const server = http.createServer(app);
const io = socketHandler(server);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes',
});

app.use('/api/', limiter);

// Attach io to req for use in controllers
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Webhook Routes (MUST be before express.json() for raw body verification)
const webhookRoutes = require('./routes/webhookRoutes');
app.use('/api/webhooks/clerk', webhookRoutes);

app.use(express.json());
app.use(cors());
app.use(helmet());
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Routes
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const userRoutes = require('./routes/userRoutes');
const reservationRoutes = require('./routes/reservationRoutes');
const loyaltyRoutes = require('./routes/loyaltyRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const cartRoutes = require('./routes/cartRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/loyalty', loyaltyRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/payments', paymentRoutes);

app.get('/', (req, res) => {
  res.send('AK-7 REST API is running...');
});

// Middleware
app.use(notFound);
app.use(errorMiddleware);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
