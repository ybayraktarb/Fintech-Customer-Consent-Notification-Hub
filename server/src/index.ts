import app from './app';
import { ENV } from './config/env';
import { autoSeedDatabase } from './config/initDb';
import { OutboxRelayService } from './services/outboxRelay.service';

const outboxRelay = OutboxRelayService.getInstance();

const server = app.listen(ENV.PORT, async () => {
  console.log(`[Server] Port: ${ENV.PORT}`);
  await autoSeedDatabase();
  outboxRelay.start(2000);
});

const handleShutdown = async (signal: string) => {
  console.log(`[Server] ${signal} received, closing HTTP server and Outbox Relay.`);
  await outboxRelay.stop();
  server.close(() => {
    process.exit(0);
  });
};

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));
