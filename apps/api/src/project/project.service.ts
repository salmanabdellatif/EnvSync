import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { PrismaService } from '../prisma/prisma.service';
import slugify from 'slugify';

@Injectable()
export class ProjectService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createProjectDto: CreateProjectDto) {
    const { name, description } = createProjectDto;

    let slug = slugify(name, { lower: true, strict: true });

    // Check if slug exists for THIS user only
    let slugExists = await this.prisma.project.findUnique({
      where: {
        ownerId_slug: {
          ownerId: userId,
          slug: slug,
        },
      },
    });

    if (slugExists) {
      throw new ConflictException(
        'You already have a project with this name. Please choose a different name.',
      );
    }

    // Create project with owner and add user as OWNER member
    const project = await this.prisma.project.create({
      data: {
        name,
        slug,
        ownerId: userId,
        description,
        members: {
          create: {
            userId,
            role: 'OWNER',
          },
        },
      },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    return project;
  }

  async findAll(userId: string) {
    // Find all projects where user is a member
    const projects = await this.prisma.project.findMany({
      where: {
        members: {
          some: {
            userId,
          },
        },
      },
      include: {
        members: {
          take: 5,
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                avatar: true,
              },
            },
          },
        },
        _count: {
          select: {
            environments: true,
            members: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return projects;
  }

  async findOne(slug: string, userId: string) {
    const project = await this.prisma.project.findFirst({
      where: {
        slug: slug,
        // owner: { // fix this issue later after we add username filed
        //   username: usernamem,
        // },
        members: {
          some: {
            userId: userId,
          },
        },
      },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                avatar: true,
              },
            },
          },
        },
        environments: true,
        _count: {
          select: {
            environments: true,
            members: true,
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  async update(
    projectId: string,
    userId: string,
    updateProjectDto: UpdateProjectDto,
  ) {
    const member = await this.prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          projectId,
          userId,
        },
      },
    });

    // Case A: Not a member
    if (!member) {
      throw new NotFoundException('Project not found');
    }

    // Case B: Is member, but not owner
    if (member.role !== 'OWNER') {
      throw new ForbiddenException('Only project owners can update projects');
    }

    const project = await this.prisma.project.update({
      where: { id: projectId },
      data: updateProjectDto,
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    return project;
  }

  async remove(projectId: string, userId: string) {
    // Check if user is OWNER
    const member = await this.prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId,
          projectId,
        },
      },
    });

    if (!member) throw new NotFoundException('Project not found');
    if (member.role !== 'OWNER')
      throw new ForbiddenException('Only project owners can delete projects');

    await this.prisma.project.delete({
      where: { id: projectId },
    });

    return { message: 'Project deleted successfully' };
  }
}
