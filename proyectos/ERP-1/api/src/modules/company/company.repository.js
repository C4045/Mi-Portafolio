import { prisma } from '../../config/database.js';

export class CompanyRepository {
  async findById(id) {
    return prisma.company.findUnique({
      where: { id },
      include: {
        sucursales: { where: { deletedAt: null }, orderBy: { name: 'asc' } },
      },
    });
  }

  async update(id, data) {
    return prisma.company.update({
      where: { id },
      data,
    });
  }

  async createSucursal(data) {
    return prisma.sucursal.create({ data });
  }

  async findSucursalById(id, companyId) {
    return prisma.sucursal.findFirst({
      where: { id, companyId, deletedAt: null },
    });
  }

  async findSucursalByCode(code, companyId) {
    return prisma.sucursal.findFirst({
      where: { code, companyId, deletedAt: null },
    });
  }

  async updateSucursal(id, data) {
    return prisma.sucursal.update({
      where: { id },
      data,
    });
  }

  async softDeleteSucursal(id, deletedBy) {
    return prisma.sucursal.update({
      where: { id },
      data: { deletedAt: new Date(), deletedBy },
    });
  }

  async listSucursales(companyId) {
    return prisma.sucursal.findMany({
      where: { companyId, deletedAt: null },
      orderBy: { name: 'asc' },
    });
  }
}
