import { prisma } from '../../config/database.js';

export class AccountRepository {
  async findTree(companyId) {
    const all = await prisma.accountChart.findMany({ where: { companyId }, orderBy: { code: 'asc' } });
    const map = {};
    const roots = [];
    for (const a of all) { map[a.id] = { ...a, children: [] }; }
    for (const a of Object.values(map)) {
      if (a.parentId && map[a.parentId]) map[a.parentId].children.push(a);
      else roots.push(a);
    }
    return roots;
  }

  async findAll(companyId) {
    return prisma.accountChart.findMany({ where: { companyId }, orderBy: { code: 'asc' } });
  }

  async findById(id, companyId) {
    return prisma.accountChart.findFirst({ where: { id, companyId } });
  }

  async findByCode(code, companyId) {
    return prisma.accountChart.findFirst({ where: { code, companyId } });
  }

  async create(data) {
    return prisma.accountChart.create({ data });
  }

  async update(id, data) {
    return prisma.accountChart.update({ where: { id }, data });
  }

  async delete(id) {
    return prisma.accountChart.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}
