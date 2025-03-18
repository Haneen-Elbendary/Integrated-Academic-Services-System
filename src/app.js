const express = require('express');
const compression = require('compression');
const path = require('path');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const sanitizeHtml = require('sanitize-html');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/globalErrorHandler');

const studentRouter = require('./routes/studentRoutes');
const employeeRouter = require('./routes/employeeRoutes');
const adminRouter = require('./routes/adminRoutes');
const userRouter = require('./routes/userRoutes');

const app = express();

// Security Headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", 'https://js.stripe.com'],
        connectSrc: ["'self'", 'https://js.stripe.com'],
        frameSrc: ["'self'", 'https://js.stripe.com'],
      },
    },
  })
);

// Development Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Rate Limiting
app.use(
  '/api',
  rateLimit({
    max: 100,
    windowMs: 60 * 60 * 1000,
    message: 'Too many requests, please try again later.',
  })
);

// Middleware
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());
app.use(mongoSanitize());

// Custom middleware to sanitize user inputs
const sanitizeMiddleware = (req, res, next) => {
  if (req.body) {
    for (let key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = sanitizeHtml(req.body[key]);
      }
    }
  }
  next();
};
app.use(sanitizeMiddleware);

// Prevent HTTP Parameter Pollution
app.use(
  hpp({
    whitelist: [
      'name',
      'email',
      'department',
      'college_id',
      'serviceType',
      'requestStatus',
      'paymentStatus',
      'examResults',
      'schedule',
      'labLocation',
      'role',
      'fees',
      'createdAt',
      'updatedAt',
    ],
  })
);

app.use(compression());

// Static Files
app.use(express.static(path.join(__dirname, 'public')));

// Routes

app.use('/api/v1/student', studentRouter);
app.use('/api/v1/admin', adminRouter);
app.use('/api/v1/employee', employeeRouter);
app.use('/api/v1/user', userRouter);
// Handle Undefined Routes
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global Error Handler
app.use(globalErrorHandler);

module.exports = app;
