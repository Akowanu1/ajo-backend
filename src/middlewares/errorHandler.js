import { sendError } from '../utils/apiResponse.js';

// Runs when no route matched. Register it after all routes in app.js.
export const notFound = (req, res) =>
  sendError(res, 404, `Route not found: ${req.originalUrl}`);

// Converts any error into the standard JSON response.
// Register it last in app.js. It must keep all four parameters.
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  const isProduction = process.env.NODE_ENV === 'production';
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';

  if (err.name === 'ValidationError' && err.errors) {
    // Mongoose schema validation failed
    statusCode = 400;
    message = Object.values(err.errors).map((e) => e.message).join(', ');
  } else if (err.name === 'CastError') {
    // Bad ObjectId or wrong value type
    statusCode = 400;
    message = `Invalid ${err.path === '_id' ? 'ID' : err.path}`;
  } else if (err.code === 11000) {
    // Duplicate key (unique index)
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'value';
    message = `${field} already exists`;
  } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Invalid or expired token';
  } else if (err.type === 'entity.parse.failed') {
    // Malformed JSON in the request body
    statusCode = 400;
    message = 'Invalid JSON in request body';
  }

  // Log server errors with the stack; never send the stack to the client
  if (statusCode >= 500) {
    console.error(err.stack || err);
    if (isProduction) message = 'Internal server error';
  }

  return sendError(res, statusCode, message);
};
