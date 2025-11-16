/**
 * Structured logger using Winston
 */

const winston = require('winston');

const logLevel = process.env.LOG_LEVEL || 'info';
const isProduction = process.env.NODE_ENV === 'production';

// Custom format for better readability
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.printf(({ level, message, timestamp, stack, ...metadata }) => {
    let msg = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    
    // Add metadata if present
    if (Object.keys(metadata).length > 0) {
      msg += ` ${JSON.stringify(metadata)}`;
    }
    
    // Add stack trace if present
    if (stack) {
      msg += `\n${stack}`;
    }
    
    return msg;
  })
);

// Console transport for development
const consoleTransport = new winston.transports.Console({
  format: winston.format.combine(
    winston.format.colorize(),
    customFormat
  )
});

// File transport for production
const fileTransport = new winston.transports.File({
  filename: 'logs/gemini-service.log',
  format: winston.format.combine(
    winston.format.uncolorize(),
    customFormat
  ),
  maxsize: 5242880, // 5MB
  maxFiles: 5
});

const errorFileTransport = new winston.transports.File({
  filename: 'logs/gemini-error.log',
  level: 'error',
  format: winston.format.combine(
    winston.format.uncolorize(),
    customFormat
  ),
  maxsize: 5242880, // 5MB
  maxFiles: 5
});

// Create logger instance
const logger = winston.createLogger({
  level: logLevel,
  format: customFormat,
  transports: isProduction
    ? [fileTransport, errorFileTransport, consoleTransport]
    : [consoleTransport],
  exitOnError: false
});

// Create child logger for Gemini service with context
const createGeminiLogger = (context = {}) => {
  return logger.child({ service: 'gemini', ...context });
};

module.exports = {
  logger,
  createGeminiLogger
};

