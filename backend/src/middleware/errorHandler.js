// src/middleware/errorHandler.js
const errorHandler = (err, req, res, next) => {
  // Log real error server‑side (never send to client)
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);

  // Prisma unique constraint violation
  if (err.code === 'P2002') {
    return res.status(409).json({
      error: 'A conflict occurred. Please check your input.',
      code: 'CONFLICT',
    });
  }

  // Validation errors from express-validator
  if (err.type === 'validation') {
    return res.status(400).json({
      error: 'Invalid input. Please check your data.',
      code: 'VALIDATION_ERROR',
      details: err.details,
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Invalid token.', code: 'INVALID_TOKEN' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Token expired.', code: 'TOKEN_EXPIRED' });
  }

  // Generic error — NEVER expose stack traces to client
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: 'Something went wrong. Please try again.',
    code: err.code || 'INTERNAL_ERROR',
  });
};

module.exports = { errorHandler };
