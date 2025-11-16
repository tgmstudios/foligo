/**
 * Retry logic with exponential backoff for API calls
 */

const { GeminiAPIError } = require('./errors');
const { RETRY_CONFIG } = require('./gemini-config');

/**
 * Check if an error is retryable
 */
const isRetryableError = (error) => {
  if (!error) return false;
  
  const errorCode = error.code || error.statusCode || '';
  const errorMessage = error.message || '';
  
  return RETRY_CONFIG.retryableErrors.some(retryableCode => 
    errorCode.toString().includes(retryableCode) ||
    errorMessage.includes(retryableCode)
  );
};

/**
 * Calculate delay with exponential backoff and jitter
 */
const calculateDelay = (attemptNumber) => {
  const baseDelay = RETRY_CONFIG.initialDelayMs * Math.pow(RETRY_CONFIG.backoffMultiplier, attemptNumber);
  const cappedDelay = Math.min(baseDelay, RETRY_CONFIG.maxDelayMs);
  
  // Add jitter (random value between 0 and 25% of delay)
  const jitter = Math.random() * cappedDelay * 0.25;
  
  return Math.floor(cappedDelay + jitter);
};

/**
 * Sleep for specified milliseconds
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {Object} options - Retry options
 * @param {Object} logger - Logger instance
 * @returns {Promise} - Result of the function
 */
const retryWithBackoff = async (fn, options = {}, logger = console) => {
  const {
    maxRetries = RETRY_CONFIG.maxRetries,
    context = 'API call'
  } = options;
  
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        logger.info(`Retry attempt ${attempt}/${maxRetries} for ${context}`);
      }
      
      return await fn();
    } catch (error) {
      lastError = error;
      
      // If this is the last attempt or error is not retryable, throw immediately
      if (attempt >= maxRetries || !isRetryableError(error)) {
        logger.error(`Failed ${context} after ${attempt + 1} attempts`, {
          error: error.message,
          isRetryable: isRetryableError(error)
        });
        throw error;
      }
      
      // Calculate delay and wait
      const delay = calculateDelay(attempt);
      logger.warn(`${context} failed, retrying in ${delay}ms...`, {
        attempt: attempt + 1,
        maxRetries,
        error: error.message
      });
      
      await sleep(delay);
    }
  }
  
  // This should never be reached, but just in case
  throw new GeminiAPIError(`Failed ${context} after ${maxRetries} retries`, lastError);
};

module.exports = {
  retryWithBackoff,
  isRetryableError,
  calculateDelay
};

