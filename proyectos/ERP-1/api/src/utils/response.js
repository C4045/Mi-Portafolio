export function successResponse(res, data = null, message = 'OK', statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

export function createdResponse(res, data = null, message = 'Creado exitosamente') {
  return successResponse(res, data, message, 201);
}

export function paginatedResponse(res, data, pagination) {
  return res.status(200).json({
    success: true,
    message: 'OK',
    data,
    pagination,
  });
}

export function errorResponse(res, message = 'Error interno', statusCode = 500, details = null) {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(details && { details }),
  });
}
