import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Workshop, WorkshopStatus } from './entities/workshop.entity';
import { CreateWorkshopDto } from './dto/create-workshop.dto';
import { UpdateWorkshopDto } from './dto/update-workshop.dto';

@Injectable()
export class WorkshopsService {
  constructor(
    @InjectRepository(Workshop)
    private readonly workshopRepository: Repository<Workshop>,
    private readonly dataSource: DataSource,
  ) { }

  async create(createWorkshopDto: CreateWorkshopDto, userId: string) {
    const workshop = this.workshopRepository.create({
      ...createWorkshopDto,
      created_by: userId,
      updated_by: userId,
    });
    return this.workshopRepository.save(workshop);
  }

  async findAll(query: any) {
    const { from, to, hasSeats, minSeats, status, location, q, sort, page, limit } = query;
    const pageNum = Math.max(1, parseInt(page || '1', 10));
    const limitNum = Math.min(100, parseInt(limit || '20', 10));

    const qb = this.workshopRepository
      .createQueryBuilder('w')
      .leftJoin(
        'registrations', 'r',
        'r.workshop_id = w.id AND r.status = :activeStatus',
        { activeStatus: 'ACTIVE' }
      )
      .select([
        'w.id as id', 'w.code as code', 'w.title as title',
        'w.instructor as instructor', 'w.location as location',
        'w.description as description', 'w.starts_at as starts_at',
        'w.ends_at as ends_at', 'w.capacity as capacity',
        'w.status as status', 'w.created_by as created_by',
        'w.updated_by as updated_by', 'w.created_at as created_at',
        'w.updated_at as updated_at',
      ])
      .addSelect('COUNT(r.id)::int', 'seatstaken')
      .addSelect('(w.capacity - COUNT(r.id))::int', 'seatsavailable')
      .groupBy('w.id')
      .orderBy('w.starts_at', sort === '-startsAt' ? 'DESC' : 'ASC');

    if (from) qb.andWhere('w.starts_at >= :from', { from });
    if (to) qb.andWhere('w.starts_at <= :to', { to });
    if (status) qb.andWhere('w.status = :status', { status });
    if (location) qb.andWhere('w.location ILIKE :location', { location });
    if (q) qb.andWhere(
      '(w.title ILIKE :q OR w.code ILIKE :q OR w.instructor ILIKE :q)',
      { q: `%${q}%` }
    );

    if (hasSeats === 'true' && !status) {
      qb.andWhere('w.status = :openStatus', { openStatus: 'OPEN' });
    }
    if (hasSeats === 'true') qb.andHaving('(w.capacity - COUNT(r.id)) > 0');
    if (minSeats) qb.andHaving('(w.capacity - COUNT(r.id)) >= :minSeats', {
      minSeats: parseInt(minSeats, 10)
    });

    const all = await qb.getRawMany();
    const total = all.length;

    qb.offset((pageNum - 1) * limitNum).limit(limitNum);
    const rawResult = await qb.getRawMany();

    const map = (row: any) => ({
      id: row.id, code: row.code, title: row.title,
      instructor: row.instructor, location: row.location,
      description: row.description, starts_at: row.starts_at,
      ends_at: row.ends_at, capacity: row.capacity, status: row.status,
      created_by: row.created_by, updated_by: row.updated_by,
      created_at: row.created_at, updated_at: row.updated_at,
      seatsTaken: row.seatstaken ?? 0,
      seatsAvailable: row.seatsavailable ?? 0,
    });

    return {
      data: rawResult.map(map),
      meta: { page: pageNum, limit: limitNum, total },
    };
  }

  async findOne(id: string) {
    const result = await this.workshopRepository
      .createQueryBuilder('w')
      .leftJoin(
        'registrations', 'r',
        'r.workshop_id = w.id AND r.status = :activeStatus',
        { activeStatus: 'ACTIVE' }
      )
      .select([
        'w.id as id', 'w.code as code', 'w.title as title',
        'w.instructor as instructor', 'w.location as location',
        'w.description as description', 'w.starts_at as starts_at',
        'w.ends_at as ends_at', 'w.capacity as capacity',
        'w.status as status', 'w.created_by as created_by',
        'w.updated_by as updated_by', 'w.created_at as created_at',
        'w.updated_at as updated_at',
      ])
      .addSelect('COUNT(r.id)::int', 'seatstaken')
      .addSelect('(w.capacity - COUNT(r.id))::int', 'seatsavailable')
      .where('w.id = :id', { id })
      .groupBy('w.id')
      .getRawOne();

    if (!result) {
      throw new NotFoundException({ code: 'WORKSHOP_NOT_FOUND', message: 'Workshop not found' });
    }

    return {
      id: result.id, code: result.code, title: result.title,
      instructor: result.instructor, location: result.location,
      description: result.description, starts_at: result.starts_at,
      ends_at: result.ends_at, capacity: result.capacity, status: result.status,
      created_by: result.created_by, updated_by: result.updated_by,
      created_at: result.created_at, updated_at: result.updated_at,
      seatsTaken: result.seatstaken ?? 0,
      seatsAvailable: result.seatsavailable ?? 0,
    };
  }

  async update(id: string, updateWorkshopDto: UpdateWorkshopDto, userId: string) {
    // Load the real entity (not the formatted plain object from findOne)
    const entity = await this.workshopRepository.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException({ code: 'WORKSHOP_NOT_FOUND', message: 'Workshop not found' });
    }
    Object.assign(entity, updateWorkshopDto);
    entity.updated_by = userId;
    await this.workshopRepository.save(entity);
    // Return the updated workshop with seat counts
    return this.findOne(id);
  }
}
