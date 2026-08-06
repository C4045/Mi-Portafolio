import { z } from 'zod';

export const createUserSchema = z.object({
  username: z.string().min(3).max(100),
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  phone: z.string().max(50).optional(),
  sucursalId: z.string().uuid().optional(),
  roleIds: z.array(z.string().uuid()).optional(),
});

export const updateUserSchema = z.object({
  username: z.string().min(3).max(100).optional(),
  email: z.string().email().optional(),
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  phone: z.string().max(50).optional(),
  sucursalId: z.string().uuid().optional(),
  isActive: z.boolean().optional(),
});

export const assignRolesSchema = z.object({
  roleIds: z.array(z.string().uuid()),
});

export const userQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  isActive: z.coerce.boolean().optional(),
});
