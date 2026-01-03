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
} from '@nestjs/common';
import { ProjectService } from './project.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Throttle } from '@nestjs/throttler';

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post()
  create(@Request() req, @Body() createProjectDto: CreateProjectDto) {
    return this.projectService.create(req.user.id, createProjectDto);
  }

  @Get()
  findAll(@Request() req) {
    return this.projectService.findAll(req.user.id);
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string, @Request() req) {
    return this.projectService.findOne(slug, req.user.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Request() req,
    @Body() updateProjectDto: UpdateProjectDto,
  ) {
    return this.projectService.update(id, req.user.id, updateProjectDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.projectService.remove(id, req.user.id);
  }
}
