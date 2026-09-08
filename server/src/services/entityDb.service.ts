import { NotificationRequestDTO } from '../dtos/notification.dto';
import { CustomerNotificationEntity, NotificationStatusType } from '../entities/customerNotification.entity';
import {
  CustomerNotificationRepository,
  ICustomerNotificationRepository,
} from '../repositories/customerNotification.repository';
import {
  OutboxRepository,
  IOutboxRepository,
} from '../repositories/outbox.repository';
import { prisma } from '../config/prisma';

export interface OutboxEventData {
  eventType: string;
  channel: 'DIGITAL' | 'BRANCH_CALL';
  correlationId?: string;
  islemKodu?: string;
  islemAck?: string;
}

export class EntityDbService {
  private readonly repository: ICustomerNotificationRepository;
  private readonly outboxRepository: IOutboxRepository;

  constructor(
    repository: ICustomerNotificationRepository = CustomerNotificationRepository.getInstance(),
    outboxRepository: IOutboxRepository = OutboxRepository.getInstance()
  ) {
    this.repository = repository;
    this.outboxRepository = outboxRepository;
  }

  public async saveNotificationEntity(
    dto: NotificationRequestDTO,
    bildirimDurumu: NotificationStatusType = 'QUEUED'
  ): Promise<CustomerNotificationEntity> {
    const now = new Date().toISOString();
    const operatorSicil = dto.islemYapanSicil || 'P10842';
    const uniqueId = `REC_${dto.musteriNo}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const entity: CustomerNotificationEntity = {
      id: uniqueId,
      musteriNo: dto.musteriNo,
      musteriAdi: dto.musteriAdi,
      musteriSoyadi: dto.musteriSoyadi,
      musteriTckn: dto.musteriTckn,
      musteriDurumu: dto.musteriDurumu,
      subeKod: dto.subeKod,
      subeAdi: dto.subeAdi,
      kullandirilabilirUrun: dto.kullandirilabilirUrun,
      epostaOnay: dto.epostaOnay,
      smsOnay: dto.smsOnay,
      dijitalBelgeSurecOnay: dto.dijitalBelgeSurecOnay,
      bildirimDurumu,
      isActive: true,
      kayitYapan: operatorSicil,
      kayitZmn: now,
      guncellemeYapan: operatorSicil,
      guncellemeZmn: now,
      bildirimZmn: now,
    };

    return await this.repository.save(entity);
  }

  public async saveNotificationWithOutbox(
    dto: NotificationRequestDTO,
    outboxEvent: OutboxEventData,
    bildirimDurumu: NotificationStatusType = 'QUEUED'
  ): Promise<{ notification: CustomerNotificationEntity; outboxId: string }> {
    const now = new Date().toISOString();
    const operatorSicil = dto.islemYapanSicil || 'P10842';
    const uniqueLogId = `REC_${dto.musteriNo}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    return await prisma.$transaction(async (tx) => {
      const outboxPayload = {
        eventType: outboxEvent.eventType,
        musteriNo: dto.musteriNo,
        musteriAdi: dto.musteriAdi,
        musteriSoyadi: dto.musteriSoyadi,
        musteriTckn: dto.musteriTckn,
        channel: outboxEvent.channel,
        product: dto.kullandirilabilirUrun,
        contactChannels: {
          email: Boolean(dto.epostaOnay),
          sms: Boolean(dto.smsOnay),
        },
        operatorSicil,
        timestamp: now,
      };

      const savedOutbox = await this.outboxRepository.createTransactional(tx, {
        eventType: outboxEvent.eventType,
        payload: outboxPayload,
        correlationId: outboxEvent.correlationId,
      });

      const entity: CustomerNotificationEntity = {
        id: uniqueLogId,
        musteriNo: dto.musteriNo,
        musteriAdi: dto.musteriAdi,
        musteriSoyadi: dto.musteriSoyadi,
        musteriTckn: dto.musteriTckn,
        musteriDurumu: dto.musteriDurumu,
        subeKod: dto.subeKod,
        subeAdi: dto.subeAdi,
        kullandirilabilirUrun: dto.kullandirilabilirUrun,
        epostaOnay: dto.epostaOnay,
        smsOnay: dto.smsOnay,
        dijitalBelgeSurecOnay: dto.dijitalBelgeSurecOnay,
        bildirimDurumu,
        islemKodu: outboxEvent.islemKodu,
        islemAck: outboxEvent.islemAck,
        outboxMessageId: savedOutbox.id,
        isActive: true,
        kayitYapan: operatorSicil,
        kayitZmn: now,
        guncellemeYapan: operatorSicil,
        guncellemeZmn: now,
        bildirimZmn: now,
      };

      const savedNotification = await this.repository.saveTransactional(tx, entity);

      return {
        notification: savedNotification,
        outboxId: savedOutbox.id,
      };
    });
  }

  public async getAllAuditLogs(): Promise<CustomerNotificationEntity[]> {
    return await this.repository.findAll();
  }

  public async getHistoryByMusteriNo(musteriNo: string): Promise<CustomerNotificationEntity[]> {
    return await this.repository.findHistoryByMusteriNo(musteriNo);
  }

  public async getByMusteriNo(musteriNo: string): Promise<CustomerNotificationEntity | null> {
    return await this.repository.findByMusteriNo(musteriNo);
  }

  public getOutboxRepository(): IOutboxRepository {
    return this.outboxRepository;
  }
}
