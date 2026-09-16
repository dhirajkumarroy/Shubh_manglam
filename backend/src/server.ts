import { Server } from 'http';
import app from './app';
import { env } from './config/env';
import { connectDb, prisma } from './config/database';
import logger from './config/logger';
import { emailWorker } from './workers/email.worker';
import { notificationWorker } from './workers/notification.worker';
import { redisConnection } from './config/redis';

let server: Server;

// Handle uncaught synchronous exceptions to prevent silent crashes
process.on('uncaughtException', (error: Error) => {
  logger.error(`CRITICAL: Uncaught Exception: ${error.message}\nStack: ${error.stack}`);
  logger.info('Shutting down server due to uncaught exception...');
  process.exit(1);
});

// Handle unhandled asynchronous promise rejections
process.on('unhandledRejection', (reason: any) => {
  logger.error(`CRITICAL: Unhandled Promise Rejection: ${reason}`);
  logger.info('Shutting down server due to unhandled rejection...');
  process.exit(1);
});

const bootstrap = async (): Promise<void> => {
  try {
    // 1. Establish connection with the database
    await connectDb();

    // 2. Start the HTTP Express Server
    server = app.listen(env.PORT, () => {
      logger.info(`===================================================`);
      logger.info(`🚀 Server is successfully running in [${env.NODE_ENV}] mode.`);
      logger.info(`📡 Listening on Port: http://localhost:${env.PORT}`);
      logger.info(`📖 Swagger Docs:      http://localhost:${env.PORT}/api-docs`);
      logger.info(`===================================================`);
    });
  } catch (error) {
    logger.error('❌ Failed to start the server:', error);
    process.exit(1);
  }
};

// Graceful shutdown logic when getting termination signals
const handleGracefulShutdown = (signal: string) => {
  logger.info(`\nReceived ${signal}. Starting graceful shutdown...`);
  
  if (server) {
    server.close(async () => {
      logger.info('HTTP server closed.');
      
      // Close Workers, Redis, and Database
      try {
        await emailWorker.close();
        logger.info('Email queue worker stopped.');
        await notificationWorker.close();
        logger.info('Notification queue worker stopped.');
        await redisConnection.quit();
        logger.info('Redis connection disconnected.');
        await prisma.$disconnect();
        logger.info('Database connection closed gracefully.');
        process.exit(0);
      } catch (err) {
        logger.error('Error during graceful shutdown:', err);
        process.exit(1);
      }
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));
process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));

// Start bootstrapping the server
bootstrap();
