import { z } from 'zod';
import { notificationQuerySchema } from './notification.validation';

export type NotificationQueryDto = z.infer<typeof notificationQuerySchema>;
