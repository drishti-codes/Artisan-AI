// An error with an HTTP status code. The global error handler turns it into a clean JSON response.
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
  }
}
module.exports = AppError;
