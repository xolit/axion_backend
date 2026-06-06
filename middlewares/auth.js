module.exports = (req, res, next) => {
  const expected = process.env.ACCESS_TOKEN;
  const token = (req.body && req.body.accessToken) || req.headers['x-access-token'] || req.query.accessToken;

  if (!expected) {
    console.warn('ACCESS_TOKEN not set in environment');
    return res.status(500).json({ error: 'Server not configured' });
  }

  if (!token || token !== expected) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};
