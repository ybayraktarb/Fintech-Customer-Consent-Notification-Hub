import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const INITIAL_CUSTOMERS = [
  {
    musteriNo: '10000001',
    musteriAdi: 'Caner',
    musteriSoyadi: 'Yıldız',
    musteriTckn: '28491048294',
    musteriDurumu: 'Musteri',
    subeKod: '0104',
    subeAdi: 'Levent Kurumsal Şube',
    kullandirilabilirUrun: 'Kredi Kartı',
    epostaOnay: true,
    smsOnay: true,
    dijitalBelgeSurecOnay: true,
  },
  {
    musteriNo: '10000002',
    musteriAdi: 'Ebru',
    musteriSoyadi: 'Aksoy',
    musteriTckn: '49201948572',
    musteriDurumu: 'Musteri',
    subeKod: '0218',
    subeAdi: 'Maslak Ticari Şube',
    kullandirilabilirUrun: 'Bireysel Kredi',
    epostaOnay: true,
    smsOnay: false,
    dijitalBelgeSurecOnay: false,
  },
  {
    musteriNo: '10000003',
    musteriAdi: 'Tolga',
    musteriSoyadi: 'Şahin',
    musteriTckn: '38491029481',
    musteriDurumu: 'Personel',
    subeKod: '0355',
    subeAdi: 'Kadıköy Rıhtım Şubesi',
    kullandirilabilirUrun: 'KMH',
    epostaOnay: false,
    smsOnay: true,
    dijitalBelgeSurecOnay: false,
  },
  {
    musteriNo: '10000004',
    musteriAdi: 'Büşra',
    musteriSoyadi: 'Koçak',
    musteriTckn: '39201948501',
    musteriDurumu: 'Musteri',
    subeKod: '0512',
    subeAdi: 'Kızılay Şubesi',
    kullandirilabilirUrun: 'Kredi Kartı',
    epostaOnay: false,
    smsOnay: false,
    dijitalBelgeSurecOnay: false,
  },
  {
    musteriNo: '10000005',
    musteriAdi: 'Deniz',
    musteriSoyadi: 'Aydın',
    musteriTckn: '58291049281',
    musteriDurumu: 'Musteri',
    subeKod: '0218',
    subeAdi: 'Maslak Ticari Şube',
    kullandirilabilirUrun: 'Bireysel Kredi',
    epostaOnay: true,
    smsOnay: false,
    dijitalBelgeSurecOnay: true,
  },
  {
    musteriNo: '10000006',
    musteriAdi: 'Serkan',
    musteriSoyadi: 'Erdoğan',
    musteriTckn: '19482019482',
    musteriDurumu: 'Personel',
    subeKod: '0355',
    subeAdi: 'Kadıköy Rıhtım Şubesi',
    kullandirilabilirUrun: 'KMH',
    epostaOnay: true,
    smsOnay: true,
    dijitalBelgeSurecOnay: false,
  },
  {
    musteriNo: '10000007',
    musteriAdi: 'Zeynep',
    musteriSoyadi: 'Çelik',
    musteriTckn: '48291039485',
    musteriDurumu: 'Musteri',
    subeKod: '0104',
    subeAdi: 'Levent Kurumsal Şube',
    kullandirilabilirUrun: 'Kredi Kartı',
    epostaOnay: false,
    smsOnay: false,
    dijitalBelgeSurecOnay: false,
  },
  {
    musteriNo: '10000008',
    musteriAdi: 'Murat',
    musteriSoyadi: 'Korkmaz',
    musteriTckn: '69382019482',
    musteriDurumu: 'Personel',
    subeKod: '0218',
    subeAdi: 'Maslak Ticari Şube',
    kullandirilabilirUrun: 'KMH',
    epostaOnay: false,
    smsOnay: true,
    dijitalBelgeSurecOnay: true,
  },
  {
    musteriNo: '10000009',
    musteriAdi: 'Gamze',
    musteriSoyadi: 'Bozkurt',
    musteriTckn: '28492019483',
    musteriDurumu: 'Musteri',
    subeKod: '0420',
    subeAdi: 'Alsancak Şubesi',
    kullandirilabilirUrun: 'Bireysel Kredi',
    epostaOnay: true,
    smsOnay: true,
    dijitalBelgeSurecOnay: true,
  },
  {
    musteriNo: '10000010',
    musteriAdi: 'Onur',
    musteriSoyadi: 'Güneş',
    musteriTckn: '59382019482',
    musteriDurumu: 'Musteri',
    subeKod: '0104',
    subeAdi: 'Levent Kurumsal Şube',
    kullandirilabilirUrun: 'Kredi Kartı',
    epostaOnay: false,
    smsOnay: false,
    dijitalBelgeSurecOnay: false,
  },
  {
    musteriNo: '10000011',
    musteriAdi: 'Pelin',
    musteriSoyadi: 'Aslan',
    musteriTckn: '18492049281',
    musteriDurumu: 'Personel',
    subeKod: '0218',
    subeAdi: 'Maslak Ticari Şube',
    kullandirilabilirUrun: 'KMH',
    epostaOnay: true,
    smsOnay: false,
    dijitalBelgeSurecOnay: false,
  },
  {
    musteriNo: '10000012',
    musteriAdi: 'Kaan',
    musteriSoyadi: 'Yalçın',
    musteriTckn: '49281039482',
    musteriDurumu: 'Musteri',
    subeKod: '0420',
    subeAdi: 'Alsancak Şubesi',
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
