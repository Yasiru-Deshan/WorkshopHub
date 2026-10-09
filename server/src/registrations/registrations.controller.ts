import { Controller, Get, Post, Body, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { RegistrationsService } from './registrations.service';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { CancelRegistrationDto } from './dto/cancel-registration.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../users/entities/user.entity';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { WorkshopsService } from '../workshops/workshops.service';

// Routes nested under workshops
@Controller('workshops/:workshopId/registrations')
@Roles(Role.MANAGER, Role.STAFF)
export class WorkshopRegistrationsController {
  constructor(
    private readonly registrationsService: RegistrationsService,
    private readonly workshopsService: WorkshopsService,
  ) {}

  @Post()
  create(
    @Param('workshopId', ParseUUIDPipe) workshopId: string,
    @Body() dto: CreateRegistrationDto,
    @CurrentUser() user: any,
  ) {
    return this.registrationsService.create(workshopId, dto, user.id);
  }

  @Get()
  findByWorkshop(
    @Param('workshopId', ParseUUIDPipe) workshopId: string,
    @Query() query: any,
  ) {
    return this.registrationsService.findByWorkshop(workshopId, query);
  }
}

// Standalone registration routes
@Controller('registrations')
@Roles(Role.MANAGER, Role.STAFF)
export class RegistrationsController {
  constructor(private readonly registrationsService: RegistrationsService) {}

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.registrationsService.findOne(id);
  }

  @Post(':id/cancel')
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelRegistrationDto,
    @CurrentUser() user: any,
  ) {
    return this.registrationsService.cancel(id, dto, user.id);
  }
}
