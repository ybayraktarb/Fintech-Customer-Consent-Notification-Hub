import request from 'supertest';
import app from '../app';

describe('JACPoL ABAC Policy Security Verification (musteri_onay)', () => {
  const customerAuditUrl = '/api/customers/1001/audit-logs';
  const generalAuditUrl = '/api/audit-logs';

  it('Admin her zaman müşteri denetim kayıtlarına erişebilmeli (Permit)', async () => {
    const res = await request(app)
      .get(customerAuditUrl)
      .set('x-user-role', 'admin')
      .set('x-mock-time', '23:00')
      .set('x-mock-weekday', 'sunday');

    expect(res.status).not.toBe(403);
  });

  it('Auditor (Denetçi) her zaman müşteri denetim kayıtlarına erişebilmeli (Permit)', async () => {
    const res = await request(app)
      .get(customerAuditUrl)
      .set('x-user-role', 'auditor')
      .set('x-mock-time', '03:15')
      .set('x-mock-weekday', 'saturday');

    expect(res.status).not.toBe(403);
  });

  it('Normal personel mesai saatinde (Pazartesi 14:00) erişebilmeli (Permit)', async () => {
    const res = await request(app)
      .get(customerAuditUrl)
      .set('x-user-role', 'staff')
      .set('x-mock-time', '14:00')
      .set('x-mock-weekday', 'monday');

    expect(res.status).not.toBe(403);
  });

  it('Normal personel mesai saatleri DIŞINDA (Pazartesi 21:00) engellenmeli (403 Forbidden)', async () => {
    const res = await request(app)
      .get(customerAuditUrl)
      .set('x-user-role', 'staff')
      .set('x-mock-time', '21:00')
      .set('x-mock-weekday', 'monday');

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('FORBIDDEN');
    expect(res.body.message).toContain('Yetkilendirme reddedildi');
  });

  it('Normal personel HAFTA SONU (Pazar 14:00) engellenmeli (403 Forbidden)', async () => {
    const res = await request(app)
      .get(customerAuditUrl)
      .set('x-user-role', 'staff')
      .set('x-mock-time', '14:00')
      .set('x-mock-weekday', 'sunday');

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('FORBIDDEN');
    expect(res.body.details?.environment?.weekday).toBe('sunday');
  });

  it('Yetkisiz veya role sahip olmayan kullanıcı varsayılan olarak engellenmeli (403 Forbidden)', async () => {
    const res = await request(app)
      .get(customerAuditUrl)
      .set('x-user-role', 'guest');

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('FORBIDDEN');
  });

  it('Genel sistem denetim kayıtları (/api/audit-logs) da mesai dışı personeli engellemeli (403 Forbidden)', async () => {
    const res = await request(app)
      .get(generalAuditUrl)
      .set('x-user-role', 'staff')
      .set('x-mock-time', '22:00')
      .set('x-mock-weekday', 'monday');

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('FORBIDDEN');
  });
});
