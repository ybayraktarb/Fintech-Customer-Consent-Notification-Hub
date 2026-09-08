import http from 'http';
import client from 'prom-client';

export const workerRegister = new client.Registry();

// Default Node.js runtime metrics
client.collectDefaultMetrics({ register: workerRegister, prefix: 'fintech_worker_' });

// Consumer metrics
export const workerProcessedCounter = new client.Counter({
  name: 'worker_processed_messages_total',
  help: 'Toplam işlenen bildirim sayısı',
  registers: [workerRegister],
});

export const workerIdempotentSkipsCounter = new client.Counter({
  name: 'worker_idempotent_skips_total',
  help: 'Mükerrer olduğu için atlanan bildirim sayısı',
  registers: [workerRegister],
});

export const workerDlqCounter = new client.Counter({
  name: 'worker_dlq_messages_total',
  help: 'Dead Letter Queue kuyruğuna aktarılan mesaj sayısı',
  registers: [workerRegister],
});

export const workerNotificationStateTransitionTotal = new client.Counter({
  name: 'notification_state_transition_total',
  help: 'Worker bildirim durum makinesi durum geçiş toplamı',
  labelNames: ['from_state', 'to_state', 'channel'],
  registers: [workerRegister],
});

let serverInstance: http.Server | null = null;

/**
 * Starts standalone HTTP server to expose Prometheus /metrics endpoint.
 */
export function startMetricsServer(port: number = 5002): http.Server {
  if (serverInstance) {
    return serverInstance;
  }

  serverInstance = http.createServer(async (req, res) => {
    if (req.url === '/metrics') {
      res.writeHead(200, { 'Content-Type': workerRegister.contentType });
      res.end(await workerRegister.metrics());
    } else if (req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'UP', service: 'musteri-onay-worker' }));
    } else {
      res.writeHead(404);
      res.end();
    }
  });

  serverInstance.listen(port, '0.0.0.0', () => {
    console.log(`[WORKER METRICS]: Prometheus metrik sunucusu http://0.0.0.0:${port}/metrics adresinde aktif.`);
  });

  return serverInstance;
}

/**
 * Gracefully terminates the metrics HTTP server.
 */
export async function stopMetricsServer(): Promise<void> {
  if (serverInstance) {
    await new Promise<void>((resolve) => {
      serverInstance?.close(() => resolve());
    });
    serverInstance = null;
    console.log('[WORKER METRICS]: Metrik sunucusu durduruldu.');
  }
}
