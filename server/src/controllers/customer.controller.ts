import { Request, Response, NextFunction } from 'express';
import { EntityDbService } from '../services/entityDb.service';
import { PaginatedResponse } from '../dtos/pagination.dto';
import { CustomerRepository, ICustomerRepository } from '../repositories/customer.repository';
import { AppError } from '../middlewares/errorHandler.middleware';

export interface CustomerResponseDTO {
  musteriNo: string;
  musteriAdi: string;
  musteriSoyadi: string;
  musteriTckn: string;
  musteriDurumu: 'Personel' | 'Musteri' | string;
  subeKod: string;
  subeAdi: string;
  kullandirilabilirUrun: 'Kredi Kartı' | 'KMH' | 'Bireysel Kredi' | string;
  epostaOnay: boolean;
  smsOnay: boolean;
  dijitalBelgeSurecOnay: boolean;
  bildirimDurumu: string;
  butonDurumu: 'Aktif' | 'Pasif';
}

export class CustomerController {
  private readonly entityDbService: EntityDbService;
  private readonly customerRepository: ICustomerRepository;

  constructor(
    entityDbService: EntityDbService = new EntityDbService(),
    customerRepository: ICustomerRepository = CustomerRepository.getInstance()
  ) {
    this.entityDbService = entityDbService;
    this.customerRepository = customerRepository;
  }

  public getCustomers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 10));
      const search = (req.query.search as string || '').trim();

      const { items: dbCustomers, totalCount } = await this.customerRepository.findPaginated({
        page,
        limit,
        search,
      });

      const totalPages = Math.ceil(totalCount / limit) || 1;

      const items: CustomerResponseDTO[] = dbCustomers.map((c) => {
        const latestNotification = c.notifications?.[0] || null;
        const isProcessed = latestNotification && (
          latestNotification.bildirimDurumu === 'Yapıldı' ||
          latestNotification.bildirimDurumu === 'QUEUED' ||
          latestNotification.bildirimDurumu === 'DELIVERED'
        );

        let displayStatus: string = 'Yapılmadı';
        if (latestNotification) {
          if (latestNotification.bildirimDurumu === 'QUEUED') displayStatus = 'Kuyrukta';
          else if (latestNotification.bildirimDurumu === 'DELIVERED') displayStatus = 'İletildi';
          else if (latestNotification.bildirimDurumu === 'FAILED') displayStatus = 'İletilemedi';
          else displayStatus = latestNotification.bildirimDurumu;
        }

        return {
          musteriNo: c.musteriNo,
          musteriAdi: c.musteriAdi,
          musteriSoyadi: c.musteriSoyadi,
          musteriTckn: c.musteriTckn,
          musteriDurumu: c.musteriDurumu,
          subeKod: c.subeKod,
          subeAdi: c.subeAdi,
          kullandirilabilirUrun: c.kullandirilabilirUrun,
          epostaOnay: c.epostaOnay,
          smsOnay: c.smsOnay,
          dijitalBelgeSurecOnay: c.dijitalBelgeSurecOnay,
          bildirimDurumu: displayStatus,
          butonDurumu: isProcessed ? 'Pasif' : 'Aktif',
        };
      });

      const response: PaginatedResponse<CustomerResponseDTO> = {
        items,
        totalCount,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  public getCustomerAuditHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { musteriNo } = req.params;
      if (!musteriNo) {
        throw new AppError('Müşteri numarası gereklidir.', 400);
      }
      const history = await this.entityDbService.getHistoryByMusteriNo(musteriNo);
      res.status(200).json(history);
    } catch (error) {
      next(error);
    }
  };

  public getAuditLogs = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const logs = await this.entityDbService.getAllAuditLogs();
      res.status(200).json(logs);
    } catch (error) {
      next(error);
    }
  };
}
