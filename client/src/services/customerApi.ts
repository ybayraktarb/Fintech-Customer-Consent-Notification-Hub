import { NotificationRequestDTO, NotificationResponseDTO, PaginatedCustomerResponse } from '../types/api.types';
import { PROCESS_CODES } from '../constants/processCodes';

// Ortam değişkeni veya göreceli API yolu (/api)
const getApiBaseUrl = (): string => {
  if (import.meta.env?.VITE_API_BASE_URL) {
    return (import.meta.env.VITE_API_BASE_URL as string).replace(/\/+$/, '');
  }
  return '/api';
};

/**
 * Kurumsal Müşteri ve Wall Servisi API İstemcisi
 */
export class CustomerApiService {
  /**
   * Müşteri listesini sayfalanmış olarak sunucudan getirir.
   */
  public static async fetchCustomers(
    page: number = 1,
    limit: number = 10,
    search: string = ''
  ): Promise<PaginatedCustomerResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (search.trim()) {
      params.append('search', search.trim());
    }

    const url = `${getApiBaseUrl()}/customers?${params.toString()}`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP Hata: ${response.status} - Müşteri listesi alınamadı.`);
      }
      return await response.json();
    } catch (error) {
      console.error('[CustomerApiService.fetchCustomers Error]:', error);
      throw error;
    }
  }

  /**
   * Müşteriye ait tarihsel bildirim denetim loglarını getirir.
   */
  public static async fetchCustomerAuditHistory(musteriNo: string): Promise<any[]> {
    const url = `${getApiBaseUrl()}/customers/${encodeURIComponent(musteriNo)}/audit-logs`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP Hata: ${response.status} - Denetim geçmişi alınamadı.`);
      }
      return await response.json();
    } catch (error) {
      console.error('[CustomerApiService.fetchCustomerAuditHistory Error]:', error);
      return [];
    }
  }

  /**
   * Wall Ara Katman Servisine bildirim talebi gönderir.
   * Sözleşme gereği kesinlikle 2 alanlı Response döner: { islemKodu, islemAck }
   */
  public static async sendWallNotification(
    dto: NotificationRequestDTO
  ): Promise<NotificationResponseDTO> {
    const url = `${getApiBaseUrl()}/wall/process-notification`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dto),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => null);
        return {
          islemKodu: errJson?.islemKodu || PROCESS_CODES.ERR_SYSTEM_INTERNAL,
          islemAck: errJson?.islemAck || 'Servis çağrısı sırasında bir hata oluştu.',
        };
      }

      return await response.json();
    } catch (error) {
      console.error('[CustomerApiService.sendWallNotification Error]:', error);
      return {
        islemKodu: PROCESS_CODES.ERR_SYSTEM_INTERNAL,
        islemAck: 'Sunucuya ulaşılamadı. Lütfen ağ bağlantınızı kontrol ediniz.',
      };
    }
  }
}
