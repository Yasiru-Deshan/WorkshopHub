import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RegistrationsService } from './registrations.service';
import { RegistrationsController, WorkshopRegistrationsController } from './registrations.controller';
import { Registration } from './entities/registration.entity';
import { WorkshopsModule } from '../workshops/workshops.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Registration]),
    WorkshopsModule,
  ],
  controllers: [RegistrationsController, WorkshopRegistrationsController],
  providers: [RegistrationsService],
  exports: [RegistrationsService],
})
export class RegistrationsModule {}
