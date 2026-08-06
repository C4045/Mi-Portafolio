import { z } from 'zod';

export const createRoleSchema = z.object({
  name: z.string().min(2).max(100),
  displayName: z.string().min(2).max(150),
  description: z.string().optional(),
  level: z.number().int().min(0).max(5).optional(),
  permissionIds: z.array(z.string().uuid()).optional(),
});

export const updateRoleSchema = z.object({
  displayName: z.string().min(2).max(150).optional(),
  description: z.string().optional(),
  level: z.number().int().min(0).max(5).optional(),
});

export const assignPermissionsSchema = z.object({
  permissionIds: z.array(z.string().uuid()),
});

export const roleQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  isActive: z.coerce.boolean().optional(),
});
