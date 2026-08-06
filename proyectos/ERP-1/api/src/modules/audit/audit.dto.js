export class AuditLogDTO {
  constructor(log) {
    this.id = log.id;
    this.userId = log.userId;
    this.companyId = log.companyId;
    this.action = log.action;
    this.entity = log.entity;
    this.entityId = log.entityId;
    this.oldValues = log.oldValues;
    this.newValues = log.newValues;
    this.ipAddress = log.ipAddress;
    this.userAgent = log.userAgent;
    this.createdAt = log.createdAt;
    this.user = log.user ? { id: log.user.id, email: log.user.email, firstName: log.user.firstName, lastName: log.user.lastName } : null;
  }
}
