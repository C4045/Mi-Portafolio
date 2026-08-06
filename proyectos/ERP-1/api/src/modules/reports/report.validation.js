import { z } from 'zod';

export const reportQuerySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.string().optional(),
  type: z.string().optional(),
  search: z.string().optional(),
  entity: z.string().optional(),
});
