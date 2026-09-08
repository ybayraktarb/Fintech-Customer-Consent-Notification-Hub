import { prisma } from '../config/prisma';
import { Customer } from '@prisma/client';
import { autoSeedDatabase } from '../config/initDb';

export interface CustomerFilterOptions {
  page?: number;
  limit?: number;
  search?: string;
}

export type CustomerWithLatestNotification = Customer & {
  notifications?: any[];
};

export interface ICustomerRepository {
  findPaginated(options: CustomerFilterOptions): Promise<{ items: CustomerWithLatestNotification[]; totalCount: number }>;
  findByMusteriNo(musteriNo: string): Promise<Customer | null>;
  upsert(customer: Partial<Customer> & { musteriNo: string }): Promise<Customer>;
}

export class CustomerRepository implements ICustomerRepository {
  private static instance: CustomerRepository;

  private constructor() {}

  public static getInstance(): CustomerRepository {
    if (!CustomerRepository.instance) {
      CustomerRepository.instance = new CustomerRepository();
    }
    return CustomerRepository.instance;
  }

  /**
   * PostgreSQL SQL seviyesinde optimize edilmiş sayfalama (skip, take) ve arama.
   * Eager Loading (include notifications) ile N+1 sorgu problemi tamamen engellenir.
   */
  public async findPaginated(
    options: CustomerFilterOptions
  ): Promise<{ items: CustomerWithLatestNotification[]; totalCount: number }> {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 10));
    const skip = (page - 1) * limit;
    const search = (options.search || '').trim();

    const whereClause = search
      ? {
          OR: [
            { musteriNo: { contains: search, mode: 'insensitive' as const } },
            { musteriAdi: { contains: search, mode: 'insensitive' as const } },
            { musteriSoyadi: { contains: search, mode: 'insensitive' as const } },
            { musteriTckn: { contains: search, mode: 'insensitive' as const } },
            { subeAdi: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const includeClause = {
      notifications: {
        orderBy: { bildirimZmn: 'desc' as const },
        take: 1,
      },
    };

    let [items, totalCount] = await Promise.all([
      prisma.customer.findMany({
        where: whereClause,
        include: includeClause,
        skip,
        take: limit,
        orderBy: { musteriNo: 'asc' },
      }),
      prisma.customer.count({ where: whereClause }),
    ]);

    // Veritabanı ilk kez açıldığında boşsa anında tohumla ve veriyi getir
    if (totalCount === 0 && !search) {
      await autoSeedDatabase();
      [items, totalCount] = await Promise.all([
        prisma.customer.findMany({
          where: whereClause,
          include: includeClause,
          skip,
          take: limit,
          orderBy: { musteriNo: 'asc' },
        }),
        prisma.customer.count({ where: whereClause }),
      ]);
    }

    return { items, totalCount };
  }

  public async findByMusteriNo(musteriNo: string): Promise<Customer | null> {
    return prisma.customer.findUnique({
      where: { musteriNo },
    });
  }

  public async upsert(customer: Partial<Customer> & { musteriNo: string }): Promise<Customer> {
    return prisma.customer.upsert({
      where: { musteriNo: customer.musteriNo },
      update: customer,
      create: customer as any,
    });
  }
}
