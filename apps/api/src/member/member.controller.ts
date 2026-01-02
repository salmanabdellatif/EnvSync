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

@Controller('projects/:projectId/members')
@UseGuards(JwtAuthGuard, ProjectRoleGuard)
export class MemberController {
  constructor(private readonly membersService: MemberService) {}

  @Post()
  @RequireRole(ProjectRole.ADMIN) // Only Admins can add
  addMember(@Param('projectId') projectId: string, @Body() dto: AddMemberDto) {
    return this.membersService.addMember(projectId, dto);
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
}
