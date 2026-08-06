import { prisma } from '../../config/database.js';

export class PaymentMethodRepository {
  async findAll(companyId) {
    return prisma.paymentMethod.findMany({ where: { companyId }, orderBy: { name: 'asc' } });
  }

  async findById(id, companyId) {
    return prisma.paymentMethod.findFirst({ where: { id, companyId } });
  }

  async findByCode(code, companyId) {
    return prisma.paymentMethod.findFirst({ where: { code, companyId } });
  }

  async create(data) {
    return prisma.paymentMethod.create({ data });
  }

  async update(id, data) {
    return prisma.paymentMethod.update({ where: { id }, data });
  }
}
