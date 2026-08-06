import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { env, logger } from './config/index.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { auditContext } from './middlewares/auditContext.js';
import { routes } from './routes/index.js';

const app = express();

app.use(helmet());
app.use(compression());
app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(auditContext);

app.use('/api/v1', routes);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

app.listen(env.PORT, () => {
  logger.info(`ERP-1 API running on port ${env.PORT} in ${env.NODE_ENV} mode`);
});

export default app;
