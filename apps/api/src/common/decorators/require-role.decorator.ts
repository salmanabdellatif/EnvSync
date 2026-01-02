import { SetMetadata } from '@nestjs/common';
import { ProjectRole } from '../enums/project-role.enum';

export const PROJECT_ROLE_KEY = 'projectRole';
export const RequireRole = (role: ProjectRole) =>
  SetMetadata(PROJECT_ROLE_KEY, role);
