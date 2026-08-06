import { z } from 'zod';

export const createPermissionSchema = z.object({
  module: z.string().min(2).max(50),
  action: z.string().min(2).max(50),
  description: z.string().max(200).optional(),
});
