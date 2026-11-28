// Shared helpers used by every route file.

// Creates an error with an HTTP status. The error handler sends err.message to the user
// for 4xx errors (user mistakes) and hides it for 5xx errors (server bugs).
export function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

//validates req.body with a Zod schema (NFR-05).
// On success, req.body is replaced with the cleaned data (trimmed, lowercased, defaults applied).
// Usage: router.post('/', validate(mySchema), handler)
export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error.issues[0].message });
    }
    req.body = result.data;
    next();
  };
}

// Turns a URL id like "/api/users/7" into the number 7, or throws a 400 if it isn't a valid id.
export function parseId(value) {
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1) throw httpError(400, 'Invalid ID');
  return id;
}

// Turns "2026-11-27" into a Date. endOfDay=true gives 23:59:59 so "to" dates include the whole day.
export function parseDate(value, endOfDay = false) {
  if (!value) return undefined;
  const date = new Date(`${value}T${endOfDay ? '23:59:59.999' : '00:00:00'}`);
  if (Number.isNaN(date.getTime())) throw httpError(400, 'Dates must use the format YYYY-MM-DD');
  return date;
}