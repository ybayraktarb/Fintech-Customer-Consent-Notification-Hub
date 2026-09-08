import { ProcessCodeType } from '../constants/processCodes';

export interface NotificationRequestDTO {
  musteriNo: string;
  musteriAdi: string;
  musteriSoyadi: string;
  musteriTckn: string;
  musteriDurumu: 'Personel' | 'Musteri';
  subeKod: string;
  subeAdi: string;
  kullandirilabilirUrun: 'Kredi Kartı' | 'KMH' | 'Bireysel Kredi' | string;
  epostaOnay: boolean;
  smsOnay: boolean;
  dijitalBelgeSurecOnay: boolean;
  islemYapanSicil?: string;
  islemYapanAdSoyad?: string;
}

export interface NotificationResponseDTO {
  islemKodu: ProcessCodeType | string;
  islemAck: string;
}
