import { AppError } from './AppError.js';

export class ConflictError extends AppError {
  constructor(message = 'Conflicto - el recurso ya existe') {
    super(message, 409);
  }
}
