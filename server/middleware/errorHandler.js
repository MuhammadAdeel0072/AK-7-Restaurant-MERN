const errorHandler = (err, req, res, next) => {
  // Log the error for debugging
  console.error('🔥 ERROR:', {
    message: err.message,
    status: err.status || 500,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Determine status code
  const statusCode = err.status || (res.statusCode === 200 ? 500 : res.statusCode);

  // Safe response - don't expose stack traces
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = { errorHandler };
