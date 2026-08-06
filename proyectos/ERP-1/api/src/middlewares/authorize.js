import { ForbiddenError } from '../errors/UnauthorizedError.js';

export function authorize(...allowedRoles) {
  return (req, _res, next) => {
    const userRoles = req.user.roles.map((r) => r.name);
    const hasRole = allowedRoles.some((role) => userRoles.includes(role));

    if (!hasRole) {
      return next(new ForbiddenError('No tienes permisos para esta acción'));
    }

    next();
  };
}

export function requirePermission(permissionName) {
  return (req, _res, next) => {
    if (!req.user.permissions.includes(permissionName)) {
      if (!req.user.roles.some((r) => r.name === 'admin')) {
        return next(new ForbiddenError(`Requiere permiso: ${permissionName}`));
      }
    }

    next();
  };
}
