import { prisma } from '../../config/database.js';

export class PermissionRepository {
  async findAllGrouped() {
    const perms = await prisma.permission.findMany({ orderBy: [{ module: 'asc' }, { action: 'asc' }] });
    const grouped = {};
    for (const p of perms) {
      if (!grouped[p.module]) grouped[p.module] = [];
      grouped[p.module].push(p);
    }
    return grouped;
  }

  async findAll() {
    return prisma.permission.findMany({ orderBy: [{ module: 'asc' }, { action: 'asc' }] });
  }

  async findById(id) {
    return prisma.permission.findUnique({ where: { id } });
  }

  async findByName(name) {
    return prisma.permission.findUnique({ where: { name } });
  }

  async create(data) {
    return prisma.permission.create({ data });
  }

  async delete(id) {
    return prisma.permission.delete({ where: { id } });
  }
}
