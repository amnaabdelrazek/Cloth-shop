/**
 * Wraps an async function to catch errors and pass them to Express error handling middleware
 * @param {Function} fn The async function to wrap
 * @returns {Function} A middleware function that handles errors
 */
const catchAsync = (fn) => (req, res, next) => {
    // Resolve the returned promise and catch any errors
    Promise.resolve(fn(req, res, next)).catch((err) => {
      // Enhance error object with additional context
      err.requestInfo = {
        method: req.method,
        path: req.path,
        params: req.params,
        query: req.query,
        timestamp: new Date().toISOString()
      };
  
      // Pass the error to Express error handling middleware
      next(err);
    });
  };
  
  // Alternative version with more detailed error context
  const catchAsyncWithContext = (fn, context) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((err) => {
      err.context = {
        ...context,
        route: `${req.method} ${req.path}`,
        user: req.user?._id,
        timestamp: new Date().toISOString()
      };
      next(err);
    });
  };
  
  module.exports = (fn) => (req, res, next) => {
    fn(req, res, next).catch(next);
  };