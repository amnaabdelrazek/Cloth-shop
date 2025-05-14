const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
//const cookieParser = require('cookie-parser');
const compression = require('compression');
const config = require('./config/env');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

// Import routes
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const productRouter = require('./routes/productRoutes');
const orderRouter = require('./routes/orderrouter');

// Initialize Express app
const app = express();

// // بعد const app = express();
// app.set('view engine', 'ejs'); // أو 'pug' إذا كنت تستخدمه
// app.set('views', path.join(__dirname, 'views')); // تأكد من استيراد path

// 1. GLOBAL MIDDLEWARES
// ---------------------

// Enable CORS (Cross-Origin Resource Sharing)
app.use(cors({ 
  origin: config.frontendUrl,
  credentials: true 
}));
app.options('*', cors()); // Enable pre-flight for all routes

const cookieParser = require('cookie-parser');
//app.use(cookieParser());
// Set security HTTP headers
app.use(helmet());

// Development logging
if (config.env === 'development') {
  app.use(morgan('dev'));
}

// Limit requests from same IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again in 15 minutes'
});
app.use('/api', limiter);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(hpp({
  whitelist: [ // Allow duplicate parameters for these
    'price',
    'ratingsAverage',
    'ratingsQuantity'
  ]
}));

// Compress responses
app.use(compression());

// 2. ROUTES
// ---------
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/products', productRouter);
app.use('/api/v1/orders', orderRouter);

// 3. ERROR HANDLING
// -----------------

// Handle undefined routes
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global error handling middleware
app.use(globalErrorHandler);

module.exports = app;