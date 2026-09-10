import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const INITIAL_CUSTOMERS = [
  {
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

async function main() {
  for (const customer of INITIAL_CUSTOMERS) {
    await prisma.customer.upsert({
      where: { musteriNo: customer.musteriNo },
      update: { ...customer },
      create: { ...customer },
    });
  }

  console.log(`[Seed] Successfully seeded ${INITIAL_CUSTOMERS.length} customer records.`);
}

main()
  .catch((e) => {
    console.error('[Seed] Database seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
