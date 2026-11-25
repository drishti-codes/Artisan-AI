// Builds the Express app: middleware first, then routes, then error handlers.
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const healthRoutes = require('./modules/health/health.routes');
const authRoutes = require('./modules/auth/auth.routes');
const categoryRoutes = require('./modules/categories/categories.routes');
const artisanRoutes = require('./modules/artisans/artisans.routes');
const storyRoutes = require('./modules/stories/stories.routes');
const productRoutes = require('./modules/products/products.routes');
const cartRoutes = require('./modules/cart/cart.routes');
const orderRoutes = require('./modules/orders/orders.routes');
const paymentRoutes = require('./modules/payments/payments.routes');
const sellerRoutes = require('./modules/seller/seller.routes');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const aiRoutes = require('./modules/ai/ai.routes');

// Security headers
app.use(helmet());

// Allow only our frontend to call this API from the browser
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  })
);

// Read JSON request bodies
app.use(express.json({ limit: '1mb' }));

// Log each request in the terminal
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

// Basic protection against too many requests from one IP
app.use(
  '/api',
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests, please try again later.' },
  })
);

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/artisans', artisanRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/seller', sellerRoutes);
app.use('/api/ai', aiRoutes);

// These two must stay last
app.use(notFound);
app.use(errorHandler);

module.exports = app;
