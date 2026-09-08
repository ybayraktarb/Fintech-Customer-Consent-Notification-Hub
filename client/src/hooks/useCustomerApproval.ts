import { useState, useEffect, useCallback } from 'react';
import { CustomerUIModel } from '../types/customer.types';
import { NotificationRequestDTO, NotificationResponseDTO } from '../types/api.types';
import { CustomerApiService } from '../services/customerApi';

export interface FeedbackState {
  islemKodu: string;
  islemAck: string;
  musteriNo: string;
  musteriAdSoyad: string;
  timestamp: string;
}

export const useCustomerApproval = () => {
  const [customers, setCustomers] = useState<CustomerUIModel[]>([]);
  const [isLoadingList, setIsLoadingList] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [hasNextPage, setHasNextPage] = useState<boolean>(false);
  const [hasPrevPage, setHasPrevPage] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');

  const [lastFeedback, setLastFeedback] = useState<FeedbackState | null>(null);

  const loadCustomers = useCallback(async () => {
    setIsLoadingList(true);
    setError(null);
    try {
      const data = await CustomerApiService.fetchCustomers(page, limit, search);
      setCustomers(data.items);
      setTotalCount(data.totalCount);
      setTotalPages(data.totalPages);
      setHasNextPage(data.hasNextPage);
      setHasPrevPage(data.hasPrevPage);
    } catch (err) {
      setError('Müşteri listesi yüklenirken bir sorun oluştu.');
      console.error(err);
    } finally {
      setIsLoadingList(false);
    }
  }, [page, limit, search]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const changePage = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const changeLimit = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  };

  const handleSearch = (newSearch: string) => {
    setSearch(newSearch);
    setPage(1);
  };

  const handleProcessNotification = async (customer: CustomerUIModel) => {
    setCustomers((prev) =>
      prev.map((item) =>
        item.musteriNo === customer.musteriNo ? { ...item, isLoading: true } : item
      )
    );

    const requestDTO: NotificationRequestDTO = {
      musteriNo: customer.musteriNo,
      musteriAdi: customer.musteriAdi,
      musteriSoyadi: customer.musteriSoyadi,
      musteriTckn: customer.musteriTckn,
      musteriDurumu: customer.musteriDurumu,
      subeKod: customer.subeKod,
      subeAdi: customer.subeAdi,
      kullandirilabilirUrun: customer.kullandirilabilirUrun,
      epostaOnay: customer.epostaOnay,
      smsOnay: customer.smsOnay,
      dijitalBelgeSurecOnay: customer.dijitalBelgeSurecOnay,
      islemYapanSicil: 'P10842',
    };

    const response: NotificationResponseDTO = await CustomerApiService.sendWallNotification(
      requestDTO
    );

    const isSuccess = response.islemKodu.startsWith('SUCCESS');

    setCustomers((prev) =>
      prev.map((item) => {
        if (item.musteriNo === customer.musteriNo) {
          return {
            ...item,
            isLoading: false,
            butonDurumu: isSuccess ? 'Pasif' : 'Aktif',
            bildirimDurumu: isSuccess ? 'Yapıldı' : 'Yapılmadı',
          };
        }
        return item;
      })
    );

    setLastFeedback({
      islemKodu: response.islemKodu,
      islemAck: response.islemAck,
      musteriNo: customer.musteriNo,
      musteriAdSoyad: `${customer.musteriAdi} ${customer.musteriSoyadi}`,
      timestamp: new Date().toLocaleTimeString('tr-TR'),
    });
  };

  return {
    customers,
    isLoadingList,
    error,
    lastFeedback,
    page,
    limit,
    totalCount,
    totalPages,
    hasNextPage,
    hasPrevPage,
    search,
    setPage: changePage,
    setLimit: changeLimit,
    setSearch: handleSearch,
    handleProcessNotification,
    refreshCustomers: async () => { setLastFeedback(null); await loadCustomers(); },
  };
};
