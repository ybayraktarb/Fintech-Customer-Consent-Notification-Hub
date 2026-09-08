import '../config/env';
import { correlationIdMiddleware, CORRELATION_HEADER } from '../middlewares/correlationId.middleware';
import { Request, Response } from 'express';
import { WallService } from '../services/wall.service';
import { EntityDbService } from '../services/entityDb.service';
import { NotificationRequestDTO } from '../dtos/notification.dto';

describe('Correlation ID Tracing', () => {
  it('generates UUID when correlation header is absent', () => {
    const mockReq: any = { headers: {} };
    const mockRes: any = {
      headers: {} as Record<string, string>,
      setHeader(key: string, value: string) {
        this.headers[key.toLowerCase()] = value;
      },
    };
    let nextCalled = false;

    correlationIdMiddleware(mockReq as Request, mockRes as Response, () => {
      nextCalled = true;
    });

    expect(nextCalled).toBe(true);
    expect(typeof mockReq.correlationId).toBe('string');
    expect(mockReq.correlationId.length).toBeGreaterThan(0);
    expect(mockRes.headers[CORRELATION_HEADER]).toBe(mockReq.correlationId);
  });

  it('preserves caller-supplied X-Correlation-ID', () => {
    const customId = `UPSTREAM_FINTECH_${Date.now()}`;
    const mockReq: any = { headers: { 'x-correlation-id': customId } };
    const mockRes: any = {
      headers: {} as Record<string, string>,
      setHeader(key: string, value: string) {
        this.headers[key.toLowerCase()] = value;
      },
    };

    correlationIdMiddleware(mockReq as Request, mockRes as Response, () => {});

    expect(mockReq.correlationId).toBe(customId);
    expect(mockRes.headers[CORRELATION_HEADER]).toBe(customId);
  });

  it('propagates correlation ID to outbox event payload', async () => {
    const entityDbService = new EntityDbService();
    const wallService = new WallService(entityDbService);
    const outboxRepo = entityDbService.getOutboxRepository();

    const traceCorrelationId = `E2E_TRACE_${Date.now()}`;
    const testDto: NotificationRequestDTO = {
      musteriNo: '10000001',
      musteriAdi: 'Trace',
      musteriSoyadi: 'Test',
      musteriTckn: '12345678901',
      musteriDurumu: 'Musteri',
      subeKod: '0101',
      subeAdi: 'Merkez Şube',
      kullandirilabilirUrun: 'Kredi Kartı',
      epostaOnay: true,
      smsOnay: true,
      dijitalBelgeSurecOnay: true,
      islemYapanSicil: 'P10842',
    };

    await wallService.processNotification(testDto, traceCorrelationId);

    const outboxRecords = await outboxRepo.findByCorrelationId(traceCorrelationId);
    expect(outboxRecords).toHaveLength(1);
    expect(outboxRecords[0].correlationId).toBe(traceCorrelationId);
  });
});
