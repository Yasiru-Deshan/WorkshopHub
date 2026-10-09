import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, ConflictException } from '@nestjs/common';
import { WorkshopsService } from './workshops.service';
import { CreateWorkshopDto } from './dto/create-workshop.dto';
import { UpdateWorkshopDto } from './dto/update-workshop.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../users/entities/user.entity';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('workshops')
export class WorkshopsController {
  constructor(private readonly workshopsService: WorkshopsService) {}

  @Roles(Role.MANAGER)
  @Post()
  create(@Body() createWorkshopDto: CreateWorkshopDto, @CurrentUser() user: any) {
    return this.workshopsService.create(createWorkshopDto, user.id);
  }

  @Roles(Role.MANAGER, Role.STAFF)
  @Get()
  findAll(@Query() query: any) {
    return this.workshopsService.findAll(query);
  }

  @Roles(Role.MANAGER, Role.STAFF)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.workshopsService.findOne(id);
  }

  @Roles(Role.MANAGER)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateWorkshopDto: UpdateWorkshopDto, @CurrentUser() user: any) {
    return this.workshopsService.update(id, updateWorkshopDto, user.id);
  }
}
