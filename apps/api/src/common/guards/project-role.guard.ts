import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { PROJECT_ROLE_KEY } from '../decorators/require-role.decorator';
import { ProjectRole, RoleLevels } from '../enums/project-role.enum';

@Injectable()
export class ProjectRoleGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. Get required role from @RequireRole() decorator
    const requiredRole = this.reflector.get<ProjectRole>(
      PROJECT_ROLE_KEY,
      context.getHandler(),
    );

    // If no @RequireRole() decorator, allow access
    if (!requiredRole) {
      return true;
    }

    // 2. Get request data
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id; // From JwtAuthGuard
    const projectId = request.params.projectId; // From URL params

    if (!userId || !projectId) {
      throw new ForbiddenException('Missing user ID or Project ID in request');
    }

    // 3. Check if user is a member of this project
    const member = await this.prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId,
          projectId,
        },
      },
    });

    if (!member) {
      throw new NotFoundException('Project not found');
    }

    // 4. Attach member to request (for controller to use)
    request.projectMember = member;

    // 5. Compare role levels
    const userLevel = RoleLevels[member.role as ProjectRole];
    const requiredLevel = RoleLevels[requiredRole];

    if (userLevel < requiredLevel) {
      throw new ForbiddenException(
        `Insufficient permissions. Requires ${requiredRole} role.`,
      );
    }

    return true;
  }
}
