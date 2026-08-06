import { logger } from '../../config/logger.js';
import { PaymentMethodRepository } from './payment-method.repository.js';
import { PaymentMethodResponseDTO } from './payment-method.dto.js';
import { NotFoundError } from '../../errors/NotFoundError.js';
import { ConflictError } from '../../errors/ConflictError.js';

export class PaymentMethodService {
  constructor() { this.repository = new PaymentMethodRepository(); }

  async findAll(companyId) {
    const methods = await this.repository.findAll(companyId);
    return methods.map((m) => new PaymentMethodResponseDTO(m));
  }

  async findById(id, companyId) {
    const m = await this.repository.findById(id, companyId);
    if (!m) throw new NotFoundError('Método de pago', id);
    return new PaymentMethodResponseDTO(m);
  }

  async create(data, userId, companyId) {
    const existing = await this.repository.findByCode(data.code, companyId);
    if (existing) throw new ConflictError('Ya existe un método de pago con ese código');
    const method = await this.repository.create({ ...data, companyId });
    logger.info(`PaymentMethod ${data.code} created by ${userId}`);
    return new PaymentMethodResponseDTO(method);
  }

  async update(id, data, userId, companyId) {
    const existing = await this.repository.findById(id, companyId);
    if (!existing) throw new NotFoundError('Método de pago', id);
    if (data.code && data.code !== existing.code) {
      const dup = await this.repository.findByCode(data.code, companyId);
      if (dup) throw new ConflictError('Ya existe un método de pago con ese código');
    }
    const updated = await this.repository.update(id, data);
    logger.info(`PaymentMethod ${id} updated by ${userId}`);
    return new PaymentMethodResponseDTO(updated);
  }
}
