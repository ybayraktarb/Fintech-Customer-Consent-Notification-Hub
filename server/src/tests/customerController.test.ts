import '../config/env';
import request from 'supertest';
import app from '../app';
import { CustomerRepository } from '../repositories/customer.repository';
import { prisma } from '../config/prisma';

describe('CustomerController & HTTP Endpoints Test Suite', () => {
  const customerRepo = CustomerRepository.getInstance();

  beforeAll(async () => {
    await prisma.customerNotificationLog.deleteMany({
      where: { musteriNo: { in: ['CTRL_001', 'CTRL_002', 'CTRL_003', 'CTRL_004'] } },
    });
    await prisma.customer.deleteMany({
      where: { musteriNo: { in: ['CTRL_001', 'CTRL_002', 'CTRL_003', 'CTRL_004'] } },
    });

    await customerRepo.upsert({
      musteriNo: 'CTRL_001',
      musteriAdi: 'Selin',
      musteriSoyadi: 'Yıldırım',
      musteriTckn: '48291048291',
      musteriDurumu: 'Musteri',
      subeKod: '0104',
      subeAdi: 'Levent',
      kullandirilabilirUrun: 'Kredi Kartı',
      epostaOnay: true,
      smsOnay: true,
      dijitalBelgeSurecOnay: true,
    });

    await customerRepo.upsert({
      musteriNo: 'CTRL_002',
      musteriAdi: 'Burak',
      musteriSoyadi: 'Öztürk',
      musteriTckn: '59381029482',
      musteriDurumu: 'Musteri',
      subeKod: '0218',
      subeAdi: 'Maslak',
      kullandirilabilirUrun: 'KMH',
      epostaOnay: true,
      smsOnay: false,
      dijitalBelgeSurecOnay: false,
    });

    await customerRepo.upsert({
      musteriNo: 'CTRL_003',
      musteriAdi: 'Emre',
      musteriSoyadi: 'Demirtaş',
      musteriTckn: '18492019485',
      musteriDurumu: 'Personel',
      subeKod: '0355',
      subeAdi: 'Kadıköy',
      kullandirilabilirUrun: 'Bireysel Kredi',
      epostaOnay: true,
      smsOnay: true,
      dijitalBelgeSurecOnay: true,
    });
  });

  afterAll(async () => {
    await prisma.customerNotificationLog.deleteMany({
      where: { musteriNo: { in: ['CTRL_001', 'CTRL_002', 'CTRL_003', 'CTRL_004'] } },
    });
    await prisma.customer.deleteMany({
      where: { musteriNo: { in: ['CTRL_001', 'CTRL_002', 'CTRL_003', 'CTRL_004'] } },
    });
  });

  describe('GET /api/customers', () => {
    it('returns paginated customer list with default limit and page', async () => {
      const res = await request(app).get('/api/customers?page=1&limit=10');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('items');
      expect(res.body).toHaveProperty('totalCount');
      expect(Array.isArray(res.body.items)).toBe(true);
      expect(res.body.page).toBe(1);
    });

    it('filters customers by search query (name or musteriNo)', async () => {
      const res = await request(app).get('/api/customers?search=Selin');
      expect(res.status).toBe(200);
      expect(res.body.items.length).toBeGreaterThanOrEqual(1);
      expect(res.body.items[0].musteriAdi).toBe('Selin');
    });

    it('maps notification status badges and action button states', async () => {
      await prisma.customerNotificationLog.create({
        data: {
          musteriNo: 'CTRL_001',
          musteriAdi: 'Selin',
          musteriSoyadi: 'Yıldırım',
          musteriTckn: '48291048291',
          musteriDurumu: 'Musteri',
          subeKod: '0104',
          subeAdi: 'Levent',
          kullandirilabilirUrun: 'Kredi Kartı',
          epostaOnay: true,
          smsOnay: true,
          dijitalBelgeSurecOnay: true,
          bildirimDurumu: 'QUEUED',
          kayitYapan: 'P10842',
          guncellemeYapan: 'P10842',
        },
      });

      const res = await request(app).get('/api/customers?search=CTRL_001');
      expect(res.status).toBe(200);
      expect(res.body.items[0].bildirimDurumu).toBe('Kuyrukta');
      expect(res.body.items[0].butonDurumu).toBe('Pasif');
    });
  });

  describe('GET /api/customers/:musteriNo/audit-logs', () => {
    it('returns specific customer audit history in descending order', async () => {
      const res = await request(app)
        .get('/api/customers/CTRL_001/audit-logs')
        .set('x-user-role', 'staff')
        .set('x-mock-time', '14:00')
        .set('x-mock-weekday', 'monday');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      expect(res.body[0].musteriNo).toBe('CTRL_001');
    });

    it('returns empty list for customer with no notification history', async () => {
      const res = await request(app)
        .get('/api/customers/CTRL_002/audit-logs')
        .set('x-user-role', 'staff')
        .set('x-mock-time', '14:00')
        .set('x-mock-weekday', 'monday');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(0);
    });
  });

  describe('GET /api/audit-logs', () => {
    it('returns all audit logs across the system', async () => {
      const res = await request(app)
        .get('/api/audit-logs')
        .set('x-user-role', 'auditor')
        .set('x-mock-time', '14:00')
        .set('x-mock-weekday', 'monday');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('POST /api/wall/process-notification', () => {
    it('validates missing musteriNo and returns 400 validation error', async () => {
      const res = await request(app)
        .post('/api/wall/process-notification')
        .send({});
      expect(res.status).toBe(400);
      expect(res.body.islemKodu).toBe('ERR_VALIDATION_FAILED');
    });

    it('processes eligible customer and returns process response', async () => {
      const res = await request(app)
        .post('/api/wall/process-notification')
        .send({
          musteriNo: 'CTRL_002',
          musteriAdi: 'Burak',
          musteriSoyadi: 'Öztürk',
          musteriTckn: '59381029482',
          musteriDurumu: 'Musteri',
          subeKod: '0218',
          subeAdi: 'Maslak',
          kullandirilabilirUrun: 'KMH',
          epostaOnay: true,
          smsOnay: false,
          dijitalBelgeSurecOnay: false,
          operatorSicil: 'OP_CTRL',
        });
      expect(res.status).toBe(200);
      expect(res.body.islemKodu).toBe('APPROVED_BRANCH_CALL');
    });

    it('blocks employee customer and returns RESTRICTED_STAFF', async () => {
      const res = await request(app)
        .post('/api/wall/process-notification')
        .send({
          musteriNo: 'CTRL_003',
          musteriAdi: 'Emre',
          musteriSoyadi: 'Demirtaş',
          musteriTckn: '18492019485',
          musteriDurumu: 'Musteri',
          subeKod: '0355',
          subeAdi: 'Kadıköy',
          kullandirilabilirUrun: 'Bireysel Kredi',
          epostaOnay: true,
          smsOnay: true,
          dijitalBelgeSurecOnay: true,
          operatorSicil: 'OP_CTRL',
        });
      expect(res.status).toBe(200);
      expect(res.body.islemKodu).toBe('RESTRICTED_STAFF');
    });
  });
});
