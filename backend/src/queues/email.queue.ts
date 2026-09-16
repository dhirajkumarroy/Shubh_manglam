import { Queue } from 'bullmq';
import { redisConfig } from '../config/redis';
import { SendEmailOptions } from '../common/utils/send-email';

export const emailQueue = new Queue<SendEmailOptions>('email_queue', {
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

export default emailQueue;
