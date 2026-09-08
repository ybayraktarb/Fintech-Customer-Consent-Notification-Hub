import React, { useState } from 'react';
import { CustomerUIModel } from '../../types/customer.types';
import { MaskedTckn } from '../common/MaskedTckn';
import {
  ConsentStatus,
  CustomerTypeStatus,
  NotificationStatus,
  ProductDisplay,
} from '../common/StatusBadge';
import { Pagination } from '../common/Pagination';
import { AuditHistoryModal } from './AuditHistoryModal';
import { History } from 'lucide-react';

interface CustomerTableProps {
  customers: CustomerUIModel[];
  onProcessNotification: (customer: CustomerUIModel) => void;
  isLoadingList: boolean;
  pagination?: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    onPageChange: (newPage: number) => void;
    onLimitChange: (newLimit: number) => void;
  };
}

export const CustomerTable: React.FC<CustomerTableProps> = ({
  customers,
  onProcessNotification,
  isLoadingList,
  pagination,
}) => {
  const [selectedCustomerForHistory, setSelectedCustomerForHistory] = useState<CustomerUIModel | null>(null);

  const renderTableBody = () => {
    if (isLoadingList) {
      return (
        <tr>
          <td colSpan={13} className="td-status-message">
            <div className="status-message-content">
              <span className="inline-spinner" />
              <span>Müşteri verileri yükleniyor...</span>
            </div>
          </td>
        </tr>
      );
    }

    if (!customers || customers.length === 0) {
      return (
        <tr>
          <td colSpan={13} className="td-status-message">
            <p className="status-message-text">Kayıt bulunamadı.</p>
          </td>
        </tr>
      );
    }

    return customers.map((customer) => {
      const isAlreadyProcessed =
        customer.butonDurumu === 'Pasif' ||
        customer.bildirimDurumu === 'Yapıldı' ||
        customer.bildirimDurumu === 'İletildi' ||
        customer.bildirimDurumu === 'Kuyrukta';
      const hasNoContactConsent = !customer.epostaOnay && !customer.smsOnay;
      const isPersonnel = customer.musteriDurumu === 'Personel';
      const isLoading = customer.isLoading;

      let buttonContent = 'Bildirim Yap';
      let buttonClass = 'btn-action-active';
      let buttonDisabled = false;
      let tooltipText = 'Müşteri ürün bildirimini tetikle';

      if (isAlreadyProcessed) {
        buttonContent = 'Yapıldı';
        buttonClass = 'btn-action-passive';
        buttonDisabled = true;
        tooltipText = 'Bildirim süreci tamamlanmıştır.';
      } else if (isPersonnel) {
        buttonContent = 'Kısıtlı';
        buttonClass = 'btn-action-restricted';
        buttonDisabled = true;
        tooltipText = 'Banka personeline standart pazarlama bildirimi yapılamaz.';
      } else if (hasNoContactConsent) {
        buttonContent = 'İzin Yok';
        buttonClass = 'btn-action-no-consent';
        buttonDisabled = true;
        tooltipText = 'İletişim izni (SMS / E-posta) bulunmamaktadır.';
      } else if (isLoading) {
        buttonContent = 'İşleniyor...';
        buttonDisabled = true;
      }

      return (
        <tr key={customer.musteriNo}>
          <td className="cell-musteri-no">
            <button
              type="button"
              className="btn-history-trigger"
              onClick={() => setSelectedCustomerForHistory(customer)}
              title="Denetim geçmişini görüntüle"
            >
              <History size={12} className="history-icon" />
              <span>{customer.musteriNo}</span>
            </button>
          </td>
          <td>{customer.musteriAdi}</td>
          <td>{customer.musteriSoyadi}</td>
          <td>
            <MaskedTckn tckn={customer.musteriTckn} />
          </td>
          <td>
            <CustomerTypeStatus durum={customer.musteriDurumu} />
          </td>
          <td>{customer.subeKod}</td>
          <td>{customer.subeAdi}</td>
          <td>
            <ProductDisplay urun={customer.kullandirilabilirUrun} />
          </td>
          <td className="td-center">
            <ConsentStatus approved={customer.epostaOnay} />
          </td>
          <td className="td-center">
            <ConsentStatus approved={customer.smsOnay} />
          </td>
          <td className="td-center">
            <ConsentStatus approved={customer.dijitalBelgeSurecOnay} />
          </td>
          <td className="td-center">
            <NotificationStatus durum={customer.bildirimDurumu} />
          </td>
          <td className="td-center">
            <div className="action-cell-group">
              <button
                type="button"
                className="btn-history-action"
                title="Geçmiş Denetim Kayıtları"
                onClick={() => setSelectedCustomerForHistory(customer)}
              >
                <History size={13} />
                <span>Geçmiş</span>
              </button>
              <button
                type="button"
                className={buttonClass}
                disabled={buttonDisabled}
                title={tooltipText}
                onClick={() => onProcessNotification(customer)}
              >
                {buttonContent}
              </button>
            </div>
          </td>
        </tr>
      );
    });
  };

  return (
    <div className="table-card-wrapper">
      <div className="table-container">
        <table className="enterprise-table">
          <thead>
            <tr>
              <th>Müşteri No</th>
              <th>Müşteri Adı</th>
              <th>Müşteri Soyadı</th>
              <th>Müşteri TCKN</th>
              <th>Müşteri Durumu</th>
              <th>Şube Kod</th>
              <th>Şube Adı</th>
              <th>Kullandırılabilir Ürün Önerisi</th>
              <th className="th-center">E-posta İletişim Onay</th>
              <th className="th-center">SMS İletişim Onay</th>
              <th className="th-center">Dijital Belge Süreç Onay</th>
              <th className="th-center">Bildirim Durumu</th>
              <th className="th-center">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {renderTableBody()}
          </tbody>
        </table>
      </div>

      {pagination && (
        <Pagination
          page={pagination.page}
          limit={pagination.limit}
          totalCount={pagination.totalCount}
          totalPages={pagination.totalPages}
          hasNextPage={pagination.hasNextPage}
          hasPrevPage={pagination.hasPrevPage}
          onPageChange={pagination.onPageChange}
          onLimitChange={pagination.onLimitChange}
        />
      )}

      {selectedCustomerForHistory && (
        <AuditHistoryModal
          customer={selectedCustomerForHistory}
          onClose={() => setSelectedCustomerForHistory(null)}
        />
      )}
    </div>
  );
};
