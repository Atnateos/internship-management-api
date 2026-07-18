import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { ApplicantsService } from './applicants.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { ApplicantStatus, InternshipTrack } from './constants/applicant.constants';

describe('ApplicantsService', () => {
  let service: ApplicantsService;
  let prisma: {
    applicant: {
      findUnique: jest.Mock;
      findFirst: jest.Mock;
      findMany: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      count: jest.Mock;
    };
  };

  const baseApplicant = {
    id: 'applicant-1',
    name: 'Jane Doe',
    email: 'jane.doe@example.com',
    phone: '+14155552671',
    track: InternshipTrack.BACKEND,
    status: ApplicantStatus.PENDING,
    notes: null,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    prisma = {
      applicant: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [ApplicantsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<ApplicantsService>(ApplicantsService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('creates an applicant when the email is not already in use', async () => {
      prisma.applicant.findUnique.mockResolvedValue(null);
      prisma.applicant.create.mockResolvedValue(baseApplicant);

      const dto = {
        name: 'Jane Doe',
        email: 'jane.doe@example.com',
        track: InternshipTrack.BACKEND,
      } as any;

      const result = await service.create(dto);

      expect(result).toEqual(baseApplicant);
      expect(prisma.applicant.create).toHaveBeenCalledWith({ data: dto });
    });

    it('throws ConflictException when the email is already taken', async () => {
      prisma.applicant.findUnique.mockResolvedValue(baseApplicant);

      await expect(
        service.create({
          name: 'Someone Else',
          email: 'jane.doe@example.com',
          track: InternshipTrack.BACKEND,
        } as any),
      ).rejects.toThrow(ConflictException);

      expect(prisma.applicant.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('always excludes soft-deleted applicants from the where clause', async () => {
      prisma.applicant.count.mockResolvedValue(0);
      prisma.applicant.findMany.mockResolvedValue([]);

      await service.findAll({ page: 1, limit: 10, sortBy: 'createdAt', sortOrder: 'desc' } as any);

      expect(prisma.applicant.count).toHaveBeenCalledWith({
        where: expect.objectContaining({ deletedAt: null }),
      });
      expect(prisma.applicant.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ deletedAt: null }),
        }),
      );
    });

    it('returns correct pagination metadata', async () => {
      prisma.applicant.count.mockResolvedValue(25);
      prisma.applicant.findMany.mockResolvedValue([baseApplicant]);

      const result = await service.findAll({
        page: 2,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      } as any);

      expect(result.meta).toEqual({ total: 25, page: 2, limit: 10, totalPages: 3 });
    });
  });

  describe('findOne', () => {
    it('returns the applicant when found and not deleted', async () => {
      prisma.applicant.findFirst.mockResolvedValue(baseApplicant);

      const result = await service.findOne('applicant-1');

      expect(result).toEqual(baseApplicant);
      expect(prisma.applicant.findFirst).toHaveBeenCalledWith({
        where: { id: 'applicant-1', deletedAt: null },
      });
    });

    it('throws NotFoundException when the applicant does not exist or is soft-deleted', async () => {
      prisma.applicant.findFirst.mockResolvedValue(null);

      await expect(service.findOne('missing-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('allows updating profile fields without touching email', async () => {
      prisma.applicant.findFirst.mockResolvedValue(baseApplicant);
      prisma.applicant.update.mockResolvedValue({ ...baseApplicant, name: 'Jane D.' });

      const result = await service.update('applicant-1', { name: 'Jane D.' } as any);

      expect(result.name).toBe('Jane D.');
      expect(prisma.applicant.findUnique).not.toHaveBeenCalled();
    });

    it('throws ConflictException when updating to an email already used by another applicant', async () => {
      prisma.applicant.findFirst.mockResolvedValue(baseApplicant);
      prisma.applicant.findUnique.mockResolvedValue({ ...baseApplicant, id: 'someone-else' });

      await expect(
        service.update('applicant-1', { email: 'taken@example.com' } as any),
      ).rejects.toThrow(ConflictException);
    });

    it('allows updating email to the same value the applicant already has', async () => {
      prisma.applicant.findFirst.mockResolvedValue(baseApplicant);
      prisma.applicant.update.mockResolvedValue(baseApplicant);

      await service.update('applicant-1', { email: baseApplicant.email } as any);

      expect(prisma.applicant.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('updateStatus', () => {
    it('allows a normal status transition, e.g. Pending -> Shortlisted', async () => {
      prisma.applicant.findFirst.mockResolvedValue(baseApplicant);
      prisma.applicant.update.mockResolvedValue({
        ...baseApplicant,
        status: ApplicantStatus.SHORTLISTED,
      });

      const result = await service.updateStatus('applicant-1', {
        status: ApplicantStatus.SHORTLISTED,
      } as any);

      expect(result.status).toBe(ApplicantStatus.SHORTLISTED);
    });

    it('blocks the Rejected -> Accepted transition', async () => {
      prisma.applicant.findFirst.mockResolvedValue({
        ...baseApplicant,
        status: ApplicantStatus.REJECTED,
      });

      await expect(
        service.updateStatus('applicant-1', { status: ApplicantStatus.ACCEPTED } as any),
      ).rejects.toThrow(BadRequestException);

      expect(prisma.applicant.update).not.toHaveBeenCalled();
    });

    it('allows moving a Rejected applicant back to Pending (not blocked by the rule)', async () => {
      prisma.applicant.findFirst.mockResolvedValue({
        ...baseApplicant,
        status: ApplicantStatus.REJECTED,
      });
      prisma.applicant.update.mockResolvedValue({
        ...baseApplicant,
        status: ApplicantStatus.PENDING,
      });

      const result = await service.updateStatus('applicant-1', {
        status: ApplicantStatus.PENDING,
      } as any);

      expect(result.status).toBe(ApplicantStatus.PENDING);
    });
  });

  describe('updateNotes', () => {
    it('updates notes for an existing applicant', async () => {
      prisma.applicant.findFirst.mockResolvedValue(baseApplicant);
      prisma.applicant.update.mockResolvedValue({ ...baseApplicant, notes: 'Great candidate' });

      const result = await service.updateNotes('applicant-1', { notes: 'Great candidate' } as any);

      expect(result.notes).toBe('Great candidate');
    });

    it('throws NotFoundException when the applicant does not exist', async () => {
      prisma.applicant.findFirst.mockResolvedValue(null);

      await expect(
        service.updateNotes('missing-id', { notes: 'test' } as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('soft-deletes by setting deletedAt instead of removing the row', async () => {
      prisma.applicant.findFirst.mockResolvedValue(baseApplicant);
      prisma.applicant.update.mockResolvedValue({ ...baseApplicant, deletedAt: new Date() });

      await service.remove('applicant-1');

      expect(prisma.applicant.update).toHaveBeenCalledWith({
        where: { id: 'applicant-1' },
        data: { deletedAt: expect.any(Date) },
      });
    });

    it('throws NotFoundException when the applicant is already deleted or missing', async () => {
      prisma.applicant.findFirst.mockResolvedValue(null);

      await expect(service.remove('missing-id')).rejects.toThrow(NotFoundException);
    });
  });
});