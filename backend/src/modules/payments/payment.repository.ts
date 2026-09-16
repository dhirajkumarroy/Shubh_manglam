import { Payment, PaymentStatus } from '@prisma/client';
import prisma from '../../config/database';

export class PaymentRepository {
  /**
   * Creates a new pending payment order tracking record.
   */
  async createPayment(data: {
    requestId: string;
    userId: string;
    amount: number;
    providerOrderId: string;
  }): Promise<Payment> {
    return prisma.payment.create({
      data: {
        requestId: data.requestId,
        userId: data.userId,
        amount: data.amount,
        providerOrderId: data.providerOrderId,
        status: PaymentStatus.PENDING,
      },
    });
  }

  /**
   * Finds payment record by Razorpay Order ID.
   */
  async findByOrderId(providerOrderId: string): Promise<Payment | null> {
    return prisma.payment.findUnique({
      where: { providerOrderId },
    });
  }

  /**
   * Finds payment record by database UUID.
   */
  async findById(id: string): Promise<Payment | null> {
    return prisma.payment.findUnique({
      where: { id },
    });
  }

  /**
   * Finds any successful payment record for a request.
   */
  async findSuccessPaymentByRequestId(requestId: string): Promise<Payment | null> {
    return prisma.payment.findFirst({
      where: {
        requestId,
        status: PaymentStatus.SUCCESS,
      },
    });
  }

  /**
   * Updates status and metadata on a payment record using its Razorpay Order ID.
   */
  async updatePaymentStatusByOrderId(
    providerOrderId: string,
    status: PaymentStatus,
    metadata?: {
      providerPaymentId?: string;
      providerSignature?: string;
      paidAt?: Date;
    }
  ): Promise<Payment> {
    return prisma.payment.update({
      where: { providerOrderId },
      data: {
        status,
        providerPaymentId: metadata?.providerPaymentId,
        providerSignature: metadata?.providerSignature,
        paidAt: metadata?.paidAt,
      },
    });
  }

  /**
   * Updates status and metadata on a payment record using its database UUID.
   */
  async updatePaymentStatusById(
    id: string,
    status: PaymentStatus,
    metadata?: {
      providerPaymentId?: string;
      providerSignature?: string;
      paidAt?: Date;
    }
  ): Promise<Payment> {
    return prisma.payment.update({
      where: { id },
      data: {
        status,
        providerPaymentId: metadata?.providerPaymentId,
        providerSignature: metadata?.providerSignature,
        paidAt: metadata?.paidAt,
      },
    });
  }

  /**
   * Lists paginated payments for a specific user.
   */
  async listByUserId(
    userId: string,
    page: number,
    limit: number
  ): Promise<{ total: number; payments: Payment[] }> {
    const where = { userId };
    const [total, payments] = await prisma.$transaction([
      prisma.payment.count({ where }),
      prisma.payment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          transportRequest: {
            include: {
              assignedVehicle: true
            }
          }
        }
      })
    ]);
    return { total, payments };
  }
}

export default PaymentRepository;
