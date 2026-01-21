import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { MemberService } from './member.service';
import { AddMemberDto } from './dto/add-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProjectRoleGuard } from '../common/guards/project-role.guard';
import { RequireRole } from '../common/decorators/require-role.decorator';
import { ProjectRole } from '../common/enums/project-role.enum';
import { Throttle } from '@nestjs/throttler';

@Controller('projects/:projectId/members')
@UseGuards(JwtAuthGuard, ProjectRoleGuard)
export class MemberController {
  constructor(private readonly membersService: MemberService) {}

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post()
  @RequireRole(ProjectRole.MEMBER) // Members can see add UI but restricted by service
  addMember(
    @Param('projectId') projectId: string,
    @Body() dto: AddMemberDto,
    @Request() req,
  ) {
    return this.membersService.addMember(projectId, req.user.id, dto);
  }

  @Get()
  @RequireRole(ProjectRole.VIEWER) // Viewers can see the list
  findAll(@Param('projectId') projectId: string) {
    return this.membersService.findAll(projectId);
  }

  @Patch(':userId')
  @RequireRole(ProjectRole.ADMIN) // Only Admins can promote/demote
  updateMember(
    @Param('projectId') projectId: string,
    @Param('userId') userId: string,
    @Body() dto: UpdateMemberDto,
    @Request() req,
  ) {
    return this.membersService.updateMember(
      projectId,
      userId,
      req.user.id,
      dto,
    );
  }

  @Delete(':userId')
  @RequireRole(ProjectRole.ADMIN) // Only Admins can fire people
  removeMember(
    @Param('projectId') projectId: string,
    @Param('userId') userId: string,
  ) {
    return this.membersService.removeMember(projectId, userId);
  }

  @Get('key')
  @RequireRole(ProjectRole.VIEWER)
  async getKey(@Param('projectId') projectId: string, @Request() req) {
    return this.membersService.getProjectKey(projectId, req.user.id);
  }

  @Post('key')
  @RequireRole(ProjectRole.OWNER)
  async setKey(
    @Param('projectId') projectId: string,
    @Body('wrappedKey') wrappedKey: string,
    @Request() req,
  ) {
    return this.membersService.updateProjectKey(
      projectId,
      req.user.id,
      wrappedKey,
    );
  }

  @Patch(':userId/key')
  @RequireRole(ProjectRole.ADMIN)
  async grantAccess(
    @Param('projectId') projectId: string,
    @Param('userId') targetUserId: string,
    @Body('wrappedKey') wrappedKey: string,
    @Request() req,
  ) {
    return this.membersService.updateProjectKey(
      projectId,
      targetUserId,
      wrappedKey,
    );
  }
}
