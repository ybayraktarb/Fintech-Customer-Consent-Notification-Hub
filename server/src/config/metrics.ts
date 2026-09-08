import client from 'prom-client';

export const register = new client.Registry();

// Default Node.js runtime metrics
client.collectDefaultMetrics({
  register,
  prefix: 'fintech_api_',
});

// Outbox flow metrics
export const outboxPendingMessagesGauge = new client.Gauge({
  name: 'outbox_pending_messages',
  help: 'Outbox tablosunda henüz iletilmemiş bekleyen mesaj sayısı',
  registers: [register],
});

export const outboxPublishedCounter = new client.Counter({
  name: 'outbox_published_total',
  help: 'Broker tarafından onaylanan (ACK) toplam outbox mesaj sayısı',
  registers: [register],
});

export const outboxFailedCounter = new client.Counter({
  name: 'outbox_failed_total',
  help: 'Maksimum deneme sonrası başarısızlığa uğrayan toplam mesaj sayısı',
  registers: [register],
});

// Security & Observability metrics
export const securityValidationFailuresTotal = new client.Counter({
  name: 'security_validation_failures_total',
  help: 'Güvenlik ve master veri doğrulamasında reddedilen istek sayısı',
  labelNames: ['reason', 'channel'],
  registers: [register],
});

export const notificationStateTransitionTotal = new client.Counter({
  name: 'notification_state_transition_total',
  help: 'Bildirim durum makinesi durum geçiş toplamı',
  labelNames: ['from_state', 'to_state', 'channel'],
  registers: [register],
});

// HTTP RED metrics (Rate, Errors, Duration)
export const httpRequestDurationSeconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP istek süresi gecikme dağılımı (saniye)',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [register],
});

export const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Toplam HTTP istek sayısı',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});
