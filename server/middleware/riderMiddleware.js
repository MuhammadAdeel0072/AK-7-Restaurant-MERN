const asyncHandler = require('express-async-handler');

const riderMiddleware = asyncHandler(async (req, res, next) => {
    if (req.user && (req.user.role === 'rider' || req.user.role === 'admin')) {
        next();
    } else {
        res.status(403);
        throw new Error('Not authorized as a rider');
    }
});

module.exports = { riderMiddleware };

