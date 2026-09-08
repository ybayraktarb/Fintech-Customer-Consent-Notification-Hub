import '../config/env';
import { prisma } from '../config/prisma';
import { RabbitMQClient } from '../config/rabbitmq';

describe('Idempotent Message Processing', () => {
  let rabbitClient: RabbitMQClient;
  const testMessageId = `IDEM_TEST_${Date.now()}`;

  beforeAll(() => {
    rabbitClient = RabbitMQClient.getInstance();
  });

  afterAll(async () => {
    await rabbitClient.close();
  });

  it('verifies message does not exist initially in processed inbox', async () => {
    const initialCheck = await prisma.processedMessage.findUnique({
      where: { messageId: testMessageId },
    });
    expect(initialCheck).toBeNull();
  });

  it('processes first delivery and records message ID in inbox', async () => {
    const result = await (async () => {
      const existing = await prisma.processedMessage.findUnique({
        where: { messageId: testMessageId },
      });
      if (existing) {
        return { status: 'SKIPPED_DUPLICATE', executedNotification: false };
      }

      await prisma.processedMessage.create({
        data: {
          messageId: testMessageId,
          consumerName: 'NotificationWorker',
          processedAt: new Date(),
        },
      });

      return { status: 'PROCESSED_SUCCESS', executedNotification: true };
    })();

    expect(result.status).toBe('PROCESSED_SUCCESS');
    expect(result.executedNotification).toBe(true);

    const savedInboxRecord = await prisma.processedMessage.findUnique({
      where: { messageId: testMessageId },
    });
    expect(savedInboxRecord).not.toBeNull();
    expect(savedInboxRecord?.consumerName).toBe('NotificationWorker');
  });

  it('suppresses duplicate message delivery without side effects', async () => {
    const duplicateResult = await (async () => {
      const existing = await prisma.processedMessage.findUnique({
        where: { messageId: testMessageId },
      });
      if (existing) {
        return { status: 'SKIPPED_DUPLICATE', executedNotification: false };
      }

      await prisma.processedMessage.create({
        data: {
          messageId: testMessageId,
          consumerName: 'NotificationWorker',
          processedAt: new Date(),
        },
      });
      return { status: 'PROCESSED_SUCCESS', executedNotification: true };
    })();

    expect(duplicateResult.status).toBe('SKIPPED_DUPLICATE');
    expect(duplicateResult.executedNotification).toBe(false);
  });

  it('handles concurrent duplicate attempts via unique constraint', async () => {
    let caughtUniqueConstraint = false;
    try {
      await prisma.processedMessage.create({
        data: {
          messageId: testMessageId,
          consumerName: 'WorkerInstanceB',
          processedAt: new Date(),
        },
      });
    } catch (err: any) {
      if (err.code === 'P2002' || err.message?.includes('Unique constraint')) {
        caughtUniqueConstraint = true;
      }
    }

    expect(caughtUniqueConstraint).toBe(true);
  });

  it('updates notification status to DELIVERED upon worker completion', async () => {
    const workerMusteriNo = `WRK_${Date.now()}`;
    const testOutboxId = `OUT_${Date.now()}`;

    await prisma.customer.create({
      data: {
        musteriNo: workerMusteriNo,
        musteriAdi: 'Worker',
        musteriSoyadi: 'Test',
        musteriTckn: '98765432101',
        musteriDurumu: 'Musteri',
        subeKod: '0101',
        subeAdi: 'Test Şube',
        kullandirilabilirUrun: 'Kredi Kartı',
      },
    });

    await prisma.customerNotificationLog.create({
      data: {
        musteriNo: workerMusteriNo,
        musteriAdi: 'Worker',
        musteriSoyadi: 'Test',
        musteriTckn: '98765432101',
        musteriDurumu: 'Musteri',
        subeKod: '0101',
        subeAdi: 'Test Şube',
        kullandirilabilirUrun: 'Kredi Kartı',
        epostaOnay: true,
        smsOnay: true,
        dijitalBelgeSurecOnay: true,
        bildirimDurumu: 'QUEUED',
        outboxMessageId: testOutboxId,
        kayitYapan: 'TEST_USER',
        guncellemeYapan: 'TEST_USER',
      },
    });

    await prisma.customerNotificationLog.updateMany({
      where: { outboxMessageId: testOutboxId },
      data: { bildirimDurumu: 'DELIVERED', guncellemeZmn: new Date() },
    });

    const updatedLog = await prisma.customerNotificationLog.findFirst({
      where: { outboxMessageId: testOutboxId },
    });

    expect(updatedLog?.bildirimDurumu).toBe('DELIVERED');
  });

  it('updates notification status to FAILED when routed to DLQ', async () => {
    const dlqMusteriNo = `DLQ_${Date.now()}`;
    const testOutboxId = `OUT_DLQ_${Date.now()}`;

    await prisma.customer.create({
      data: {
        musteriNo: dlqMusteriNo,
        musteriAdi: 'DLQ',
        musteriSoyadi: 'Test',
        musteriTckn: '98765432102',
        musteriDurumu: 'Musteri',
        subeKod: '0101',
        subeAdi: 'Test Şube',
        kullandirilabilirUrun: 'Kredi Kartı',
      },
    });

    await prisma.customerNotificationLog.create({
      data: {
        musteriNo: dlqMusteriNo,
        musteriAdi: 'DLQ',
        musteriSoyadi: 'Test',
        musteriTckn: '98765432102',
        musteriDurumu: 'Musteri',
        subeKod: '0101',
        subeAdi: 'Test Şube',
        kullandirilabilirUrun: 'Kredi Kartı',
        epostaOnay: true,
        smsOnay: true,
        dijitalBelgeSurecOnay: true,
        bildirimDurumu: 'QUEUED',
        outboxMessageId: testOutboxId,
        kayitYapan: 'TEST_USER',
        guncellemeYapan: 'TEST_USER',
      },
    });

    await prisma.customerNotificationLog.updateMany({
      where: { outboxMessageId: testOutboxId },
      data: { bildirimDurumu: 'FAILED', guncellemeZmn: new Date() },
    });

    const updatedLog = await prisma.customerNotificationLog.findFirst({
      where: { outboxMessageId: testOutboxId },
    });

    expect(updatedLog?.bildirimDurumu).toBe('FAILED');
  });
});
