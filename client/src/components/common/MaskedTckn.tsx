import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface MaskedTcknProps {
  tckn: string;
}

export const MaskedTckn: React.FC<MaskedTcknProps> = ({ tckn }) => {
  const [isVisible, setIsVisible] = useState<boolean>(false);

  const formatMasked = (val: string): string => {
    if (!val || val.length < 11) return val || '-';
    return `${val.substring(0, 3)}*****${val.substring(8)}`;
  };

  const toggleVisibility = () => {
    setIsVisible((prev) => !prev);
  };

  return (
    <div className="masked-tckn-container">
      <span className="tckn-value" title={isVisible ? 'KVKK Korumalı TCKN' : 'Maskelenmiş TCKN'}>
        {isVisible ? tckn : formatMasked(tckn)}
      </span>
      <button
        type="button"
        className="tckn-toggle-btn"
        onClick={toggleVisibility}
        aria-label={isVisible ? 'TCKN Gizle' : 'TCKN Göster'}
        title={isVisible ? 'TCKN Gizle' : 'TCKN Göster (KVKK)'}
      >
        {isVisible ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
    </div>
  );
};
