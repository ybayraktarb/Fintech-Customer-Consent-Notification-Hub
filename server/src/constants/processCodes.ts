export const PROCESS_CODES = {
  APPROVED_DIGITAL: 'APPROVED_DIGITAL',
  APPROVED_BRANCH_CALL: 'APPROVED_BRANCH_CALL',
  REJECTED_NO_CONSENT: 'REJECTED_NO_CONSENT',
  RESTRICTED_STAFF: 'RESTRICTED_STAFF',
  ERR_VALIDATION_FAILED: 'ERR_VALIDATION_FAILED',
  ERR_SYSTEM_INTERNAL: 'ERR_SYSTEM_INTERNAL',
} as const;

export type ProcessCodeType = typeof PROCESS_CODES[keyof typeof PROCESS_CODES];

export const PROCESS_MESSAGES: Record<ProcessCodeType, string> = {
  [PROCESS_CODES.APPROVED_DIGITAL]: 'Musteri ürün bilgilendirmesi yapıldı.Surec dijital olarak devam ettirilebilir',
  [PROCESS_CODES.APPROVED_BRANCH_CALL]: 'Musteri ürün bilgilendirmesi yapıldı. Şubeye çağırmak icin aranabilir',
  [PROCESS_CODES.REJECTED_NO_CONSENT]: 'İletişim onayı bulunmamaktadır.',
  [PROCESS_CODES.RESTRICTED_STAFF]: 'Banka personeli statüsündeki müşterilere standart ürün pazarlama bildirimi yapılamaz.',
  [PROCESS_CODES.ERR_VALIDATION_FAILED]: 'Geçersiz müşteri istek parametresi.',
  [PROCESS_CODES.ERR_SYSTEM_INTERNAL]: 'Sistemde beklenmeyen bir hata oluştu.',
};
