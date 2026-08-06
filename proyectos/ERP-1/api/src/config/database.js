import { PrismaClient } from '@prisma/client';
import { logger } from './logger.js';

const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'event', level: 'error' },
    { emit: 'event', level: 'info' },
    { emit: 'event', level: 'warn' },
  ],
});

prisma.$on('error', (e) => logger.error(`Prisma error: ${e.message}`));
prisma.$on('warn', (e) => logger.warn(`Prisma warn: ${e.message}`));

if (process.env.NODE_ENV !== 'production') {
  prisma.$on('query', (e) => logger.debug(`Query: ${e.query} [${e.params}]`));
}

export { prisma };
