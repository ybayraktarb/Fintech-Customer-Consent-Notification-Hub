import { ProcessCodeType } from '../constants/processCodes';

export interface NotificationRequestDTO {
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
  islemYapanSicil?: string;
  islemYapanAdSoyad?: string;
}

export interface NotificationResponseDTO {
  islemKodu: ProcessCodeType | string;
  islemAck: string;
}

/**
 * Generic Sayfalanmış API Yanıt Kontratı
 */
export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

import { CustomerUIModel } from './customer.types';
export type PaginatedCustomerResponse = PaginatedResponse<CustomerUIModel>;
