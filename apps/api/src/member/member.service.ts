import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddMemberDto } from './dto/add-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';

@Injectable()
export class MemberService {
  constructor(private prisma: PrismaService) {}

  async addMember(projectId: string, dto: AddMemberDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    // Note: User may not have publicKey yet. Grant will fail until they set up CLI.

    try {
      return await this.prisma.projectMember.create({
        data: {
          projectId,
          userId: user.id,
          role: dto.role,
          wrappedKey: dto.wrappedKey,
        },
        include: {
          user: {
            select: { id: true, name: true, email: true, avatar: true },
          },
        },
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException(
          'User is already a member of this project.',
        );
      }
      throw error;
    }
  }

  async findAll(projectId: string) {
    return this.prisma.projectMember.findMany({
      where: { projectId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            publicKey: true,
          },
        },
      },
      orderBy: { joinedAt: 'asc' }, // Oldest members first
    });
  }

  async updateMember(
    projectId: string,
    userId: string,
    callerId: string,
    dto: UpdateMemberDto,
  ) {
    const roleLevels = { OWNER: 4, ADMIN: 3, MEMBER: 2, VIEWER: 1 };

    // 1. Fetch Target
    const targetMember = await this.prisma.projectMember.findUnique({
      where: { userId_projectId: { projectId, userId } },
    });
    if (!targetMember) throw new NotFoundException('Target member not found');

    // 2. Fetch Caller
    const callerMember = await this.prisma.projectMember.findUnique({
      where: { userId_projectId: { projectId, userId: callerId } },
    });

    // Check if caller is a member in the project
    if (!callerMember)
      throw new ForbiddenException('Caller not found in project');

    const callerLvl = roleLevels[callerMember.role];
    const targetCurrentLvl = roleLevels[targetMember.role];
    const targetNewLvl = roleLevels[dto.role];

    // admin cant update admin
    if (targetCurrentLvl >= callerLvl) {
      throw new ForbiddenException(
        'You cannot modify a member with equal or higher rank than you.',
      );
    }

    // admin cant update member to owner
    if (targetNewLvl > callerLvl) {
      throw new ForbiddenException(
        'You cannot promote someone to a role higher than your own.',
      );
    }

    return this.prisma.projectMember.update({
      where: { userId_projectId: { projectId, userId } },
      data: { role: dto.role },
      include: { user: { select: { name: true, email: true } } },
    });
  }

  async removeMember(projectId: string, userId: string) {
    const member = await this.prisma.projectMember.findUnique({
      where: { userId_projectId: { projectId, userId } },
    });

    if (!member) throw new NotFoundException('Member not found');

    if (member.role === 'OWNER') {
      throw new BadRequestException('Cannot remove the project owner');
    }

    try {
      await this.prisma.projectMember.delete({
        where: { userId_projectId: { projectId, userId } },
      });
      return { message: 'Member removed successfully' };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Member not found');
      }
      throw error;
    }
  }

  async getProjectKey(projectId: string, userId: string) {
    const member = await this.prisma.projectMember.findUnique({
      where: { userId_projectId: { projectId, userId } },
      select: { wrappedKey: true },
    });

    if (!member)
      throw new ForbiddenException('You are not a member of this project');

    return { encryptedKey: member.wrappedKey };
  }

  async updateProjectKey(
    projectId: string,
    userId: string,
    encryptedKey: string,
  ) {
    try {
      return await this.prisma.projectMember.update({
        where: { userId_projectId: { projectId, userId } },
        data: { wrappedKey: encryptedKey },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(
          `User ${userId} is not a member of project ${projectId}`,
        );
      }
      throw error;
    }
  }
}
