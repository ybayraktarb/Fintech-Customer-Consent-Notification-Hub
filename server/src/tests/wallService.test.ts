import '../config/env';
import { WallService } from '../services/wall.service';
import { EntityDbService } from '../services/entityDb.service';
import { CustomerRepository } from '../repositories/customer.repository';
import { CustomerNotificationRepository } from '../repositories/customerNotification.repository';
import { PROCESS_CODES, PROCESS_MESSAGES } from '../constants/processCodes';
import { NotificationRequestDTO } from '../dtos/notification.dto';

describe('Wall Service Decision Engine', () => {
  let customerRepo: CustomerRepository;
  let entityDbService: EntityDbService;
  let wallService: WallService;

  beforeAll(async () => {
    customerRepo = CustomerRepository.getInstance();
    const repository = CustomerNotificationRepository.getInstance();
    entityDbService = new EntityDbService(repository);
    wallService = new WallService(entityDbService);

    await customerRepo.upsert({
      musteriNo: '10000001',
      musteriAdi: 'Örnek',
      musteriSoyadi: 'Müşteri 1',
      musteriTckn: '28491048294',
      musteriDurumu: 'Musteri',
      subeKod: '0104',
      subeAdi: 'Levent Kurumsal Şube',
      kullandirilabilirUrun: 'Kredi Kartı',
      epostaOnay: true,
      smsOnay: true,
      dijitalBelgeSurecOnay: true,
    });

    await customerRepo.upsert({
      musteriNo: '10000002',
      musteriAdi: 'Örnek',
      musteriSoyadi: 'Müşteri 2',
      musteriTckn: '49201948572',
      musteriDurumu: 'Musteri',
      subeKod: '0218',
      subeAdi: 'Maslak Ticari Şube',
      kullandirilabilirUrun: 'Bireysel Kredi',
      epostaOnay: true,
      smsOnay: false,
      dijitalBelgeSurecOnay: false,
    });
  });

  describe('Consent Rejection', () => {
    const reqNoConsent: NotificationRequestDTO = {
      musteriNo: '10000004',
      musteriAdi: 'Örnek',
      musteriSoyadi: 'Müşteri 4',
      musteriTckn: '39201948501',
      musteriDurumu: 'Musteri',
      subeKod: '0512',
      subeAdi: 'Kızılay Şubesi',
      kullandirilabilirUrun: 'Kredi Kartı',
      epostaOnay: false,
      smsOnay: false,
      dijitalBelgeSurecOnay: false,
      islemYapanSicil: 'P10842',
    };

    it('rejects unconsented requests with REJECTED_NO_CONSENT', async () => {
      const res = await wallService.processNotification(reqNoConsent);
      expect(res.islemKodu).toBe(PROCESS_CODES.REJECTED_NO_CONSENT);
      expect(res.islemAck).toBe(PROCESS_MESSAGES[PROCESS_CODES.REJECTED_NO_CONSENT]);
    });

    it('does not persist audit log when consent is missing', async () => {
      const dbRecord = await entityDbService.getByMusteriNo('10000004');
      expect(dbRecord).toBeNull();
    });
  });

  describe('Branch Redirection', () => {
    const reqBranch: NotificationRequestDTO = {
      musteriNo: '10000002',
      musteriAdi: 'Örnek',
      musteriSoyadi: 'Müşteri 2',
      musteriTckn: '49201948572',
      musteriDurumu: 'Musteri',
      subeKod: '0218',
      subeAdi: 'Maslak Ticari Şube',
      kullandirilabilirUrun: 'Bireysel Kredi',
      epostaOnay: true,
      smsOnay: false,
      dijitalBelgeSurecOnay: false,
      islemYapanSicil: 'P10842',
    };
    const correlationId = `CORR_TEST_002_${Date.now()}`;

    it('returns branch call process code when digital consent is missing', async () => {
      const res = await wallService.processNotification(reqBranch, correlationId);
      expect(res.islemKodu).toBe(PROCESS_CODES.APPROVED_BRANCH_CALL);
      expect(res.islemAck).toBe(PROCESS_MESSAGES[PROCESS_CODES.APPROVED_BRANCH_CALL]);
    });

    it('persists notification record with operator ID', async () => {
      const dbRecord = await entityDbService.getByMusteriNo('10000002');
      expect(dbRecord).not.toBeNull();
      expect(dbRecord?.isActive).toBe(true);
      expect(dbRecord?.kayitYapan).toBe('P10842');
      expect(dbRecord?.bildirimDurumu).toBe('Yapıldı');
    });

    it('creates branch call outbox event atomically', async () => {
      const outboxRepo = entityDbService.getOutboxRepository();
      const outboxList = await outboxRepo.findByCorrelationId(correlationId);
      expect(outboxList).toHaveLength(1);
      expect(outboxList[0].status).toBe('PENDING');
      expect((outboxList[0].payload as any).channel).toBe('BRANCH_CALL');
    });
  });

  describe('Digital Flow', () => {
    const reqDigital: NotificationRequestDTO = {
      musteriNo: '10000001',
      musteriAdi: 'Örnek',
      musteriSoyadi: 'Müşteri 1',
      musteriTckn: '28491048294',
      musteriDurumu: 'Musteri',
      subeKod: '0104',
      subeAdi: 'Levent Kurumsal Şube',
      kullandirilabilirUrun: 'Kredi Kartı',
      epostaOnay: true,
      smsOnay: true,
      dijitalBelgeSurecOnay: true,
      islemYapanSicil: 'P10842',
    };
    const correlationId = `CORR_TEST_003_${Date.now()}`;

    it('returns digital process code when all consents are present', async () => {
      const res = await wallService.processNotification(reqDigital, correlationId);
      expect(res.islemKodu).toBe(PROCESS_CODES.APPROVED_DIGITAL);
      expect(res.islemAck).toBe(PROCESS_MESSAGES[PROCESS_CODES.APPROVED_DIGITAL]);
    });

    it('persists completed digital record in database', async () => {
      const dbRecord = await entityDbService.getByMusteriNo('10000001');
      expect(dbRecord).not.toBeNull();
      expect(dbRecord?.bildirimDurumu).toBe('Yapıldı');
    });

    it('creates digital channel outbox event atomically', async () => {
      const outboxRepo = entityDbService.getOutboxRepository();
      const outboxList = await outboxRepo.findByCorrelationId(correlationId);
      expect(outboxList).toHaveLength(1);
      expect(outboxList[0].status).toBe('PENDING');
      expect((outboxList[0].payload as any).channel).toBe('DIGITAL');
    });
  });

  describe('Master Data Authority', () => {
    beforeAll(async () => {
      await customerRepo.upsert({
        musteriNo: '10000099',
        musteriAdi: 'Onaysız',
        musteriSoyadi: 'Müşteri',
        musteriTckn: '99999999999',
        musteriDurumu: 'Musteri',
        subeKod: '0999',
        subeAdi: 'Güvenlik Şubesi',
        kullandirilabilirUrun: 'KMH',
        epostaOnay: false,
        smsOnay: false,
        dijitalBelgeSurecOnay: false,
      });
    });

    it('prioritizes master DB consent values over request payload', async () => {
      const spoofedReq: NotificationRequestDTO = {
        musteriNo: '10000099',
        musteriAdi: 'Onaysız',
        musteriSoyadi: 'Müşteri',
        musteriTckn: '99999999999',
        musteriDurumu: 'Musteri',
        subeKod: '0999',
        subeAdi: 'Güvenlik Şubesi',
        kullandirilabilirUrun: 'KMH',
        epostaOnay: true,
        smsOnay: false,
        dijitalBelgeSurecOnay: true,
        islemYapanSicil: 'P10842',
      };

      const res = await wallService.processNotification(spoofedReq);

      expect(res.islemKodu).toBe(PROCESS_CODES.REJECTED_NO_CONSENT);
      expect(res.islemAck).toBe(PROCESS_MESSAGES[PROCESS_CODES.REJECTED_NO_CONSENT]);

      const audit = await entityDbService.getByMusteriNo('10000099');
      expect(audit).toBeNull();
    });
  });

  describe('Personnel Restriction', () => {
    beforeAll(async () => {
      await customerRepo.upsert({
        musteriNo: '10000088',
        musteriAdi: 'Personel',
        musteriSoyadi: 'Çalışan',
        musteriTckn: '88888888888',
        musteriDurumu: 'Personel',
        subeKod: '0888',
        subeAdi: 'Genel Müdürlük Şubesi',
        kullandirilabilirUrun: 'Kredi Kartı',
        epostaOnay: true,
        smsOnay: true,
        dijitalBelgeSurecOnay: true,
      });
    });

    it('rejects marketing requests for bank personnel', async () => {
      const personnelReq: NotificationRequestDTO = {
        musteriNo: '10000088',
        musteriAdi: 'Personel',
        musteriSoyadi: 'Çalışan',
        musteriTckn: '88888888888',
        musteriDurumu: 'Personel',
        subeKod: '0888',
        subeAdi: 'Genel Müdürlük Şubesi',
        kullandirilabilirUrun: 'Kredi Kartı',
        epostaOnay: true,
        smsOnay: true,
        dijitalBelgeSurecOnay: true,
        islemYapanSicil: 'P10842',
      };

      const res = await wallService.processNotification(personnelReq);

      expect(res.islemKodu).toBe(PROCESS_CODES.RESTRICTED_STAFF);
      expect(res.islemAck).toBe(PROCESS_MESSAGES[PROCESS_CODES.RESTRICTED_STAFF]);

      const audit = await entityDbService.getByMusteriNo('10000088');
      expect(audit).toBeNull();
    });
  });
});
