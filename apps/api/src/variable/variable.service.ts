import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateVariableDto } from './dto/create-variable.dto';
import { UpdateVariableDto } from './dto/update-variable.dto';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VariableService {
  constructor(private prisma: PrismaService) {}

  private async validateEnv(projectId: string, environmentId: string) {
    const env = await this.prisma.environment.findFirst({
      where: { id: environmentId, projectId }, // Strict ownership check
    });
    if (!env)
      throw new NotFoundException('Environment not found in this project');
  }

  async create(
    projectId: string,
    environmentId: string,
    userId: string,
    dto: CreateVariableDto,
  ) {
    await this.validateEnv(projectId, environmentId);

    try {
      return await this.prisma.envVariable.create({
        data: {
          ...dto,
          environmentId,
          createdBy: userId,
          updatedBy: userId,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(`Variable '${dto.key}' already exists.`);
      }
      throw error;
    }
  }

  async findAll(projectId: string, environmentId: string) {
    await this.validateEnv(projectId, environmentId);

    return this.prisma.envVariable.findMany({
      where: { environmentId },
      orderBy: { key: 'asc' },
      include: {
        updatedUser: {
          // Return Audit Details
          select: { name: true, avatar: true, email: true },
        },
      },
    });
  }

  async findOne(projectId: string, environmentId: string, id: string) {
    // 1. Security Check (Ensure Env is valid)
    await this.validateEnv(projectId, environmentId);

    // 2. Fetch with Constraints
    const variable = await this.prisma.envVariable.findFirst({
      where: {
        id,
        environmentId, // 👈 CRITICAL: This ensures the variable belongs to THIS environment
      },
      include: {
        updatedUser: { select: { name: true, avatar: true, email: true } },
      },
    });

    if (!variable) throw new NotFoundException('Variable not found');
    return variable;
  }

  async update(
    projectId: string,
    environmentId: string,
    id: string,
    userId: string,
    dto: UpdateVariableDto,
  ) {
    await this.validateEnv(projectId, environmentId);

    // Check if var belongs to this env
    const existingVar = await this.prisma.envVariable.findFirst({
      where: { id, environmentId },
    });

    if (!existingVar) {
      throw new NotFoundException('Variable not found in this environment');
    }

    try {
      return await this.prisma.envVariable.update({
        where: { id },
        data: {
          ...dto,
          updatedBy: userId, // Track who changed it
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025')
          throw new NotFoundException('Variable not found');
        if (error.code === 'P2002')
          throw new ConflictException(`Variable '${dto.key}' already exists.`);
      }
      throw error;
    }
  }

  async remove(projectId: string, environmentId: string, id: string) {
    await this.validateEnv(projectId, environmentId);

    // Check if var belongs to this env
    const existingVar = await this.prisma.envVariable.findFirst({
      where: { id, environmentId },
    });

    if (!existingVar) {
      throw new NotFoundException('Variable not found in this environment');
    }

    try {
      await this.prisma.envVariable.delete({ where: { id } });
      return { message: 'Variable deleted successfully' };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Variable not found');
      }
      throw error;
    }
  }
}
