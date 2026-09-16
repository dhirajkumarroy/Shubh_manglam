import { Queue } from 'bullmq';
import { redisConfig } from '../config/redis';
import { NotificationType } from '@prisma/client';

export interface NotificationJobData {
  userId: string;
  data: {
    title: string;
    message: string;
    type: NotificationType;
  };
}

export const notificationQueue = new Queue<NotificationJobData>('notification_queue', {
  connection: redisConfig,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

export default notificationQueue;
