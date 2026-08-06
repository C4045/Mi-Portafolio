import { z } from 'zod';

export const updateCompanySchema = z.object({
  name: z.string().min(2).max(255).optional(),
  legalName: z.string().max(255).optional(),
  taxId: z.string().max(50).optional(),
  taxIdType: z.string().max(20).optional(),
  phone: z.string().max(50).optional(),
  email: z.string().email().max(255).optional(),
  address: z.string().optional(),
  city: z.string().max(150).optional(),
  state: z.string().max(150).optional(),
  country: z.string().max(100).optional(),
  currencyCode: z.enum(['PYG', 'USD', 'BRL', 'ARS']).optional(),
  timezone: z.string().max(50).optional(),
  config: z.record(z.any()).optional(),
  logoUrl: z.string().optional(),
  website: z.string().optional(),
});

export const createSucursalSchema = z.object({
  code: z.string().min(1).max(20),
  name: z.string().min(2).max(200),
  address: z.string().optional(),
  phone: z.string().max(50).optional(),
  email: z.string().email().max(255).optional(),
  isHeadquarters: z.boolean().optional(),
});

export const updateSucursalSchema = z.object({
  code: z.string().min(1).max(20).optional(),
  name: z.string().min(2).max(200).optional(),
  address: z.string().optional(),
  phone: z.string().max(50).optional(),
  email: z.string().email().max(255).optional(),
  isHeadquarters: z.boolean().optional(),
  isActive: z.boolean().optional(),
});
