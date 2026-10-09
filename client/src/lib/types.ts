export type Role = 'ADMIN' | 'MANAGER' | 'STAFF';
export type WorkshopStatus = 'DRAFT' | 'OPEN' | 'CANCELLED' | 'COMPLETED';
export type RegistrationStatus = 'ACTIVE' | 'CANCELLED';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  is_active: boolean;
  created_at: string;
}

export interface Workshop {
  id: string;
  code: string;
  title: string;
  instructor: string;
  location: string;
  description?: string;
  starts_at: string;
  ends_at: string;
  capacity: number;
  status: WorkshopStatus;
  seatsTaken: number;
  seatsAvailable: number;
  created_at: string;
}

export interface RegistrationUser {
  id: string;
  full_name: string;
}

export interface Registration {
  id: string;
  workshopId: string;
  attendeeName: string;
  attendeeEmail: string;
  status: RegistrationStatus;
  registeredBy: RegistrationUser;
  registeredAt: string;
  cancelledBy: RegistrationUser | null;
  cancelledAt: string | null;
  cancelReason: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: { page: number; limit: number; total: number };
}
