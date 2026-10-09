import { Controller, Get, Post, Body, Patch, Param, ParseUUIDPipe, Query, UseInterceptors, ClassSerializerInterceptor } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from './entities/user.entity';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('users')
@Roles(Role.ADMIN)
@UseInterceptors(ClassSerializerInterceptor)
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Post()
  async create(@Body() createUserDto: CreateUserDto, @CurrentUser() currentUser: any) {
    const data = {
      email: createUserDto.email.trim().toLowerCase(),
      full_name: createUserDto.fullName.trim(),
      password_hash: createUserDto.password,
      role: createUserDto.role,
    };
    const user = await this.usersService.create(data, currentUser?.id);
    delete (user as any).password_hash;
    return user;
  }

  @Get()
  async findAll(@Query('page') page: string = '1', @Query('limit') limit: string = '20') {
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const result = await this.usersService.findAll(pageNum, limitNum);
    result.data.forEach(u => delete (u as any).password_hash);
    return result;
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const user = await this.usersService.findById(id);
    if (!user) throw new Error('User not found');
    delete (user as any).password_hash;
    return user;
  }

  @Patch(':id')
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() updateUserDto: UpdateUserDto) {
    const user = await this.usersService.update(id, updateUserDto);
    delete (user as any).password_hash;
    return user;
  }
}
