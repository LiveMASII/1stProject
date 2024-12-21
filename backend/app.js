const express = require('express');
require('express-async-errors');
const morgan = require('morgan');
const cors = require('cors');
const csurf = require('csurf');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const { restoreUser } = require('./utils/auth');
const { environment } = require('./config');
const routes = require('./routes'); // Import the routes file
const spotsRouter = require('./routes/api/spots');

const app = express();

const isProduction = environment === 'production';

app.use(morgan('dev'));
app.use(cookieParser());
app.use(express.json());
app.use('/api/spots', spotsRouter);


if (!isProduction) {
  app.use(cors());
}

app.use(
  helmet.crossOriginResourcePolicy({
    policy: 'cross-origin',
  })
);

app.use(restoreUser);

app.use(
  csurf({
    cookie: {
      secure: isProduction,
      sameSite: isProduction && 'Lax',
      httpOnly: true,
    },
  })
);

// Use the routes
app.use(routes);

// Catch-all handler for 404 errors if route is not found
app.use((_req, _res, next) => {
  const err = new Error("The requested resource couldn't be found.");
  err.title = 'Resource Not Found';
  err.errors = { message: "The requested resource couldn't be found." };
  err.status = 404;
  next(err);
});

// Validation and general error handling
app.use((err, _req, _res, next) => {
  if (err instanceof ValidationError) {
    let errors = {};
    for (let error of err.errors) {
      errors[error.path] = error.message;
    }
    err.title = 'Validation error';
    err.errors = errors;
  }
  next(err);
});

// Final error handler for sending the error response
app.use((err, _req, res, _next) => {
  res.status(err.status || 500);
  console.error(err);
  res.json({
    title: err.title || 'Server Error',
    message: err.message,
    errors: err.errors,
    stack: isProduction ? null : err.stack,
  });
});

module.exports = app;
