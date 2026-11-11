function requirePremium(req, res, next) {
  const u = req.user;
  if (u.plan === 'premium' && u.plan_expires_at > new Date()) return next();
  res.status(403).json({ error: 'Premium venum' });
}

module.exports = requirePremium;