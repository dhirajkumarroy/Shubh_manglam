import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import morgan from 'morgan';
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

import { env } from './config/env';
import logger from './config/logger';
import { errorMiddleware } from './middlewares/error.middleware';
import { rateLimiter } from './middlewares/rate-limit.middleware';
import indexRouter from './routes/index.routes';
import { NotFoundError } from './common/utils/app-error';

import { randomUUID } from 'crypto';
import { redisConnection } from './config/redis';
import { prisma } from './config/database';

const app: Application = express();

// 1. Unique Request ID Middleware
app.use((req: any, _res: Response, next: NextFunction) => {
  req.id = req.headers['x-request-id'] || randomUUID();
  next();
});

// 2. Security Headers Middleware
app.use(helmet());

// 3. Cross-Origin Resource Sharing
const allowedOrigins = [
  env.ADMIN_WEB_ORIGIN,
  env.CUSTOMER_APP_ORIGIN,
  env.PROVIDER_APP_ORIGIN,
  'http://localhost:5173',
  'http://localhost:8081',
  'http://localhost:8082',
  'http://localhost:3000',
  'http://localhost:5000',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      if (env.NODE_ENV === 'development') return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS policy does not allow access from origin: ${origin}`));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'x-request-id',
      'x-device-id',
      'x-device-type',
    ],
    credentials: true,
  })
);

// 4. Request Body Parsing
app.use(
  express.json({
    limit: '10mb',
    verify: (req: any, _res: any, buf: Buffer) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 5. HTTP Request Logging Middleware (Morgan piped into Winston)
const morganStream = {
  write: (message: string) => logger.http(message.trim()),
};
morgan.token('id', (req: any) => req.id);
const morganMiddleware = morgan(
  ':remote-addr - [:id] - :method :url :status :res[content-length] - :response-time ms',
  { stream: morganStream }
);
app.use(morganMiddleware);

// 6. Global Health Check Endpoint (Mounted before prefix and rate limiter to avoid blocks)
app.get('/health', async (_req: Request, res: Response) => {
  try {
    // Check DB
    await prisma.$queryRaw`SELECT 1`;
    // Check Redis
    await redisConnection.ping();

    res.status(200).json({
      status: 'healthy',
    });
  } catch (error) {
    logger.error('Health Check Failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// 7. Global Rate Limiter
app.use(env.API_PREFIX, rateLimiter);

// 6. Swagger API Documentation Configuration
const swaggerOptions: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Shubh Mangalam API Documentation',
      version: '1.0.0',
      description: 'REST API for the Shubh Mangalam Celebration & Event Services Marketplace',
    },
    servers: [
      {
        url: `http://localhost:${env.PORT}${env.API_PREFIX}`,
        description: 'Local development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token in the format: Bearer <token>',
        },
      },
    },
  },
  // Include paths to search for OpenAPI decorators
  apis: ['./src/routes/*.ts', './src/routes/*.js', './src/modules/**/*.ts', './src/modules/**/*.js'],
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// 7. Serve Static Uploaded Files
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// 8. Base Routes
app.use(env.API_PREFIX, indexRouter);

// Redirect root URL to swagger docs for premium dev UX
app.get('/', (_req: Request, res: Response) => {
  res.redirect('/api-docs');
});

// 8. Catch-all for unhandled routes -> throws NotFoundError
app.use((req: Request, _res: Response, next: NextFunction) => {
  next(new NotFoundError(`Requested path '${req.originalUrl}' not found.`));
});

// 9. Centralized Error Handling Middleware (must be registered last)
app.use(errorMiddleware);

export default app;
