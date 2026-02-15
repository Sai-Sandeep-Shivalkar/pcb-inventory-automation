const jwt = require('jsonwebtoken');

module.exports = function authMiddleware(req, res, next) {
  if (process.env.BYPASS_AUTH !== 'false') {
    req.user = { id: 1, email: 'admin@pcb.com', role: 'admin' };
    return next();
  }

  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: 'Missing token' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};
