import React, { useEffect, useState } from 'react';
import { CustomerUIModel } from '../../types/customer.types';
import { CustomerApiService } from '../../services/customerApi';
import { NotificationStatus } from '../common/StatusBadge';
import { X, History, Clock, User, ShieldCheck } from 'lucide-react';

interface AuditHistoryModalProps {
  customer: CustomerUIModel | null;
  onClose: () => void;
}

export const AuditHistoryModal: React.FC<AuditHistoryModalProps> = ({ customer, onClose }) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!customer) return;

    let isMounted = true;
    setIsLoading(true);

    CustomerApiService.fetchCustomerAuditHistory(customer.musteriNo)
      .then((data) => {
        if (isMounted) setLogs(data);
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
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <History size={18} className="modal-icon" />
            <div>
              <h3 className="modal-title">Bildirim Denetim Geçmişi (Audit Trail)</h3>
              <p className="modal-subtitle">
                Müşteri: <strong>{customer.musteriAdi} {customer.musteriSoyadi}</strong> (No: {customer.musteriNo})
              </p>
            </div>
          </div>
          <button type="button" className="btn-modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {isLoading ? (
            <div className="modal-loading">
              <span className="loading-text">Denetim logları yükleniyor...</span>
            </div>
          ) : logs.length === 0 ? (
            <div className="modal-empty">
              <p>Bu müşteriye ait henüz bir bildirim denetim kaydı bulunmuyor.</p>
            </div>
          ) : (
            <div className="audit-timeline">
              {logs.map((log, index) => {
                const formattedDate = new Date(log.bildirimZmn || log.kayitZmn).toLocaleString('tr-TR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                });

                return (
                  <div key={log.id || index} className="audit-card">
                    <div className="audit-card-header">
                      <div className="audit-time">
                        <Clock size={13} />
                        <span>{formattedDate}</span>
                      </div>
                      <NotificationStatus durum={log.bildirimDurumu} />
                    </div>

                    <div className="audit-details-grid">
                      <div>
                        <span className="audit-field-label">İşlem Kodu:</span>
                        <span className="audit-field-value code-font">{log.islemKodu || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="audit-field-label">Ürün:</span>
                        <span className="audit-field-value">{log.kullandirilabilirUrun || '-'}</span>
                      </div>
                      <div>
                        <span className="audit-field-label">İşlem Yapan Sicil:</span>
                        <span className="audit-field-value">
                          <User size={12} className="inline-icon" /> {log.kayitYapan || log.guncellemeYapan || 'P10842'}
                        </span>
                      </div>
                      <div>
                        <span className="audit-field-label">Outbox Event ID:</span>
                        <span className="audit-field-value code-font outbox-id">{log.outboxMessageId || '-'}</span>
                      </div>
                    </div>

                    {log.islemAck && (
                      <div className="audit-explanation">
                        <ShieldCheck size={14} className="audit-exp-icon" />
                        <span>{log.islemAck}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-modal-action" onClick={onClose}>
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
