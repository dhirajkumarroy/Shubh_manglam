import { Router } from 'express';
import { ResponseDto } from '../common/dto/api-response.dto';
import authRouter from '../modules/auth/auth.routes';
import userRouter from '../modules/users/user.routes';
import notificationRouter from '../modules/notifications/notification.routes';
import adminRouter from '../modules/admin/admin.routes';

const router = Router();

/**
 * @openapi
 * /health:
 *   get:
 *     summary: Get API health status
 *     description: Checks if the application server is up and running.
 *     responses:
 *       200:
 *         description: Server is healthy and running.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Server is healthy and running.
 */
router.get('/health', (_req, res) => {
  res.status(200).json(
    ResponseDto.success('Server is healthy and running.', {
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    })
  );
});

// Shubh Mangalam Core Routes
router.use('/auth', authRouter);
router.use('/users', userRouter);
router.use('/notifications', notificationRouter);
router.use('/admin', adminRouter);

export default router;
