// Runs when a request matches no route: returns a clean 404 instead of an HTML page.
export function notFound(req, res) {
  res.status(404).json({ error: 'Not found' });
}

// Runs whenever any route throws an error (NFR-06, NFR-11, NFR-14).
export function errorHandler(err, req, res, next) {
  
  if (err.code === 'P2025') {
    return res.status(404).json({ error: 'Record not found' });
  }

  const status = err.status || 500;
  if (status >= 500) {
    
    console.error(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`, err);
  }

  const message = status < 500 ? err.message : 'Something went wrong. Please try again.';
  res.status(status).json({ error: message });
}