# Fintech Customer Consent & Notification Hub

Müşteri iletişim ve dijital süreç onaylarına göre bildirim kanalını (dijital bildirim veya şube araması) belirleyen karar motoru ve asenkron bildirim yönetim sistemi.

## Mimari

Sistem; REST API, Transactional Outbox deseni, RabbitMQ mesaj kuyruğu, kuyruğu tüketen bir Worker servisi ve şube personelinin kayıtları yönetebildiği bir React arayüzünden oluşur.

![Sistem Mimarisi ve Docker Compose](./docs/images/docker-compose.png)

### Temel Bileşenler
- **client:** Şube personeli için onay ve denetim geçmişi yönetim arayüzü (React + Vite).
- **server:** Karar motoru (WallService), REST API ve Outbox Relay servisi (Express + Prisma).
- **worker:** RabbitMQ üzerinden gelen bildirim mesajlarını tekilleştirerek (idempotent) işleyen tüketici servis.
- **monitoring:** Prometheus metrikleri ve Grafana panoları.

![Müşteri Onay ve Bildirim Yönetim Paneli](./docs/images/musteri.png)

## Karar Motoru Kuralları

Gelen bildirim talepleri müşterinin statüsüne ve onay tercihlerine göre değerlendirilir:

| Senaryo | Müşteri Statüsü | İletişim İzni (SMS/E-posta) | Dijital Belge İzni | İşlem Kodu | Sonuç |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Banka Personeli** | Personel | - | - | `RESTRICTED_STAFF` | Reddedilir, pazarlama bildirimi yapılamaz |
| **Onaysız Müşteri** | Müşteri | Yok | - | `REJECTED_NO_CONSENT` | Reddedilir, bildirim yapılamaz |
| **Şube Araması** | Müşteri | Var | Yok | `APPROVED_BRANCH_CALL` | Şube araması için kuyruğa iletilir |
| **Dijital Akış** | Müşteri | Var | Var | `APPROVED_DIGITAL` | Doğrudan dijital bildirim kuyruğuna iletilir |

![Karar Motoru Akışı](./docs/images/decision-wall.png)

## Yetkilendirme (ABAC)

Müşteri denetim kayıtlarına (`Audit Logs`) erişim, Attribute-Based Access Control (ABAC) prensiplerine göre mesai saatleri ve rol bazında sınırlandırılmıştır.

Bu altyapı için `@rubiklabs/nestjs-jacpol` kütüphanesinin PDP (*Policy Decision Point*) ve PRP (*Policy Retrieval Point*) servisleri kullanılmıştır. Kütüphane adı NestJS referansı içerse de kural motoru bağımsız bir TypeScript modülü olarak Express middleware katmanına entegre edilmiştir.

- **Şube Personeli:** Yalnızca hafta içi mesai saatlerinde (**09:00 - 18:00**, `Europe/Istanbul`) denetim kayıtlarına erişebilir. Mesai dışı ve hafta sonu istekleri `403 Forbidden` ile engellenir.
- **Müfettiş / Auditor & Admin:** Teftiş süreçleri için kayıtlara 7/24 erişebilir.
- **Varsayılan İlke:** Tanımsız roller ve mesai dışı talepler doğrudan reddedilir (`denyOverrides`).

## Kurulum ve Çalıştırma

Tüm sistemi (PostgreSQL, RabbitMQ, API, Worker, Client, Prometheus, Grafana) Docker ile ayağa kaldırmak için:

```bash
docker compose up --build
```

### Servisler ve Portlar

| Servis | Adres | Bilgi |
| :--- | :--- | :--- |
| **Web Arayüzü** | `http://localhost:8088` | React yönetim paneli |
| **Backend API** | `http://localhost:5001/api` | REST API |
| **Prometheus** | `http://localhost:9090` | Metrik toplama |
| **Grafana** | `http://localhost:3000` | İzleme panosu (Anonim erişim açık) |
| **RabbitMQ Management** | `http://localhost:15672` | `guest` / `guest` |
| **PostgreSQL** | `localhost:5439` | `musteri_onay_db` / `postgres` |

## API Uç Noktaları

- `GET /api/customers` — Müşteri listesi (arama ve sayfalama destekli)
- `POST /api/wall/process-notification` — Karar motoru üzerinden bildirim işleme ve kuyruğa iletim
- `GET /api/customers/:musteriNo/audit-logs` — Müşteri bazlı denetim geçmişi (ABAC korumalı)
- `GET /api/audit-logs` — Genel denetim kayıtları (ABAC korumalı)
- `GET /metrics` — Prometheus metrikleri (`:5001` ve `:5002`)

![Asenkron Bildirim Dağıtımı](./docs/images/notification-dispatch.png)

## Testler

```bash
# Tüm test paketlerini çalıştır
npm test

# Test kapsam raporu
npm run test:coverage

# Spesifik test grupları (server)
npm run --prefix server test:unit       
npm run --prefix server test:security    
npm run --prefix server test:e2e         
```
