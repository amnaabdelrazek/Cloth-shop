class AppError extends Error {
    constructor(message, statusCode) {
      super(message);
  
      this.statusCode = statusCode;
      this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
      this.isOperational = true; // Distinguish operational errors from programming errors
  
      // Capture stack trace (excluding constructor call from the stack trace)
      Error.captureStackTrace(this, this.constructor);
    }
  
    // Static method to create common error types
    static badRequest(message = 'Invalid request data') {
      return new AppError(message, 400);
    }
  
    static unauthorized(message = 'Not authorized') {
      return new AppError(message, 401);
    }
  
    static forbidden(message = 'Access forbidden') {
      return new AppError(message, 403);
    }
  
    static notFound(message = 'Resource not found') {
      return new AppError(message, 404);
    }
  
    static conflict(message = 'Resource already exists') {
      return new AppError(message, 409);
    }
  
    static internalError(message = 'Internal server error') {
      return new AppError(message, 500);
    }
  }
  
  module.exports = AppError;