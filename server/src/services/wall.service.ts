import { NotificationRequestDTO, NotificationResponseDTO } from '../dtos/notification.dto';
import { PROCESS_CODES, PROCESS_MESSAGES } from '../constants/processCodes';
import { EntityDbService } from './entityDb.service';
import { CustomerRepository, ICustomerRepository } from '../repositories/customer.repository';
import {
  securityValidationFailuresTotal,
  notificationStateTransitionTotal,
} from '../config/metrics';

export interface NotificationEventPayload {
  eventType: 'notification.requested';
  musteriNo: string;
  musteriAdi: string;
  musteriSoyadi: string;
  musteriTckn: string;
  channel: 'DIGITAL' | 'BRANCH_CALL';
  product: string;
  contactChannels: {
    email: boolean;
    sms: boolean;
  };
  operatorSicil: string;
  timestamp: string;
}

export class WallService {
  private readonly entityDbService: EntityDbService;
  private readonly customerRepository: ICustomerRepository;

  constructor(
    entityDbService: EntityDbService = new EntityDbService(),
    customerRepository: ICustomerRepository = CustomerRepository.getInstance()
  ) {
    this.entityDbService = entityDbService;
    this.customerRepository = customerRepository;
  }

  public async processNotification(
    dto: NotificationRequestDTO,
    correlationId?: string
  ): Promise<NotificationResponseDTO> {
    const masterCustomer = await this.customerRepository.findByMusteriNo(dto.musteriNo);

    const verifiedEpostaOnay = masterCustomer ? masterCustomer.epostaOnay : Boolean(dto.epostaOnay);
    const verifiedSmsOnay = masterCustomer ? masterCustomer.smsOnay : Boolean(dto.smsOnay);
    const verifiedDijitalOnay = masterCustomer
      ? masterCustomer.dijitalBelgeSurecOnay
      : Boolean(dto.dijitalBelgeSurecOnay);

    const verifiedDto: NotificationRequestDTO = {
      ...dto,
      musteriAdi: masterCustomer ? masterCustomer.musteriAdi : dto.musteriAdi,
      musteriSoyadi: masterCustomer ? masterCustomer.musteriSoyadi : dto.musteriSoyadi,
      musteriTckn: masterCustomer ? masterCustomer.musteriTckn : dto.musteriTckn,
      musteriDurumu: (masterCustomer ? (masterCustomer.musteriDurumu as 'Personel' | 'Musteri') : dto.musteriDurumu),
      subeKod: masterCustomer ? masterCustomer.subeKod : dto.subeKod,
      subeAdi: masterCustomer ? masterCustomer.subeAdi : dto.subeAdi,
      kullandirilabilirUrun: masterCustomer
        ? masterCustomer.kullandirilabilirUrun
        : dto.kullandirilabilirUrun,
      epostaOnay: verifiedEpostaOnay,
      smsOnay: verifiedSmsOnay,
      dijitalBelgeSurecOnay: verifiedDijitalOnay,
    };

    if (verifiedDto.musteriDurumu === 'Personel') {
      securityValidationFailuresTotal.inc({
        reason: 'PERSONNEL_RESTRICTION',
        channel: 'NONE',
      });
      return {
        islemKodu: PROCESS_CODES.RESTRICTED_STAFF,
        islemAck: PROCESS_MESSAGES[PROCESS_CODES.RESTRICTED_STAFF],
      };
    }

    const hasContactConsent = Boolean(verifiedEpostaOnay || verifiedSmsOnay);

    if (!hasContactConsent) {
      securityValidationFailuresTotal.inc({
        reason: 'NO_CONTACT_CONSENT',
        channel: 'NONE',
      });
      return {
        islemKodu: PROCESS_CODES.REJECTED_NO_CONSENT,
        islemAck: PROCESS_MESSAGES[PROCESS_CODES.REJECTED_NO_CONSENT],
      };
    }

    const hasDigitalConsent = Boolean(verifiedDijitalOnay);
    const channel: 'DIGITAL' | 'BRANCH_CALL' = hasDigitalConsent ? 'DIGITAL' : 'BRANCH_CALL';

    await this.entityDbService.saveNotificationWithOutbox(
      verifiedDto,
      {
        eventType: 'notification.requested',
        channel,
        correlationId,
      },
      'Yapıldı'
    );

    notificationStateTransitionTotal.inc({
      from_state: 'NONE',
      to_state: 'QUEUED',
      channel,
    });

    if (!hasDigitalConsent) {
      return {
        islemKodu: PROCESS_CODES.APPROVED_BRANCH_CALL,
        islemAck: PROCESS_MESSAGES[PROCESS_CODES.APPROVED_BRANCH_CALL],
      };
    }

    return {
      islemKodu: PROCESS_CODES.APPROVED_DIGITAL,
      islemAck: PROCESS_MESSAGES[PROCESS_CODES.APPROVED_DIGITAL],
    };
  }
}
