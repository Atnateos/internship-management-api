import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateApplicantDto } from './dto/create-applicant.dto';
import { UpdateApplicantDto } from './dto/update-applicant.dto';
import { QueryApplicantDto } from './dto/query-applicant.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { UpdateNotesDto } from './dto/update-notes.dto';
import { ApplicantStatus } from './constants/applicant.constants';

@Injectable()
export class ApplicantsService {
  constructor(private prisma: PrismaService) {}

async create(createApplicantDto: CreateApplicantDto) {
    // Normalize here too (in addition to the DTO-level @Transform) so the
    // uniqueness check and stored value are consistent even if this method
    // is ever called from somewhere other than the HTTP validation pipeline.
    const email = createApplicantDto.email.toLowerCase().trim();

    const existing = await this.prisma.applicant.findUnique({
      where: { email },
    });
    if (existing) {
      throw new ConflictException('Applicant with this email already exists');
    }

    return this.prisma.applicant.create({
      data: { ...createApplicantDto, email },
    });
  }
  async findAll(query: QueryApplicantDto) {
    const { search, status, track, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null, // Exclude soft-deleted records
    };

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (track) {
      where.track = track;
    }

    const [total, data] = await Promise.all([
      this.prisma.applicant.count({ where }),
      this.prisma.applicant.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder,
        },
      }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const applicant = await this.prisma.applicant.findFirst({
      where: { id, deletedAt: null },
    });
    if (!applicant) {
      throw new NotFoundException(`Applicant with ID ${id} not found`);
    }
    return applicant;
  }

  async update(id: string, updateApplicantDto: UpdateApplicantDto) {
    const applicant = await this.findOne(id);

    const email = updateApplicantDto.email?.toLowerCase().trim();

    if (email && email !== applicant.email) {
      const emailConflict = await this.prisma.applicant.findUnique({
        where: { email },
      });
      if (emailConflict) {
        throw new ConflictException('Applicant with this email already exists');
      }
    }

    return this.prisma.applicant.update({
      where: { id },
      data: { ...updateApplicantDto, ...(email && { email }) },
    });
  }
  async updateStatus(id: string, updateStatusDto: UpdateStatusDto) {
    const applicant = await this.findOne(id);
    const newStatus = updateStatusDto.status;

    // Rule: Cannot transition from Rejected directly to Accepted
    if (applicant.status === ApplicantStatus.REJECTED && newStatus === ApplicantStatus.ACCEPTED) {
      throw new BadRequestException('An applicant cannot move directly from Rejected to Accepted');
    }

    return this.prisma.applicant.update({
      where: { id },
      data: { status: newStatus },
    });
  }

  async updateNotes(id: string, updateNotesDto: UpdateNotesDto) {
    await this.findOne(id);
    return this.prisma.applicant.update({
      where: { id },
      data: { notes: updateNotesDto.notes ?? null },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.applicant.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}