import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { EnvironmentService } from './environment.service';
import { CreateEnvironmentDto } from './dto/create-environment.dto';
import { UpdateEnvironmentDto } from './dto/update-environment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProjectRoleGuard } from '../common/guards/project-role.guard';
import { RequireRole } from '../common/decorators/require-role.decorator';
import { ProjectRole } from '../common/enums/project-role.enum';

@Controller('projects/:projectId/environments')
@UseGuards(JwtAuthGuard, ProjectRoleGuard)
export class EnvironmentController {
  constructor(private readonly environmentService: EnvironmentService) {}

  @Get()
  @RequireRole(ProjectRole.VIEWER)
  findAll(@Param('projectId') projectId: string) {
    return this.environmentService.findAll(projectId);
  }

  @Get(':envId')
  @RequireRole(ProjectRole.VIEWER)
  findOne(
    @Param('projectId') projectId: string,
    @Param('envId') envId: string,
  ) {
    return this.environmentService.findOne(projectId, envId);
  }

  @Post()
  @RequireRole(ProjectRole.ADMIN)
  create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateEnvironmentDto,
  ) {
    return this.environmentService.create(projectId, dto);
  }

  @Patch(':envId')
  @RequireRole(ProjectRole.ADMIN)
  update(
    @Param('projectId') projectId: string,
    @Param('envId') envId: string,
    @Body() dto: UpdateEnvironmentDto,
  ) {
    return this.environmentService.update(projectId, envId, dto);
  }

  @Delete(':envId')
  @RequireRole(ProjectRole.ADMIN)
  remove(@Param('projectId') projectId: string, @Param('envId') envId: string) {
    return this.environmentService.remove(projectId, envId);
  }
}
