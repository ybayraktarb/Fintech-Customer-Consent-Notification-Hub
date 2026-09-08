export type NotificationStatusType = 'QUEUED' | 'DELIVERED' | 'FAILED' | 'Yapıldı' | 'Yapılmadı';

export interface CustomerNotificationEntity {
  id: string;
  musteriNo: string;
  musteriAdi: string;
  musteriSoyadi: string;
  musteriTckn: string;
  musteriDurumu: 'Personel' | 'Musteri' | string;
  subeKod: string;
  subeAdi: string;
  kullandirilabilirUrun: string;
  epostaOnay: boolean;
  smsOnay: boolean;
  dijitalBelgeSurecOnay: boolean;
  bildirimDurumu: NotificationStatusType;
  islemKodu?: string | null;
  islemAck?: string | null;
  outboxMessageId?: string | null;
  isActive: boolean;
  guncellemeYapan: string;
  guncellemeZmn: string;
  kayitYapan: string;
  kayitZmn: string;
  bildirimZmn: string;
}

