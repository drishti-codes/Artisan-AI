// One consistent JSON format for every API response.
//   success: { success: true,  message, data }
//   error:   { success: false, message, errors? }

function sendSuccess(res, data = null, message = 'OK', statusCode = 200) {
  return res.status(statusCode).json({ success: true, message, data });
}

function sendError(res, message = 'Something went wrong', statusCode = 500, errors = undefined) {
  const body = { success: false, message };
  if (errors) body.errors = errors;
  return res.status(statusCode).json(body);
}

module.exports = { sendSuccess, sendError };
