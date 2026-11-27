// Blocks the request unless someone is logged in (FR-02)
export function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Please log in to continue' });
  }
  next();
}

// Blocks the request unless the logged-in user has one of the allowed roles (FR-05, NFR-08).
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Please log in to continue' });
    }
    if (!allowedRoles.includes(req.session.user.role)) {
      return res.status(403).json({ error: 'You do not have permission to access this page' });
    }
    next();
  };
}