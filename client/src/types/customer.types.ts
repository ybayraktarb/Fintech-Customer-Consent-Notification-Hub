export type MusteriDurumu = 'Personel' | 'Musteri' | string;
export type UrunOnerisi = 'Kredi Kartı' | 'KMH' | 'Bireysel Kredi' | string;
export type BildirimDurumu = 'Yapıldı' | 'Yapılmadı' | 'Kuyrukta' | 'İletildi' | 'Hata' | string;
export type ButonDurumu = 'Aktif' | 'Pasif';

export interface CustomerUIModel {
  musteriNo: string;
  musteriAdi: string;
  musteriSoyadi: string;
  musteriTckn: string;
  musteriDurumu: MusteriDurumu;
  subeKod: string;
  subeAdi: string;
  kullandirilabilirUrun: UrunOnerisi;
  epostaOnay: boolean;
  smsOnay: boolean;
  dijitalBelgeSurecOnay: boolean;
  bildirimDurumu: BildirimDurumu;
  butonDurumu: ButonDurumu;
  isLoading?: boolean;
}
