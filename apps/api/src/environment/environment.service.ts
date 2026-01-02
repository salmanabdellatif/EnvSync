import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { CreateEnvironmentDto } from './dto/create-environment.dto';
import { UpdateEnvironmentDto } from './dto/update-environment.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EnvironmentService {
  constructor(private prisma: PrismaService) {}

  async create(projectId: string, dto: CreateEnvironmentDto) {
    // Check if environment with same name already exists in project
    const existing = await this.prisma.environment.findUnique({
      where: {
        projectId_name: {
          projectId,
          name: dto.name,
        },
      },
    });

    if (existing) {
      throw new ConflictException(
        `Environment "${dto.name}" already exists in this project`,
      );
    }

    return this.prisma.environment.create({
      data: {
        name: dto.name,
        projectId,
      },
      include: {
        _count: {
          select: { variables: true },
        },
      },
    });
  }

  async findAll(projectId: string) {
    return this.prisma.environment.findMany({
      where: { projectId },
      include: {
        _count: {
          select: { variables: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(projectId: string, envId: string) {
    const environment = await this.prisma.environment.findFirst({
      where: {
        id: envId,
        projectId,
      },
      include: {
        variables: {
          select: {
            id: true,
            key: true,
            // Don't return encrypted values - CLI will fetch separately
            createdAt: true,
            updatedAt: true,
          },
          orderBy: { key: 'asc' },
        },
        _count: {
          select: { variables: true },
        },
      },
    });

    if (!environment) {
      throw new NotFoundException('Environment not found');
    }

    return environment;
  }

  async update(projectId: string, envId: string, dto: UpdateEnvironmentDto) {
    // Check if environment exists and belongs to project
    const environment = await this.prisma.environment.findFirst({
      where: {
        id: envId,
        projectId,
      },
    });

    if (!environment) {
      throw new NotFoundException('Environment not found');
    }

    // If name is being changed, check for conflicts
    if (dto.name && dto.name !== environment.name) {
      const existing = await this.prisma.environment.findUnique({
        where: {
          projectId_name: {
            projectId,
            name: dto.name,
          },
        },
      });

      if (existing) {
        throw new ConflictException(
          `Environment "${dto.name}" already exists in this project`,
        );
      }
    }

    return this.prisma.environment.update({
      where: { id: envId },
      data: dto,
      include: {
        _count: {
          select: { variables: true },
        },
      },
    });
  }

  async remove(projectId: string, envId: string) {
    // Check if environment exists and belongs to project
    const environment = await this.prisma.environment.findFirst({
      where: {
        id: envId,
        projectId,
      },
    });

    if (!environment) {
      throw new NotFoundException('Environment not found');
    }

    await this.prisma.environment.delete({
      where: { id: envId },
    });

    return { message: 'Environment deleted successfully' };
  }
}
