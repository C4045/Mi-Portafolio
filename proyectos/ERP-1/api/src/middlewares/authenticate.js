import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { UnauthorizedError } from '../errors/UnauthorizedError.js';
import { prisma } from '../config/database.js';

export async function authenticate(req, _res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Token no proporcionado');
    }

    const token = authHeader.split(' ')[1];
    const payload = jwt.verify(token, env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: { permission: true },
                },
              },
            },
          },
        },
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedError('Usuario no activo o no existe');
    }

    req.user = {
      id: user.id,
      email: user.email,
      companyId: user.companyId,
      sucursalId: user.sucursalId,
      roles: user.roles.map((ur) => ({
        id: ur.role.id,
        name: ur.role.name,
        level: ur.role.level,
      })),
      permissions: user.roles.flatMap((ur) =>
        ur.role.permissions.map((rp) => rp.permission.name)
      ),
    };

    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return next(error);
    }
    if (error.name === 'TokenExpiredError') {
      return next(new UnauthorizedError('Token expirado'));
    }
    if (error.name === 'JsonWebTokenError') {
      return next(new UnauthorizedError('Token inválido'));
    }
    logger.error(`Auth error: ${error.message}`);
    return next(new UnauthorizedError('Error de autenticación'));
  }
}
