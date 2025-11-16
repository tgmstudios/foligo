/**
 * Custom error classes for Gemini service
 */

class GeminiError extends Error {
  constructor(message, cause) {
    super(message);
    this.name = 'GeminiError';
    this.cause = cause;
    Error.captureStackTrace(this, this.constructor);
  }
}

class GeminiConfigError extends GeminiError {
  constructor(message, cause) {
    super(message, cause);
    this.name = 'GeminiConfigError';
  }
}

class GeminiAPIError extends GeminiError {
  constructor(message, cause, statusCode) {
    super(message, cause);
    this.name = 'GeminiAPIError';
    this.statusCode = statusCode;
  }
}

class GeminiParseError extends GeminiError {
  constructor(message, cause, rawResponse) {
    super(message, cause);
    this.name = 'GeminiParseError';
    this.rawResponse = rawResponse;
  }
}

class GeminiValidationError extends GeminiError {
  constructor(message, cause) {
    super(message, cause);
    this.name = 'GeminiValidationError';
  }
}

module.exports = {
  GeminiError,
  GeminiConfigError,
  GeminiAPIError,
  GeminiParseError,
  GeminiValidationError
};

