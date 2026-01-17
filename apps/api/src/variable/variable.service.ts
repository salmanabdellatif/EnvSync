import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateVariableDto } from './dto/create-variable.dto';
import { UpdateVariableDto } from './dto/update-variable.dto';
import { AuditAction, Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { BatchVariablesDto } from './dto/batch-variables.dto';

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

  async findAllMetadata(projectId: string, environmentId: string) {
    await this.validateEnv(projectId, environmentId);

    // Return only metadata - NO encrypted values (for web UI)
    return this.prisma.envVariable.findMany({
      where: { environmentId },
      select: {
        id: true,
        key: true,
        comment: true,
        createdAt: true,
        updatedAt: true,
        updatedUser: {
          select: { name: true, avatar: true, email: true },
        },
        createdUser: {
          select: { name: true, avatar: true, email: true },
        },
        // Explicitly exclude: encryptedValue, iv, authTag
      },
      orderBy: { key: 'asc' },
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

  async batchSync(
    projectId: string,
    environmentId: string,
    userId: string,
    dto: BatchVariablesDto,
  ) {
    await this.validateEnv(projectId, environmentId);

    const creates = dto.changes.creates || [];
    const updates = dto.changes.updates || [];
    const deletes = dto.changes.deletes || [];

    return this.prisma.$transaction(async (tx) => {
      const results = { created: 0, updated: 0, deleted: 0 };

      // 1. Creates
      if (creates.length > 0) {
        const createResult = await tx.envVariable.createMany({
          data: creates.map((secret) => ({
            key: secret.key,
            encryptedValue: secret.encryptedValue,
            iv: secret.iv,
            authTag: secret.authTag,
            comment: secret.comment,
            environmentId,
            createdBy: userId,
            updatedBy: userId,
          })),
          skipDuplicates: true,
        });
        results.created = createResult.count;
      }

      // 2. Updates
      if (updates.length > 0) {
        for (const secret of updates) {
          try {
            await tx.envVariable.update({
              where: {
                environmentId_key: { environmentId, key: secret.key },
              },
              data: {
                encryptedValue: secret.encryptedValue,
                iv: secret.iv,
                authTag: secret.authTag,
                comment: secret.comment,
                updatedBy: userId,
              },
            });
            results.updated++;
          } catch (e) {
            console.warn(`Failed to update key: ${secret.key}`);
          }
        }
      }

      // 3. Deletes
      if (deletes.length > 0) {
        const deleteResult = await tx.envVariable.deleteMany({
          where: {
            environmentId,
            key: { in: deletes },
          },
        });
        results.deleted = deleteResult.count;
      }

      await tx.auditLog.create({
        data: {
          action: AuditAction.VARIABLE_UPDATED,
          projectId,
          userId,
          metadata: {
            type: 'BATCH_SYNC',
            envId: environmentId,
            summary: results,
          },
        },
      });

      return {
        ...results,
        message: `Synced: +${results.created} ~${results.updated} -${results.deleted}`,
      };
    });
  }
}
