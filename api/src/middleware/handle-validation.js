const { validationResult } = require('express-validator');

/**
 * Express middleware that short-circuits with a 400 if express-validator
 * found validation errors on the request. Extracted from the identical
 * `const errors = validationResult(req); if (!errors.isEmpty()) {...}` block
 * duplicated across ~17 route files. Add as the last entry in a route's
 * validator array, e.g. `[body('name').isString(), handleValidation]`.
 */
function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Invalid input data',
      details: errors.array()
    });
  }
  next();
}

module.exports = { handleValidation };
