import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Registration, RegistrationStatus } from './entities/registration.entity';
import { Workshop, WorkshopStatus } from '../workshops/entities/workshop.entity';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { CancelRegistrationDto } from './dto/cancel-registration.dto';

@Injectable()
export class RegistrationsService {
  constructor(
    @InjectRepository(Registration)
    private readonly registrationRepository: Repository<Registration>,
    private readonly dataSource: DataSource,
  ) { }

  async create(workshopId: string, dto: CreateRegistrationDto, userId: string) {
    return this.dataSource.transaction(async (manager) => {
      const workshop = await manager.findOne(Workshop, {
        where: { id: workshopId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!workshop) {
        throw new NotFoundException({ code: 'WORKSHOP_NOT_FOUND', message: 'Workshop not found' });
      }

      if (workshop.status !== WorkshopStatus.OPEN) {
        throw new ConflictException({ code: 'WORKSHOP_NOT_OPEN', message: 'Workshop is not open for registration' });
      }

      if (new Date(workshop.starts_at) <= new Date()) {
        throw new ConflictException({ code: 'WORKSHOP_ALREADY_STARTED', message: 'Workshop has already started' });
      }

      const activeCount = await manager.count(Registration, {
        where: { workshop_id: workshopId, status: RegistrationStatus.ACTIVE },
      });

      if (activeCount >= workshop.capacity) {
        throw new ConflictException({ code: 'WORKSHOP_FULL', message: 'Workshop is full' });
      }

      const registration = manager.create(Registration, {
        workshop_id: workshopId,
        attendee_name: dto.attendeeName,
        attendee_email: dto.attendeeEmail,
        registered_by: userId,
        status: RegistrationStatus.ACTIVE,
      });

      try {
        const saved = await manager.save(registration);
        return this.formatRegistration(await manager.findOne(Registration, {
          where: { id: saved.id },
          relations: { registeredBy: true, cancelledBy: true },
        }));
      } catch (error: any) {
        if (error.code === '23505') {
          throw new ConflictException({ code: 'ALREADY_REGISTERED', message: 'Attendee is already registered for this workshop' });
        }
        throw error;
      }
    });
  }

  async cancel(id: string, dto: CancelRegistrationDto, userId: string) {
    return this.dataSource.transaction(async (manager) => {
      const registration = await manager.findOne(Registration, { where: { id } });

      if (!registration) {
        throw new NotFoundException({ code: 'REGISTRATION_NOT_FOUND', message: 'Registration not found' });
      }

      // Lock the workshop
      await manager.findOne(Workshop, {
        where: { id: registration.workshop_id },
        lock: { mode: 'pessimistic_write' },
      });

      // Re-read after lock
      const fresh = await manager.findOne(Registration, { where: { id } });

      if (fresh!.status === RegistrationStatus.CANCELLED) {
        throw new ConflictException({ code: 'ALREADY_CANCELLED', message: 'Registration is already cancelled' });
      }

      fresh!.status = RegistrationStatus.CANCELLED;
      fresh!.cancelled_by = userId;
      fresh!.cancelled_at = new Date();
      if (dto.reason) fresh!.cancel_reason = dto.reason;

      await manager.save(fresh!);

      return this.formatRegistration(await manager.findOne(Registration, {
        where: { id },
        relations: { registeredBy: true, cancelledBy: true },
      }));
    });
  }

  async findByWorkshop(workshopId: string, query: any) {
    const { status, page = '1', limit = '20' } = query;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, parseInt(limit, 10));

    const where: any = { workshop_id: workshopId };
    if (status) where.status = status;

    const [records, total] = await this.registrationRepository.findAndCount({
      where,
      relations: { registeredBy: true, cancelledBy: true },
      order: { registered_at: 'DESC' },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
    });

    return {
      data: records.map(this.formatRegistration),
      meta: { page: pageNum, limit: limitNum, total },
    };
  }

  async findOne(id: string) {
    const reg = await this.registrationRepository.findOne({
      where: { id },
      relations: { registeredBy: true, cancelledBy: true },
    });
    if (!reg) throw new NotFoundException({ code: 'REGISTRATION_NOT_FOUND', message: 'Registration not found' });
    return this.formatRegistration(reg);
  }

  private formatRegistration(reg: Registration | null) {
    if (!reg) return null;
    return {
      id: reg.id,
      workshopId: reg.workshop_id,
      attendeeName: reg.attendee_name,
      attendeeEmail: reg.attendee_email,
      status: reg.status,
      registeredBy: reg.registeredBy ? { id: reg.registeredBy.id, fullName: reg.registeredBy.full_name } : null,
      registeredAt: reg.registered_at,
      cancelledBy: reg.cancelledBy ? { id: reg.cancelledBy.id, fullName: reg.cancelledBy.full_name } : null,
      cancelledAt: reg.cancelled_at,
      cancelReason: reg.cancel_reason,
    };
  }
}
