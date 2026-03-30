const isChef = (req, res, next) => {
  if (req.user && (req.user.role === 'chef' || req.user.role === 'admin' || req.user.role === 'staff')) {
    next();
  } else {
    res.status(401);
    throw new Error('Not authorized as an kitchen professional (Chef)');
  }
};

module.exports = { isChef };
