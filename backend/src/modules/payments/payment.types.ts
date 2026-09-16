import { z } from 'zod';
import { createOrderSchema, verifyPaymentSchema, paymentQuerySchema } from './payment.validation';

export type CreateOrderDto = z.infer<typeof createOrderSchema>;
export type VerifyPaymentDto = z.infer<typeof verifyPaymentSchema>;
export type PaymentQueryDto = z.infer<typeof paymentQuerySchema>;
