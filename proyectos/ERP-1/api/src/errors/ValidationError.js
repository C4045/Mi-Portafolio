import { AppError } from './AppError.js';

export class ValidationError extends AppError {
  constructor(message = 'Error de validación', details = null) {
    super(message, 400, details);
  }
}
