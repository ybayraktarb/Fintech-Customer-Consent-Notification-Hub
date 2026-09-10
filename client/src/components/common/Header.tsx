import React from 'react';
import { Building2, User, ShieldCheck } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="corporate-header">
      <div className="header-left">
        <div className="brand-logo-badge">
          <Building2 size={20} className="brand-icon" />
        </div>
        <div>
          <h1 className="header-title">Fintech Müşteri Onay &amp; Bildirim Yönetim Sistemi</h1>
          <span className="header-sub-tag">Kurumsal Şube Portalı &bull; Güvenli Erişim</span>
        </div>
      </div>

      <div className="header-right">
        <div className="user-profile-badge" title="Aktif Kullanıcı Oturumu">
          <div className="user-avatar-circle">
            <User size={16} />
          </div>
          <div className="user-profile-info">
            <div className="user-profile-title">
              <span className="user-status-dot" title="Aktif Oturum" />
              <span>Sicil: P10842 &bull; Levent Şube</span>
            </div>
            <div className="user-profile-subtitle">
              <ShieldCheck size={11} className="inline-role-icon" />
              <span>Şube Operasyon Yetkilisi</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
