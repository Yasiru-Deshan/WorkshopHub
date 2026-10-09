import { SetMetadata } from '@nestjs/common';
import { Role } from '../../users/entities/user.entity';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

export const ANY_ROLE_KEY = 'anyRole';
export const AnyRole = () => SetMetadata(ANY_ROLE_KEY, true);
