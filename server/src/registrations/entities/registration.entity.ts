import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index, Check } from 'typeorm';
import { Workshop } from '../../workshops/entities/workshop.entity';
import { User } from '../../users/entities/user.entity';

export enum RegistrationStatus {
  ACTIVE = 'ACTIVE',
  CANCELLED = 'CANCELLED',
}

@Entity('registrations')
@Check(`"status" != 'CANCELLED' OR ("cancelled_by" IS NOT NULL AND "cancelled_at" IS NOT NULL)`)
@Index(['workshop_id', 'attendee_email'], { unique: true, where: `"status" = 'ACTIVE'` })
@Index(['workshop_id', 'status'])
export class Registration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Workshop, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'workshop_id' })
  workshop: Workshop;

  @Column()
  workshop_id: string;

  @Column()
  attendee_name: string;

  @Column()
  attendee_email: string;

  @Column({ type: 'enum', enum: RegistrationStatus, default: RegistrationStatus.ACTIVE })
  status: RegistrationStatus;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'registered_by' })
  registeredBy: User;

  @Column()
  registered_by: string;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  registered_at: Date;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'cancelled_by' })
  cancelledBy: User;

  @Column({ nullable: true })
  cancelled_by: string;

  @Column({ type: 'timestamptz', nullable: true })
  cancelled_at: Date;

  @Column({ type: 'text', nullable: true })
  cancel_reason: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
