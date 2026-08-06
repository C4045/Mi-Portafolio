import { prisma } from '../config/database.js';
import { logger } from '../config/logger.js';
import { auditStorage } from '../middlewares/auditContext.js';

export async function createAuditLog({ userId, companyId, action, entity, entityId, oldValues, newValues, ipAddress, userAgent }) {
  try {
    const ctx = auditStorage.getStore();
    await prisma.auditLog.create({
      data: {
        userId,
        companyId,
        action,
        entity,
        entityId,
        oldValues: oldValues || null,
        newValues: newValues || null,
        ipAddress: ipAddress || ctx?.ipAddress || null,
        userAgent: userAgent || ctx?.userAgent || null,
      },
    });
  } catch (error) {
    logger.error(`Failed to create audit log: ${error.message}`);
  }
}
