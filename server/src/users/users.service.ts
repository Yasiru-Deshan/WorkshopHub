import { Injectable, ConflictException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { User, Role } from './entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) { }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async create(data: Partial<User>, creatorId?: string): Promise<User> {
    const user = this.usersRepository.create(data);
    if (data.password_hash) {
      user.password_hash = await bcrypt.hash(data.password_hash, 10);
    }
    if (creatorId) {
      user.created_by = creatorId;
    }
    return this.usersRepository.save(user);
  }

  async update(id: string, updateData: any): Promise<User> {
    const user = await this.findById(id);
    if (!user) throw new ConflictException('User not found');

    if (user.role === Role.ADMIN && (updateData.role && updateData.role !== Role.ADMIN || updateData.is_active === false)) {
      const activeAdminsCount = await this.usersRepository.count({
        where: { role: Role.ADMIN, is_active: true, id: Not(id) }
      });
      if (activeAdminsCount === 0) {
        throw new ConflictException({ code: 'LAST_ADMIN', message: 'Cannot deactivate or demote the last active admin.' });
      }
    }

    if (updateData.password) {
      user.password_hash = await bcrypt.hash(updateData.password, 10);
    }
    if (updateData.fullName) user.full_name = updateData.fullName;
    if (updateData.role) user.role = updateData.role;
    if (updateData.isActive !== undefined) user.is_active = updateData.isActive;

    return this.usersRepository.save(user);
  }

  async findAll(page: number, limit: number): Promise<{ data: User[], meta: any }> {
    const [data, total] = await this.usersRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { created_at: 'DESC' }
    });
    return { data, meta: { page, limit, total } };
  }
}
