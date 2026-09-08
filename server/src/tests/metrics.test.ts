import '../config/env';
import request from 'supertest';
import {
  register,
  outboxPendingMessagesGauge,
  outboxPublishedCounter,
  outboxFailedCounter,
  httpRequestDurationSeconds,
  securityValidationFailuresTotal,
  notificationStateTransitionTotal,
} from '../config/metrics';
import app from '../app';

describe('Prometheus Metrics', () => {
  it('registers default and custom metrics', async () => {
    const metricsText = await register.metrics();
    expect(metricsText).toContain('outbox_pending_messages');
    expect(metricsText).toContain('outbox_published_total');
    expect(metricsText).toContain('outbox_failed_total');
    expect(metricsText).toContain('security_validation_failures_total');
    expect(metricsText).toContain('notification_state_transition_total');
    expect(metricsText).toContain('http_request_duration_seconds');
  });

  it('updates pending messages gauge', async () => {
    outboxPendingMessagesGauge.set(42);
    const metricsText = await register.metrics();
    expect(metricsText).toContain('outbox_pending_messages 42');
  });

  it('increments outbox published and failed counters', async () => {
    outboxPublishedCounter.inc(5);
    outboxFailedCounter.inc(2);
    const metricsText = await register.metrics();
    expect(metricsText).toContain('outbox_published_total 5');
    expect(metricsText).toContain('outbox_failed_total 2');
  });

  it('tracks security failures and state transitions', async () => {
    securityValidationFailuresTotal.inc({ reason: 'PERSONNEL_RESTRICTION', channel: 'NONE' });
    notificationStateTransitionTotal.inc({ from_state: 'NONE', to_state: 'QUEUED', channel: 'DIGITAL' });

    const metricsText = await register.metrics();
    expect(metricsText).toContain('security_validation_failures_total{reason="PERSONNEL_RESTRICTION",channel="NONE"} 1');
    expect(metricsText).toContain('notification_state_transition_total{from_state="NONE",to_state="QUEUED",channel="DIGITAL"} 1');
  });

  it('records request duration observations in histogram', async () => {
    httpRequestDurationSeconds.observe(
      { method: 'POST', route: '/api/wall/process-notification', status_code: '200' },
      0.045
    );
    const metricsText = await register.metrics();
    expect(metricsText).toContain(
      'http_request_duration_seconds_count{method="POST",route="/api/wall/process-notification",status_code="200"} 1'
    );
  });

  it('serves Prometheus metrics via /metrics endpoint', async () => {
    const res = await request(app).get('/metrics');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/plain');
    expect(res.text).toContain('outbox_pending_messages');
  });

  it('normalizes unknown routes to prevent high cardinality', async () => {
    const randomBotPath = '/wp-login-' + Math.random().toString(36).substring(7);
    const botRes = await request(app).get(randomBotPath);
    expect(botRes.status).toBe(404);

    const metricsRes = await request(app).get('/metrics');
    expect(metricsRes.text).not.toContain(randomBotPath);
    expect(metricsRes.text).toContain('route="unmatched_route"');
  });
});
