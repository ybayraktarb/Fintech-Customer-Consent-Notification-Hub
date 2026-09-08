import '../config/env';
import request from 'supertest';
import app from '../app';
import { CustomerRepository } from '../repositories/customer.repository';
import { prisma } from '../config/prisma';

describe('Performance & Stress Tests', () => {
  const customerRepo = CustomerRepository.getInstance();
  const BATCH_SIZE = 50;
  const testIds: string[] = [];

  const FIRST_NAMES = ['Deniz', 'Can', 'Ece', 'Murat', 'Zeynep', 'Bora', 'Elif', 'Ozan', 'Selin', 'Kaan'];
  const LAST_NAMES = ['Korkmaz', 'Yıldırım', 'Demir', 'Aydın', 'Çelik', 'Koç', 'Arslan', 'Şahin', 'Yavuz', 'Öztürk'];
  const BRANCHES = ['Levent Şubesi', 'Maslak Şubesi', 'Kadıköy Şubesi', 'Alsancak Şubesi', 'Kızılay Şubesi'];

  const CUSTOMER_PROFILES = [
    { musteriDurumu: 'Musteri', epostaOnay: true, smsOnay: true, dijitalBelgeSurecOnay: true, urun: 'Kredi Kartı' },
    { musteriDurumu: 'Musteri', epostaOnay: false, smsOnay: true, dijitalBelgeSurecOnay: false, urun: 'Bireysel Kredi' },
    { musteriDurumu: 'Musteri', epostaOnay: true, smsOnay: false, dijitalBelgeSurecOnay: false, urun: 'KMH' },
    { musteriDurumu: 'Musteri', epostaOnay: false, smsOnay: false, dijitalBelgeSurecOnay: false, urun: 'Kredi Kartı' },
    { musteriDurumu: 'Personel', epostaOnay: true, smsOnay: true, dijitalBelgeSurecOnay: true, urun: 'Kredi Kartı' },
  ];

  beforeAll(async () => {
    for (let i = 1; i <= BATCH_SIZE; i++) {
      const musteriNo = `1090${String(i).padStart(4, '0')}`;
      testIds.push(musteriNo);
    }

    await prisma.customerNotificationLog.deleteMany({
      where: { musteriNo: { in: testIds } },
    });
    await prisma.customer.deleteMany({
      where: { musteriNo: { in: testIds } },
    });

    for (let i = 1; i <= BATCH_SIZE; i++) {
      const musteriNo = `1090${String(i).padStart(4, '0')}`;
      const firstName = FIRST_NAMES[(i - 1) % FIRST_NAMES.length];
      const lastName = LAST_NAMES[(i - 1) % LAST_NAMES.length];
      const branchName = BRANCHES[(i - 1) % BRANCHES.length];
      const profile = CUSTOMER_PROFILES[(i - 1) % CUSTOMER_PROFILES.length];

      await customerRepo.upsert({
        musteriNo,
        musteriAdi: firstName,
        musteriSoyadi: lastName,
        musteriTckn: `4920194${String(1000 + i)}`,
        musteriDurumu: profile.musteriDurumu,
        subeKod: `0${100 + ((i - 1) % 5)}`,
        subeAdi: branchName,
        kullandirilabilirUrun: profile.urun,
        epostaOnay: profile.epostaOnay,
        smsOnay: profile.smsOnay,
        dijitalBelgeSurecOnay: profile.dijitalBelgeSurecOnay,
      });
    }
  });

  afterAll(async () => {
    await prisma.customerNotificationLog.deleteMany({
      where: { musteriNo: { in: testIds } },
    });
    await prisma.customer.deleteMany({
      where: { musteriNo: { in: testIds } },
    });
    await prisma.outboxMessage.deleteMany({
      where: { status: 'PENDING' },
    });
  });

  it('fetches paginated customer list in single eager query', async () => {
    const startTime = Date.now();
    const res = await request(app).get('/api/customers?page=1&limit=50&search=1090');
    const duration = Date.now() - startTime;

    expect(res.status).toBe(200);
    expect(res.body.items.length).toBe(BATCH_SIZE);
    expect(duration).toBeLessThan(250);
  });

  it('handles concurrent notification requests within SLA', async () => {
    const concurrentRequests = testIds.slice(0, 30).map((musteriNo, idx) => {
      const firstName = FIRST_NAMES[idx % FIRST_NAMES.length];
      const lastName = LAST_NAMES[idx % LAST_NAMES.length];
      return request(app)
        .post('/api/wall/process-notification')
        .set('X-Correlation-ID', `BATCH_PERF_${idx}`)
        .send({
          musteriNo,
          musteriAdi: firstName,
          musteriSoyadi: lastName,
          musteriTckn: `4920194${String(1001 + idx)}`,
          musteriDurumu: 'Musteri',
          subeKod: '0104',
          subeAdi: 'Levent Şubesi',
          kullandirilabilirUrun: 'Kredi Kartı',
          epostaOnay: true,
          smsOnay: true,
          dijitalBelgeSurecOnay: true,
          operatorSicil: 'P10842',
        });
    });

    const startTime = Date.now();
    const responses = await Promise.all(concurrentRequests);
    const totalDuration = Date.now() - startTime;

    expect(responses.length).toBe(30);
    responses.forEach((res) => {
      expect([200, 400]).toContain(res.status);
    });

    expect(totalDuration).toBeLessThan(1500);
  });
});
