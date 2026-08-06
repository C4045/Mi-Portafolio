import { logger } from '../config/logger.js';
import { AppError } from '../errors/AppError.js';
import { errorResponse } from '../utils/response.js';

export function errorHandler(err, req, res, _next) {
  if (err instanceof AppError) {
    logger.warn(`${err.name}: ${err.message}`, {
      statusCode: err.statusCode,
      path: req.path,
      method: req.method,
      ...(err.details && { details: err.details }),
    });

    return errorResponse(res, err.message, err.statusCode, err.details);
  }

  if (err.name === 'ZodError') {
    const details = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    logger.warn(`Validation error on ${req.path}: ${JSON.stringify(details)}`);
    return errorResponse(res, 'Error de validación', 400, details);
  }

  if (err.code === 'P2002') {
    const field = err.meta?.target?.[0] || 'campo';
    return errorResponse(res, `El ${field} ya existe`, 409);
  }

  if (err.code === 'P2025') {
    return errorResponse(res, 'Recurso no encontrado', 404);
  }

  logger.error(`Unhandled error on ${req.method} ${req.path}: ${err.message}`, {
    stack: err.stack,
  });

  return errorResponse(res, 'Error interno del servidor', 500);
}
