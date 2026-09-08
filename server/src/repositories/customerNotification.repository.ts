import { prisma } from '../config/prisma';
import { Prisma } from '@prisma/client';
import { CustomerNotificationEntity, NotificationStatusType } from '../entities/customerNotification.entity';

export interface ICustomerNotificationRepository {
  save(entity: CustomerNotificationEntity): Promise<CustomerNotificationEntity>;
  saveTransactional(
    tx: Prisma.TransactionClient,
    entity: CustomerNotificationEntity
  ): Promise<CustomerNotificationEntity>;
  findByMusteriNo(musteriNo: string): Promise<CustomerNotificationEntity | null>;
  findHistoryByMusteriNo(musteriNo: string): Promise<CustomerNotificationEntity[]>;
  updateStatusByOutboxId(outboxMessageId: string, bildirimDurumu: NotificationStatusType): Promise<void>;
  findAll(): Promise<CustomerNotificationEntity[]>;
}

export class CustomerNotificationRepository implements ICustomerNotificationRepository {
  private static instance: CustomerNotificationRepository;

  private constructor() {}

  public static getInstance(): CustomerNotificationRepository {
    if (!CustomerNotificationRepository.instance) {
      CustomerNotificationRepository.instance = new CustomerNotificationRepository();
    }
    return CustomerNotificationRepository.instance;
  }

  /**
   * Yeni bir denetim kaydı ekler (INSERT). Müşteri geçmişini korur.
   */
  public async save(entity: CustomerNotificationEntity): Promise<CustomerNotificationEntity> {
    const data = {
      id: entity.id,
      musteriNo: entity.musteriNo,
      musteriAdi: entity.musteriAdi,
      musteriSoyadi: entity.musteriSoyadi,
      musteriTckn: entity.musteriTckn,
      musteriDurumu: entity.musteriDurumu,
      subeKod: entity.subeKod,
      subeAdi: entity.subeAdi,
      kullandirilabilirUrun: entity.kullandirilabilirUrun,
      epostaOnay: entity.epostaOnay,
      smsOnay: entity.smsOnay,
      dijitalBelgeSurecOnay: entity.dijitalBelgeSurecOnay,
      bildirimDurumu: entity.bildirimDurumu,
      islemKodu: entity.islemKodu,
      islemAck: entity.islemAck,
      outboxMessageId: entity.outboxMessageId,
      isActive: entity.isActive,
      kayitYapan: entity.kayitYapan,
      kayitZmn: new Date(entity.kayitZmn),
      guncellemeYapan: entity.guncellemeYapan,
      guncellemeZmn: new Date(entity.guncellemeZmn),
      bildirimZmn: new Date(entity.bildirimZmn),
    };

    const saved = await prisma.customerNotificationLog.create({
      data,
    });

    return this.mapToEntity(saved);
  }

  /**
   * ACID Transaction içinde yeni bir denetim kaydı ekler (INSERT).
   */
  public async saveTransactional(
    tx: Prisma.TransactionClient,
    entity: CustomerNotificationEntity
  ): Promise<CustomerNotificationEntity> {
    const data = {
      id: entity.id,
      musteriNo: entity.musteriNo,
      musteriAdi: entity.musteriAdi,
      musteriSoyadi: entity.musteriSoyadi,
      musteriTckn: entity.musteriTckn,
      musteriDurumu: entity.musteriDurumu,
      subeKod: entity.subeKod,
      subeAdi: entity.subeAdi,
      kullandirilabilirUrun: entity.kullandirilabilirUrun,
      epostaOnay: entity.epostaOnay,
      smsOnay: entity.smsOnay,
      dijitalBelgeSurecOnay: entity.dijitalBelgeSurecOnay,
      bildirimDurumu: entity.bildirimDurumu,
      islemKodu: entity.islemKodu,
      islemAck: entity.islemAck,
      outboxMessageId: entity.outboxMessageId,
      isActive: entity.isActive,
      kayitYapan: entity.kayitYapan,
      kayitZmn: new Date(entity.kayitZmn),
      guncellemeYapan: entity.guncellemeYapan,
      guncellemeZmn: new Date(entity.guncellemeZmn),
      bildirimZmn: new Date(entity.bildirimZmn),
    };

    const saved = await tx.customerNotificationLog.create({
      data,
    });

    return this.mapToEntity(saved);
  }

  public async findByMusteriNo(musteriNo: string): Promise<CustomerNotificationEntity | null> {
    const log = await prisma.customerNotificationLog.findFirst({
      where: { musteriNo },
      orderBy: { bildirimZmn: 'desc' },
    });

    if (!log) return null;
    return this.mapToEntity(log);
  }

  public async findHistoryByMusteriNo(musteriNo: string): Promise<CustomerNotificationEntity[]> {
    const logs = await prisma.customerNotificationLog.findMany({
      where: { musteriNo },
      orderBy: { bildirimZmn: 'desc' },
    });

    return logs.map((l) => this.mapToEntity(l));
  }

  public async updateStatusByOutboxId(
    outboxMessageId: string,
    bildirimDurumu: NotificationStatusType
  ): Promise<void> {
    await prisma.customerNotificationLog.updateMany({
      where: { outboxMessageId },
      data: {
        bildirimDurumu,
        guncellemeZmn: new Date(),
      },
    });
  }

  public async findAll(): Promise<CustomerNotificationEntity[]> {
    const logs = await prisma.customerNotificationLog.findMany({
      orderBy: { bildirimZmn: 'desc' },
    });

    return logs.map((log) => this.mapToEntity(log));
  }

  private mapToEntity(row: any): CustomerNotificationEntity {
    return {
      id: row.id,
      musteriNo: row.musteriNo,
      musteriAdi: row.musteriAdi,
      musteriSoyadi: row.musteriSoyadi,
      musteriTckn: row.musteriTckn,
      musteriDurumu: row.musteriDurumu,
      subeKod: row.subeKod,
      subeAdi: row.subeAdi,
      kullandirilabilirUrun: row.kullandirilabilirUrun,
      epostaOnay: row.epostaOnay,
      smsOnay: row.smsOnay,
      dijitalBelgeSurecOnay: row.dijitalBelgeSurecOnay,
      bildirimDurumu: row.bildirimDurumu as NotificationStatusType,
      islemKodu: row.islemKodu,
      islemAck: row.islemAck,
      outboxMessageId: row.outboxMessageId,
      isActive: row.isActive,
      kayitYapan: row.kayitYapan,
      kayitZmn: row.kayitZmn ? new Date(row.kayitZmn).toISOString() : new Date().toISOString(),
      guncellemeYapan: row.guncellemeYapan,
      guncellemeZmn: row.guncellemeZmn ? new Date(row.guncellemeZmn).toISOString() : new Date().toISOString(),
      bildirimZmn: row.bildirimZmn ? new Date(row.bildirimZmn).toISOString() : new Date().toISOString(),
    };
  }
}
