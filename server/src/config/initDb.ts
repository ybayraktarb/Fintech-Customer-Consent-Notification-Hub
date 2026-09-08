import { prisma } from './prisma';

const INITIAL_CUSTOMERS = [
  {
    id: '1',
    musteriNo: '10000001',
    musteriAdi: 'Örnek',
    musteriSoyadi: 'Müşteri 1',
    musteriTckn: '10000000001',
    musteriDurumu: 'Musteri',
    subeKod: '0101',
    subeAdi: 'Örnek Şube A',
    kullandirilabilirUrun: 'Kredi Kartı',
    epostaOnay: true,
    smsOnay: true,
    dijitalBelgeSurecOnay: true,
  },
  {
    id: '2',
    musteriNo: '10000002',
    musteriAdi: 'Örnek',
    musteriSoyadi: 'Müşteri 2',
    musteriTckn: '10000000002',
    musteriDurumu: 'Musteri',
    subeKod: '0102',
    subeAdi: 'Örnek Şube B',
    kullandirilabilirUrun: 'Bireysel Kredi',
    epostaOnay: true,
    smsOnay: false,
    dijitalBelgeSurecOnay: false,
  },
  {
    id: '3',
    musteriNo: '10000003',
    musteriAdi: 'Örnek',
    musteriSoyadi: 'Müşteri 3',
    musteriTckn: '10000000003',
    musteriDurumu: 'Personel',
    subeKod: '0103',
    subeAdi: 'Örnek Şube C',
    kullandirilabilirUrun: 'KMH',
    epostaOnay: false,
    smsOnay: true,
    dijitalBelgeSurecOnay: false,
  },
  {
    id: '4',
    musteriNo: '10000004',
    musteriAdi: 'Örnek',
    musteriSoyadi: 'Müşteri 4',
    musteriTckn: '10000000004',
    musteriDurumu: 'Musteri',
    subeKod: '0101',
    subeAdi: 'Örnek Şube A',
    kullandirilabilirUrun: 'Kredi Kartı',
    epostaOnay: false,
    smsOnay: false,
    dijitalBelgeSurecOnay: false,
  },
  {
    id: '5',
    musteriNo: '10000005',
    musteriAdi: 'Örnek',
    musteriSoyadi: 'Müşteri 5',
    musteriTckn: '10000000005',
    musteriDurumu: 'Musteri',
    subeKod: '0102',
    subeAdi: 'Örnek Şube B',
    kullandirilabilirUrun: 'Bireysel Kredi',
    epostaOnay: true,
    smsOnay: false,
    dijitalBelgeSurecOnay: true,
  },
  {
    id: '6',
    musteriNo: '10000006',
    musteriAdi: 'Örnek',
    musteriSoyadi: 'Müşteri 6',
    musteriTckn: '10000000006',
    musteriDurumu: 'Personel',
    subeKod: '0103',
    subeAdi: 'Örnek Şube C',
    kullandirilabilirUrun: 'KMH',
    epostaOnay: true,
    smsOnay: true,
    dijitalBelgeSurecOnay: false,
  },
  {
    id: '7',
    musteriNo: '10000007',
    musteriAdi: 'Örnek',
    musteriSoyadi: 'Müşteri 7',
    musteriTckn: '10000000007',
    musteriDurumu: 'Musteri',
    subeKod: '0101',
    subeAdi: 'Örnek Şube A',
    kullandirilabilirUrun: 'Kredi Kartı',
    epostaOnay: false,
    smsOnay: false,
    dijitalBelgeSurecOnay: false,
  },
  {
    id: '8',
    musteriNo: '10000008',
    musteriAdi: 'Örnek',
    musteriSoyadi: 'Müşteri 8',
    musteriTckn: '10000000008',
    musteriDurumu: 'Personel',
    subeKod: '0102',
    subeAdi: 'Örnek Şube B',
    kullandirilabilirUrun: 'KMH',
    epostaOnay: false,
    smsOnay: true,
    dijitalBelgeSurecOnay: true,
  },
  {
    id: '9',
    musteriNo: '10000009',
    musteriAdi: 'Örnek',
    musteriSoyadi: 'Müşteri 9',
    musteriTckn: '10000000009',
    musteriDurumu: 'Musteri',
    subeKod: '0103',
    subeAdi: 'Örnek Şube C',
    kullandirilabilirUrun: 'Bireysel Kredi',
    epostaOnay: true,
    smsOnay: true,
    dijitalBelgeSurecOnay: true,
  },
  {
    id: '10',
    musteriNo: '10000010',
    musteriAdi: 'Örnek',
    musteriSoyadi: 'Müşteri 10',
    musteriTckn: '10000000010',
    musteriDurumu: 'Musteri',
    subeKod: '0101',
    subeAdi: 'Örnek Şube A',
    kullandirilabilirUrun: 'Kredi Kartı',
    epostaOnay: false,
    smsOnay: false,
    dijitalBelgeSurecOnay: false,
  },
  {
    id: '11',
    musteriNo: '10000011',
    musteriAdi: 'Örnek',
    musteriSoyadi: 'Müşteri 11',
    musteriTckn: '10000000011',
    musteriDurumu: 'Personel',
    subeKod: '0102',
    subeAdi: 'Örnek Şube B',
    kullandirilabilirUrun: 'KMH',
    epostaOnay: true,
    smsOnay: false,
    dijitalBelgeSurecOnay: false,
  },
  {
    id: '12',
    musteriNo: '10000012',
    musteriAdi: 'Örnek',
    musteriSoyadi: 'Müşteri 12',
    musteriTckn: '10000000012',
    musteriDurumu: 'Musteri',
    subeKod: '0103',
    subeAdi: 'Örnek Şube C',
    kullandirilabilirUrun: 'Bireysel Kredi',
    epostaOnay: true,
    smsOnay: true,
    dijitalBelgeSurecOnay: true,
  },
];

export async function autoSeedDatabase(): Promise<void> {
  try {
    // Ensure schema tables exist
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "customers" (
        "id" TEXT PRIMARY KEY,
        "musteriNo" TEXT UNIQUE NOT NULL,
        "musteriAdi" TEXT NOT NULL,
        "musteriSoyadi" TEXT NOT NULL,
        "musteriTckn" TEXT NOT NULL,
        "musteriDurumu" TEXT NOT NULL,
        "subeKod" TEXT NOT NULL,
        "subeAdi" TEXT NOT NULL,
        "kullandirilabilirUrun" TEXT NOT NULL,
        "epostaOnay" BOOLEAN NOT NULL DEFAULT false,
        "smsOnay" BOOLEAN NOT NULL DEFAULT false,
        "dijitalBelgeSurecOnay" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "customer_notification_logs" (
        "id" TEXT PRIMARY KEY,
        "musteriNo" TEXT NOT NULL REFERENCES "customers"("musteriNo") ON DELETE CASCADE,
        "musteriAdi" TEXT NOT NULL,
        "musteriSoyadi" TEXT NOT NULL,
        "musteriTckn" TEXT NOT NULL,
        "musteriDurumu" TEXT NOT NULL,
        "subeKod" TEXT NOT NULL,
        "subeAdi" TEXT NOT NULL,
        "kullandirilabilirUrun" TEXT NOT NULL,
        "epostaOnay" BOOLEAN NOT NULL,
        "smsOnay" BOOLEAN NOT NULL,
        "dijitalBelgeSurecOnay" BOOLEAN NOT NULL,
        "bildirimDurumu" TEXT NOT NULL DEFAULT 'Yapıldı',
        "islemKodu" TEXT,
        "islemAck" TEXT,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "kayitYapan" TEXT NOT NULL,
        "kayitZmn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "guncellemeYapan" TEXT NOT NULL,
        "guncellemeZmn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "bildirimZmn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "customer_notification_logs_musteriNo_idx" ON "customer_notification_logs"("musteriNo");
    `);

    // Outbox and inbox (idempotency) tables
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "outbox_messages" (
        "id" TEXT PRIMARY KEY,
        "eventType" TEXT NOT NULL,
        "payload" JSONB NOT NULL,
        "correlationId" TEXT,
        "status" TEXT NOT NULL DEFAULT 'PENDING',
        "retryCount" INTEGER NOT NULL DEFAULT 0,
        "errorReason" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "processedAt" TIMESTAMP(3)
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "outbox_messages_status_createdAt_idx" ON "outbox_messages"("status", "createdAt");
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "processed_messages" (
        "messageId" TEXT PRIMARY KEY,
        "consumerName" TEXT NOT NULL,
        "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Seed initial customer records if database is empty
    const count = await prisma.customer.count();
    if (count === 0) {
      console.log('[Database] Auto-seeding initial customer records...');
      for (const customer of INITIAL_CUSTOMERS) {
        await prisma.customer.upsert({
          where: { musteriNo: customer.musteriNo },
          update: { ...customer },
          create: { ...customer },
        });
      }
      console.log(`[Database] Seeded ${INITIAL_CUSTOMERS.length} customer records.`);
    }
  } catch (err) {
    console.warn('[Database] AutoSeed warning:', (err as Error).message);
  }
}
