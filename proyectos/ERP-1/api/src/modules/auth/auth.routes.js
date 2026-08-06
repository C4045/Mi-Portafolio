import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { AuthController } from './auth.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Demasiados intentos, intente nuevamente en 15 minutos' },
  standardHeaders: true,
  legacyHeaders: false,
});

const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { success: false, message: 'Demasiadas solicitudes de renovación de token' },
  standardHeaders: true,
  legacyHeaders: false,
});

const router = Router();
const controller = new AuthController();

router.post('/login', authLimiter, controller.login.bind(controller));
router.post('/register', authLimiter, controller.register.bind(controller));
router.post('/refresh', refreshLimiter, controller.refresh.bind(controller));

router.use(authenticate);
router.post('/logout', controller.logout.bind(controller));
router.get('/me', controller.me.bind(controller));
router.put('/profile', controller.updateProfile.bind(controller));
router.put('/change-password', controller.changePassword.bind(controller));

export { router as authRoutes };
