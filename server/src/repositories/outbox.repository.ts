import { prisma } from '../config/prisma';
import { Prisma, OutboxMessage } from '@prisma/client';

export interface CreateOutboxMessageDTO {
  eventType: string;
  payload: any;
  correlationId?: string;
}

export interface IOutboxRepository {
  createTransactional(
    tx: Prisma.TransactionClient,
    data: CreateOutboxMessageDTO
  ): Promise<OutboxMessage>;
  findPending(limit?: number): Promise<OutboxMessage[]>;
  fetchAndLockPending(
    tx: Prisma.TransactionClient,
    limit?: number
  ): Promise<OutboxMessage[]>;
  markPublished(id: string): Promise<OutboxMessage>;
  markPublishedTransactional(
    tx: Prisma.TransactionClient,
    id: string
  ): Promise<OutboxMessage>;
  markFailed(id: string, reason: string, retryCount: number): Promise<OutboxMessage>;
  markFailedTransactional(
    tx: Prisma.TransactionClient,
    id: string,
    reason: string,
    retryCount: number
  ): Promise<OutboxMessage>;
  findByCorrelationId(correlationId: string): Promise<OutboxMessage[]>;
}

export class OutboxRepository implements IOutboxRepository {
  private static instance: OutboxRepository;

  private constructor() {}

  public static getInstance(): OutboxRepository {
    if (!OutboxRepository.instance) {
      OutboxRepository.instance = new OutboxRepository();
    }
    return OutboxRepository.instance;
  }

  /**
   * ACID Transaction içinde Outbox tablosuna event yazar.
   */
  public async createTransactional(
    tx: Prisma.TransactionClient,
    data: CreateOutboxMessageDTO
  ): Promise<OutboxMessage> {
    return await tx.outboxMessage.create({
      data: {
        eventType: data.eventType,
        payload: data.payload,
        correlationId: data.correlationId,
        status: 'PENDING',
        retryCount: 0,
      },
    });
  }

  /**
   * PENDING durumundaki mesajları ilk oluşturulma sırasına göre getirir.
   */
  public async findPending(limit: number = 20): Promise<OutboxMessage[]> {
    return await prisma.outboxMessage.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });
  }

  /**
   * PostgreSQL SELECT ... FOR UPDATE SKIP LOCKED
   * Dağıtık mimaride birden fazla relay/worker instance'ı aynı anda çalıştığında
   * kilitlenmeyi (deadlock) ve aynı mesajın birden fazla işlenmesini önler.
   */
  public async fetchAndLockPending(
    tx: Prisma.TransactionClient,
    limit: number = 10
  ): Promise<OutboxMessage[]> {
    return await tx.$queryRaw<OutboxMessage[]>`
      SELECT id, "eventType", payload, "correlationId", status, "retryCount", "errorReason", "createdAt", "processedAt"
      FROM outbox_messages
      WHERE status = 'PENDING'
      ORDER BY "createdAt" ASC
      LIMIT ${limit}
      FOR UPDATE SKIP LOCKED;
    `;
  }

  /**
   * Mesajın RabbitMQ tarafından onaylandığını (ACK) kaydeder.
   */
  public async markPublished(id: string): Promise<OutboxMessage> {
    return await prisma.outboxMessage.update({
      where: { id },
      data: {
        status: 'PUBLISHED',
        processedAt: new Date(),
      },
    });
  }

  public async markPublishedTransactional(
    tx: Prisma.TransactionClient,
    id: string
  ): Promise<OutboxMessage> {
    return await tx.outboxMessage.update({
      where: { id },
      data: {
        status: 'PUBLISHED',
        processedAt: new Date(),
      },
    });
  }

  /**
   * Gönderilemeyen veya hata alan mesajın durumunu ve hata nedenini günceller.
   */
  public async markFailed(
    id: string,
    reason: string,
    retryCount: number
  ): Promise<OutboxMessage> {
    const isTerminal = retryCount >= 5;
    return await prisma.outboxMessage.update({
      where: { id },
      data: {
        status: isTerminal ? 'FAILED' : 'PENDING',
        retryCount,
        errorReason: reason,
        processedAt: isTerminal ? new Date() : null,
      },
    });
  }

  public async markFailedTransactional(
    tx: Prisma.TransactionClient,
    id: string,
    reason: string,
    retryCount: number
  ): Promise<OutboxMessage> {
    const isTerminal = retryCount >= 5;
    return await tx.outboxMessage.update({
      where: { id },
      data: {
        status: isTerminal ? 'FAILED' : 'PENDING',
        retryCount,
        errorReason: reason,
        processedAt: isTerminal ? new Date() : null,
      },
    });
  }

  public async findByCorrelationId(correlationId: string): Promise<OutboxMessage[]> {
    return await prisma.outboxMessage.findMany({
      where: { correlationId },
      orderBy: { createdAt: 'asc' },
    });
  }
}
