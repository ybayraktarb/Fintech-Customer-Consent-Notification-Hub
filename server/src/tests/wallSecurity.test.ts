import '../config/env';
import { WallService } from '../services/wall.service';
import { EntityDbService } from '../services/entityDb.service';
import { CustomerRepository } from '../repositories/customer.repository';
import { CustomerNotificationRepository } from '../repositories/customerNotification.repository';
import { PROCESS_CODES, PROCESS_MESSAGES } from '../constants/processCodes';
import { NotificationRequestDTO } from '../dtos/notification.dto';

describe('Customer Wall Security', () => {
  let customerRepo: CustomerRepository;
  let entityDbService: EntityDbService;
  let wallService: WallService;

  beforeAll(async () => {
    customerRepo = CustomerRepository.getInstance();
    const repository = CustomerNotificationRepository.getInstance();
    entityDbService = new EntityDbService(repository);
    wallService = new WallService(entityDbService, customerRepo);

    await customerRepo.upsert({
      musteriNo: 'SEC_1001',
      musteriAdi: 'Ahmet',
      musteriSoyadi: 'Yılmaz',
      musteriTckn: '28471928401',
      musteriDurumu: 'Musteri',
      subeKod: '0101',
      subeAdi: 'Kadıköy Şubesi',
      kullandirilabilirUrun: 'Kredi Kartı',
      epostaOnay: false,
      smsOnay: false,
      dijitalBelgeSurecOnay: false,
    });

    await customerRepo.upsert({
      musteriNo: 'SEC_1002',
      musteriAdi: 'Ayşe',
      musteriSoyadi: 'Demir',
      musteriTckn: '39481029482',
      musteriDurumu: 'Musteri',
      subeKod: '0102',
      subeAdi: 'Beşiktaş Şubesi',
      kullandirilabilirUrun: 'Bireysel Kredi',
      epostaOnay: true,
      smsOnay: false,
      dijitalBelgeSurecOnay: false,
    });

    await customerRepo.upsert({
      musteriNo: 'SEC_1003',
      musteriAdi: 'Mehmet',
      musteriSoyadi: 'Kaya',
      musteriTckn: '48201948573',
      musteriDurumu: 'Personel',
      subeKod: '0999',
      subeAdi: 'Genel Müdürlük',
      kullandirilabilirUrun: 'Kredi Kartı',
      epostaOnay: true,
      smsOnay: true,
      dijitalBelgeSurecOnay: true,
    });
  });

  describe('Contact Consent Validation', () => {
    it('rejects notification when contact consent is missing in master DB', async () => {
      const spoofedPayload: NotificationRequestDTO = {
        musteriNo: 'SEC_1001',
        musteriAdi: 'Ahmet',
        musteriSoyadi: 'Yılmaz',
        musteriTckn: '11111111111',
        musteriDurumu: 'Musteri',
        subeKod: '0101',
        subeAdi: 'Kadıköy Şubesi',
        kullandirilabilirUrun: 'Kredi Kartı',
        epostaOnay: true,
        smsOnay: true,
        dijitalBelgeSurecOnay: true,
        islemYapanSicil: 'P10842',
      };

      const result = await wallService.processNotification(spoofedPayload);

      expect(result.islemKodu).toBe(PROCESS_CODES.REJECTED_NO_CONSENT);
      expect(result.islemAck).toBe(PROCESS_MESSAGES[PROCESS_CODES.REJECTED_NO_CONSENT]);

      const auditLog = await entityDbService.getByMusteriNo('SEC_1001');
      expect(auditLog).toBeNull();
    });
  });

  describe('Digital Flow Validation', () => {
    it('routes to branch call when digital consent is false in DB', async () => {
      const spoofedPayload: NotificationRequestDTO = {
        musteriNo: 'SEC_1002',
        musteriAdi: 'Ayşe',
        musteriSoyadi: 'Demir',
        musteriTckn: '22222222222',
        musteriDurumu: 'Musteri',
        subeKod: '0102',
        subeAdi: 'Beşiktaş Şubesi',
        kullandirilabilirUrun: 'Bireysel Kredi',
        epostaOnay: true,
        smsOnay: false,
        dijitalBelgeSurecOnay: true,
        islemYapanSicil: 'P10842',
      };

      const correlationId = `SEC_CORR_${Date.now()}`;
      const result = await wallService.processNotification(spoofedPayload, correlationId);

      expect(result.islemKodu).toBe(PROCESS_CODES.APPROVED_BRANCH_CALL);
      expect(result.islemAck).toBe(PROCESS_MESSAGES[PROCESS_CODES.APPROVED_BRANCH_CALL]);

      const outboxList = await entityDbService.getOutboxRepository().findByCorrelationId(correlationId);
      expect(outboxList).toHaveLength(1);
      expect((outboxList[0].payload as any).channel).toBe('BRANCH_CALL');
    });
  });

  describe('Employee Marketing Restriction', () => {
    it('blocks marketing notifications for bank employees', async () => {
      const spoofedPayload: NotificationRequestDTO = {
        musteriNo: 'SEC_1003',
        musteriAdi: 'Mehmet',
        musteriSoyadi: 'Kaya',
        musteriTckn: '33333333333',
        musteriDurumu: 'Musteri',
        subeKod: '0999',
        subeAdi: 'Genel Müdürlük',
        kullandirilabilirUrun: 'Kredi Kartı',
        epostaOnay: true,
        smsOnay: true,
        dijitalBelgeSurecOnay: true,
        islemYapanSicil: 'P10842',
      };

      const result = await wallService.processNotification(spoofedPayload);

      expect(result.islemKodu).toBe(PROCESS_CODES.RESTRICTED_STAFF);
      expect(result.islemAck).toBe(PROCESS_MESSAGES[PROCESS_CODES.RESTRICTED_STAFF]);

      const auditLog = await entityDbService.getByMusteriNo('SEC_1003');
      expect(auditLog).toBeNull();
    });
  });

  describe('Customer Payload Verification', () => {
    it('persists master DB values instead of client-supplied fields', async () => {
      const correlationId = `SEC_CORR_TAMPER_${Date.now()}`;
      const tamperedPayload: NotificationRequestDTO = {
        musteriNo: 'SEC_1002',
        musteriAdi: 'SAHTE_AD',
        musteriSoyadi: 'SAHTE_SOYAD',
        musteriTckn: '00000000000',
        musteriDurumu: 'Musteri',
        subeKod: '9999',
        subeAdi: 'Sahte Şube',
        kullandirilabilirUrun: 'Bireysel Kredi',
        epostaOnay: true,
        smsOnay: false,
        dijitalBelgeSurecOnay: false,
        islemYapanSicil: 'P10842',
      };

      await wallService.processNotification(tamperedPayload, correlationId);

      const auditLog = await entityDbService.getByMusteriNo('SEC_1002');
      expect(auditLog).not.toBeNull();
      expect(auditLog?.musteriAdi).toBe('Ayşe');
      expect(auditLog?.musteriSoyadi).toBe('Demir');
      expect(auditLog?.musteriTckn).toBe('39481029482');
    });
  });
});
