import { Worker, Job } from 'bullmq';
import { redisConfig } from '../config/redis';
import { NotificationService } from '../modules/notifications/notification.service';
import { NotificationJobData } from '../queues/notification.queue';
import logger from '../config/logger';

const notificationService = new NotificationService();

export const notificationWorker = new Worker<NotificationJobData>(
  'notification_queue',
  async (job: Job<NotificationJobData>) => {
    logger.info(`NotificationWorker: Processing job ${job.id} for user ${job.data.userId}`);
    await notificationService.createNotificationDirect(job.data.userId, job.data.data);
  },
  {
    connection: redisConfig,
    concurrency: 5,
  }
);

notificationWorker.on('completed', (job) => {
  logger.info(`NotificationWorker: Job ${job.id} completed successfully.`);
});

notificationWorker.on('failed', (job, error) => {
  logger.error(`NotificationWorker: Job ${job?.id} failed with error:`, error);
});

export default notificationWorker;
