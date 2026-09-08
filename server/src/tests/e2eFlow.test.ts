import '../config/env';
import { CustomerRepository } from '../repositories/customer.repository';
import { CustomerNotificationRepository } from '../repositories/customerNotification.repository';
import { EntityDbService } from '../services/entityDb.service';
import { WallService } from '../services/wall.service';
import { PROCESS_CODES } from '../constants/processCodes';

describe('End-to-End Notification Flows', () => {
  let customerRepo: CustomerRepository;
  let notificationRepo: CustomerNotificationRepository;
  let entityDbService: EntityDbService;
  let wallService: WallService;

  beforeAll(async () => {
    customerRepo = CustomerRepository.getInstance();
    notificationRepo = CustomerNotificationRepository.getInstance();
    entityDbService = new EntityDbService(notificationRepo);
    wallService = new WallService(entityDbService);
  });

  describe('Pagination and Filtering', () => {
    it('fetches paginated customer dataset from database', async () => {
      const paginatedResult = await customerRepo.findPaginated({ page: 1, limit: 10 });
      expect(paginatedResult.items.length).toBeGreaterThan(0);
      expect(paginatedResult.totalCount).toBeGreaterThanOrEqual(12);
    });

    it('filters customers by musteriNo', async () => {
      const searchResult = await customerRepo.findPaginated({ page: 1, limit: 10, search: '10000001' });
      expect(searchResult.items).toHaveLength(1);
      expect(searchResult.items[0].musteriNo).toBe('10000001');
    });
  });

  describe('Unconsented Customer Flow', () => {
    it('rejects unconsented request and avoids audit persistence', async () => {
      const s1Response = await wallService.processNotification({
        musteriNo: '10000004',
        musteriAdi: 'Kemal',
        musteriSoyadi: 'Yılmaz',
        musteriTckn: '39201948501',
        musteriDurumu: 'Musteri',
        subeKod: '0512',
        subeAdi: 'Kızılay Şubesi',
        kullandirilabilirUrun: 'Kredi Kartı',
        epostaOnay: false,
        smsOnay: false,
        dijitalBelgeSurecOnay: false,
        islemYapanSicil: 'P10842',
      } as any);

      expect(s1Response.islemKodu).toBe(PROCESS_CODES.REJECTED_NO_CONSENT);
      const s1DbCheck = await entityDbService.getByMusteriNo('10000004');
      expect(s1DbCheck).toBeNull();
    });
  });

  describe('Branch Redirection Flow', () => {
    it('returns branch redirection and persists audit log', async () => {
      const s2Response = await wallService.processNotification({
        musteriNo: '10000002',
        musteriAdi: 'Ayşe',
        musteriSoyadi: 'Demir',
        musteriTckn: '49201948572',
        musteriDurumu: 'Musteri',
        subeKod: '0218',
        subeAdi: 'Maslak Ticari Şube',
        kullandirilabilirUrun: 'Bireysel Kredi',
        epostaOnay: true,
        smsOnay: false,
        dijitalBelgeSurecOnay: false,
        islemYapanSicil: 'P10842',
      } as any);

      expect(s2Response.islemKodu).toBe(PROCESS_CODES.APPROVED_BRANCH_CALL);
      const s2DbCheck = await entityDbService.getByMusteriNo('10000002');
      expect(s2DbCheck).not.toBeNull();
      expect(s2DbCheck?.isActive).toBe(true);
    });
  });

  describe('Digital Flow and Transactional Outbox', () => {
    const s3CorrelationId = `E2E_CORR_S3_${Date.now()}`;

    it('completes digital flow and writes audit record', async () => {
      const s3Response = await wallService.processNotification(
        {
          musteriNo: '10000001',
          musteriAdi: 'Mehmet',
          musteriSoyadi: 'Kaya',
          musteriTckn: '28491048294',
          musteriDurumu: 'Musteri',
          subeKod: '0104',
          subeAdi: 'Levent Kurumsal Şube',
          kullandirilabilirUrun: 'Kredi Kartı',
          epostaOnay: true,
          smsOnay: true,
          dijitalBelgeSurecOnay: true,
          islemYapanSicil: 'P10842',
        } as any,
        s3CorrelationId
      );

      expect(s3Response.islemKodu).toBe(PROCESS_CODES.APPROVED_DIGITAL);
      const s3DbCheck = await entityDbService.getByMusteriNo('10000001');
      expect(s3DbCheck).not.toBeNull();
      expect(s3DbCheck?.bildirimDurumu).toBe('Yapıldı');
    });

    it('creates outbox message atomically with PENDING status', async () => {
      const outboxRepo = entityDbService.getOutboxRepository();
      const outboxList = await outboxRepo.findByCorrelationId(s3CorrelationId);
      expect(outboxList).toHaveLength(1);
      expect(outboxList[0].status).toBe('PENDING');
      expect((outboxList[0].payload as any).channel).toBe('DIGITAL');
    });

    it('lists all audit logs accurately with valid timestamps', async () => {
      const allLogs = await entityDbService.getAllAuditLogs();
      expect(allLogs.length).toBeGreaterThanOrEqual(2);
      expect(new Date(allLogs[0].kayitZmn).getTime()).toBeGreaterThan(0);
    });
  });

  describe('Sequential Customer History', () => {
    it('appends audit log events without mutating history', async () => {
      const testMusteriNo = '10000001';
      const initialHistory = await entityDbService.getHistoryByMusteriNo(testMusteriNo);
      const initialCount = initialHistory.length;

      const secondCorrelationId = `E2E_CORR_SEQ_${Date.now()}`;
      await wallService.processNotification(
        {
          musteriNo: testMusteriNo,
          musteriAdi: 'Mehmet',
          musteriSoyadi: 'Kaya',
          musteriTckn: '28491048294',
          musteriDurumu: 'Musteri',
          subeKod: '0104',
          subeAdi: 'Levent Kurumsal Şube',
          kullandirilabilirUrun: 'Kredi Kartı',
          epostaOnay: true,
          smsOnay: true,
          dijitalBelgeSurecOnay: true,
          islemYapanSicil: 'P10842',
        } as any,
        secondCorrelationId
      );

      const updatedHistory = await entityDbService.getHistoryByMusteriNo(testMusteriNo);
      expect(updatedHistory.length).toBe(initialCount + 1);
      expect(updatedHistory[0].guncellemeZmn).toBeDefined();
    });
  });
});
