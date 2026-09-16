import { Worker, Job } from 'bullmq';
import { redisConfig } from '../config/redis';
import { sendEmailDirect, SendEmailOptions } from '../common/utils/send-email';
import logger from '../config/logger';

export const emailWorker = new Worker<SendEmailOptions>(
  'email_queue',
  async (job: Job<SendEmailOptions>) => {
    logger.info(`EmailWorker: Processing job ${job.id} to ${job.data.to}`);
    await sendEmailDirect(job.data);
  },
  {
    connection: redisConfig,
    concurrency: 5,
  }
);

emailWorker.on('completed', (job) => {
  logger.info(`EmailWorker: Job ${job.id} completed successfully.`);
});

emailWorker.on('failed', (job, error) => {
  logger.error(`EmailWorker: Job ${job?.id} failed with error:`, error);
});

export default emailWorker;
