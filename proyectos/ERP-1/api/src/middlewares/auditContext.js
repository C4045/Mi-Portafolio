import { AsyncLocalStorage } from 'async_hooks';

export const auditStorage = new AsyncLocalStorage();

export function auditContext(req, _res, next) {
  const store = {
    ipAddress: req.ip || req.connection?.remoteAddress,
    userAgent: req.headers['user-agent'],
  };
  auditStorage.run(store, next);
}