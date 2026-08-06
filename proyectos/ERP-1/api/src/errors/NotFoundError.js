import { AppError } from './AppError.js';

export class NotFoundError extends AppError {
  constructor(resource = 'Recurso', id = '') {
    const msg = id ? `${resource} con ID ${id} no encontrado` : `${resource} no encontrado`;
    super(msg, 404);
  }
}
