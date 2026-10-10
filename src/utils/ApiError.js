// Throw this for any expected error: throw new ApiError(404, 'Group not found');
// The error handler turns it into the standard JSON error response.
class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

export default ApiError;