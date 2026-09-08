/**
 * Generic Sayfalanmış API Yanıt DTO Kontratı
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

/**
 * Sayfalama İstek Sorgu Parametreleri
 */
export interface PaginationQueryDTO {
  page?: number;
  limit?: number;
  search?: string;
}
