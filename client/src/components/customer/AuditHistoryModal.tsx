import React, { useEffect, useState } from 'react';
import { CustomerUIModel } from '../../types/customer.types';
import { CustomerApiService } from '../../services/customerApi';
import { AuditLogItem } from '../../types/api.types';
import { NotificationStatus } from '../common/StatusBadge';
import {
  X,
  History,
  Clock,
  User,
  ShieldCheck,
  Lock,
  AlertTriangle,
  Info,
} from 'lucide-react';

interface AuditHistoryModalProps {
  customer: CustomerUIModel | null;
  onClose: () => void;
}

export const AuditHistoryModal: React.FC<AuditHistoryModalProps> = ({ customer, onClose }) => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isForbidden, setIsForbidden] = useState<boolean>(false);
  const [forbiddenMessage, setForbiddenMessage] = useState<string>('');
  const [generalError, setGeneralError] = useState<string | null>(null);

  useEffect(() => {
    if (!customer) return;

    let isMounted = true;
    setIsLoading(true);
    setIsForbidden(false);
    setForbiddenMessage('');
    setGeneralError(null);

    CustomerApiService.fetchCustomerAuditHistory(customer.musteriNo)
      .then((res) => {
        if (!isMounted) return;

        if (res.success) {
          setLogs(res.logs);
        } else if (res.isForbidden) {
          setIsForbidden(true);
          setForbiddenMessage(res.message);
        } else {
          setGeneralError(res.message);
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [customer]);

  if (!customer) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
        {/* Modal Başlığı */}
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-icon-badge">
              <History size={18} className="modal-icon" />
            </div>
            <div>
              <h3 className="modal-title">Müşteri Denetim Geçmişi</h3>
              <p className="modal-subtitle">
                Müşteri: <strong>{customer.musteriAdi} {customer.musteriSoyadi}</strong> (No: {customer.musteriNo})
              </p>
            </div>
          </div>
          <button type="button" className="btn-modal-close" onClick={onClose} title="Kapat">
            <X size={18} />
          </button>
        </div>

        {/* Modal Gövdesi */}
        <div className="modal-body">
          {isLoading ? (
            <div className="modal-loading">
              <span className="inline-spinner" />
              <span className="loading-text">Denetim kayıtları yükleniyor...</span>
            </div>
          ) : isForbidden ? (
            <div className="security-restricted-card">
              <div className="restricted-card-header">
                <div className="restricted-icon-bubble">
                  <Lock size={22} />
                </div>
                <div>
                  <h4 className="restricted-title">Mesai Saatleri Dışı Erişim Kısıtlaması</h4>
                  <span className="restricted-badge">Yetki Kısıtı (403 Forbidden)</span>
                </div>
              </div>

              <div className="restricted-card-body">
                <p className="restricted-desc">
                  {forbiddenMessage || 'Müşteri bildirim denetim ve onay geçmişi kayıtları, bilgi güvenliği standartları gereğince yalnızca hafta içi mesai saatlerinde (09:00 - 18:00) şube personeli erişimine açıktır.'}
                </p>

                <div className="restricted-info-note">
                  <Info size={14} className="note-icon" />
                  <span>Mesai saatleri içerisinde tekrar erişebilir veya yetkili müfettiş / teftiş biriminizle iletişime geçebilirsiniz.</span>
                </div>
              </div>
            </div>
          ) : generalError ? (
            <div className="modal-error-banner">
              <AlertTriangle size={18} />
              <span>{generalError}</span>
            </div>
          ) : logs.length === 0 ? (
            <div className="modal-empty">
              <p>Bu müşteriye ait henüz bir bildirim denetim kaydı bulunmuyor.</p>
            </div>
          ) : (
            <div className="audit-table-wrapper">
              <div className="audit-table-meta-bar">
                <span className="meta-badge-success">
                  <ShieldCheck size={14} />
                  <span>Toplam {logs.length} Denetim Kaydı Bulundu</span>
                </span>
              </div>

              <table className="audit-history-table">
                <thead>
                  <tr>
                    <th>Tarih &amp; Saat</th>
                    <th>İşlem Kodu</th>
                    <th>Ürün</th>
                    <th className="th-center">Bildirim Durumu</th>
                    <th>İşlem Yapan Sicil</th>
                    <th>Outbox Message ID</th>
                    <th>Açıklama</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log, index) => {
                    const rawTimestamp = log.bildirimZmn || log.kayitZmn;
                    const formattedDate = rawTimestamp
                      ? new Date(rawTimestamp).toLocaleString('tr-TR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })
                      : '-';

                    return (
                      <tr key={log.id || index}>
                        <td className="cell-date">
                          <div className="audit-table-time">
                            <Clock size={12} className="time-icon" />
                            <span>{formattedDate}</span>
                          </div>
                        </td>
                        <td>
                          <span className="code-badge">{log.islemKodu || 'N/A'}</span>
                        </td>
                        <td className="cell-product">{log.kullandirilabilirUrun || '-'}</td>
                        <td className="td-center">
                          <NotificationStatus durum={log.bildirimDurumu || 'Yapılmadı'} />
                        </td>
                        <td className="cell-user">
                          <span className="user-badge">
                            <User size={11} />
                            <span>{log.kayitYapan || log.guncellemeYapan || '-'}</span>
                          </span>
                        </td>
                        <td>
                          <span className="outbox-badge" title={log.outboxMessageId || ''}>
                            {log.outboxMessageId ? `${log.outboxMessageId.substring(0, 13)}...` : '-'}
                          </span>
                        </td>
                        <td className="cell-explanation">
                          {log.islemAck ? (
                            <span className="explanation-text" title={log.islemAck}>
                              {log.islemAck}
                            </span>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Alt Kısmı */}
        <div className="modal-footer">
          <button type="button" className="btn-modal-action" onClick={onClose}>
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
