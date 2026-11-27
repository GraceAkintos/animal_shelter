//404 error when http request is made to a route that doesn't exist
export function notFound(req, res) {
  res.status(404).json({error: 'Not found'});
}

//This runs when a route throws an error
export function errorHandler(err, req, res, next) {
  console.error('[${new Date().toISOString()}] ${req.method} ${req.originalUrl}', err);

  const status = err.status || 500;
  const message = status < 500 ? err.message : 'Something went wrong. Please try again :(';

  res.status(status).json({error: message});
}