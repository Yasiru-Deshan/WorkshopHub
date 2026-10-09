import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Check, Index, OneToMany } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum WorkshopStatus {
  DRAFT = 'DRAFT',
  OPEN = 'OPEN',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}

@Entity('workshops')
@Check(`"ends_at" > "starts_at"`)
@Check(`"capacity" > 0`)
export class Workshop {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  code: string;

  @Column()
  title: string;

  @Column()
  instructor: string;

  @Column({ type: 'text' })
  @Index()
  location: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'timestamptz' })
  @Index()
  starts_at: Date;

  @Column({ type: 'timestamptz' })
  ends_at: Date;

  @Column({ type: 'int' })
  capacity: number;

  @Column({ type: 'enum', enum: WorkshopStatus, default: WorkshopStatus.DRAFT })
  @Index()
  status: WorkshopStatus;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  @Column()
  created_by: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'updated_by' })
  updatedBy: User;

  @Column()
  updated_by: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  seatsTaken?: number;
  seatsAvailable?: number;
}
