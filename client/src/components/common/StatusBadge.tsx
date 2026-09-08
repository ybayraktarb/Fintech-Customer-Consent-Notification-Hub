import React from 'react';
import { MusteriDurumu, BildirimDurumu, UrunOnerisi } from '../../types/customer.types';

interface ConsentStatusProps {
  approved: boolean;
}

export const ConsentStatus: React.FC<ConsentStatusProps> = ({ approved }) => {
  return (
    <span className={approved ? 'text-consent-yes' : 'text-consent-no'}>
      {approved ? 'Evet' : 'Hayır'}
    </span>
  );
};

interface CustomerTypeStatusProps {
  durum: MusteriDurumu;
}

export const CustomerTypeStatus: React.FC<CustomerTypeStatusProps> = ({ durum }) => {
  return <span>{durum}</span>;
};

interface NotificationStatusProps {
  durum: BildirimDurumu;
}

export const NotificationStatus: React.FC<NotificationStatusProps> = ({ durum }) => {
  if (durum === 'İletildi' || durum === 'Yapıldı' || durum === 'DELIVERED') {
    return <span className="badge-status badge-status-delivered">İletildi</span>;
  }
  if (durum === 'Kuyrukta' || durum === 'QUEUED') {
    return <span className="badge-status badge-status-queued">Kuyrukta</span>;
  }
  if (durum === 'İletilemedi' || durum === 'Hata' || durum === 'FAILED') {
    return <span className="badge-status badge-status-failed">İletilemedi</span>;
  }
  return <span className="badge-status badge-status-unprocessed">Yapılmadı</span>;
};

interface ProductDisplayProps {
  urun: UrunOnerisi | string;
}

export const ProductDisplay: React.FC<ProductDisplayProps> = ({ urun }) => {
  return <span className="product-text">{urun}</span>;
};
