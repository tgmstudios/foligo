/**
 * Wrap an async Express route handler so a rejected promise doesn't need a
 * manual try/catch — logs the error and responds with a generic 500.
 * Extracted from the repeated `try { await fn(...) } catch (error) { ... }`
 * pattern in route handlers.
 */
function asyncHandler(fn) {
  return async (req, res, next) => {
    try {
      await fn(req, res, next);
    } catch (error) {
      console.error(error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred'
      });
    }
  };
}

module.exports = { asyncHandler };
