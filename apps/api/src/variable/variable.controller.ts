import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  ParseBoolPipe,
} from '@nestjs/common';
import { VariableService } from './variable.service';
import { CreateVariableDto } from './dto/create-variable.dto';
import { UpdateVariableDto } from './dto/update-variable.dto';
import { ProjectRole } from '../common/enums/project-role.enum';
import { RequireRole } from '../common/decorators/require-role.decorator';
import { ProjectRoleGuard } from '../common/guards/project-role.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('projects/:projectId/environments/:envId/variables')
@UseGuards(JwtAuthGuard, ProjectRoleGuard)
export class VariableController {
  constructor(private readonly variableService: VariableService) {}

  @Post()
  @RequireRole(ProjectRole.MEMBER) // Members can add variables
  create(
    @Param('projectId') projectId: string,
    @Param('envId') envId: string,
    @Body() dto: CreateVariableDto,
    @Request() req,
  ) {
    return this.variableService.create(projectId, envId, req.user.id, dto);
  }

  @Get()
  @RequireRole(ProjectRole.VIEWER)
  findAll(
    @Param('projectId') projectId: string,
    @Param('envId') envId: string,
    @Query('metadataOnly', new ParseBoolPipe({ optional: true }))
    metadataOnly?: boolean,
  ) {
    // If metadataOnly=true, return safe data for web UI (no encrypted values)
    // Otherwise, return full data for CLI (includes encryptedValue, iv, authTag)
    if (metadataOnly) {
      return this.variableService.findAllMetadata(projectId, envId);
    }
    return this.variableService.findAll(projectId, envId);
  }

  @Get(':id')
  @RequireRole(ProjectRole.VIEWER)
  findOne(
    @Param('projectId') projectId: string,
    @Param('envId') envId: string,
    @Param('id') id: string,
  ) {
    return this.variableService.findOne(projectId, envId, id);
  }

  @Patch(':id')
  @RequireRole(ProjectRole.MEMBER)
  update(
    @Param('projectId') projectId: string,
    @Param('envId') envId: string,
    @Param('id') id: string,
    @Body() dto: UpdateVariableDto,
    @Request() req,
  ) {
    return this.variableService.update(projectId, envId, id, req.user.id, dto);
  }

  @Delete(':id')
  @RequireRole(ProjectRole.ADMIN) // Only Admins can delete? Or Members? Up to you.
  remove(
    @Param('projectId') projectId: string,
    @Param('envId') envId: string,
    @Param('id') id: string,
  ) {
    return this.variableService.remove(projectId, envId, id);
  }
}
