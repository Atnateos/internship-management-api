import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '../common/prisma/prisma.service';
import {
  ApplicantStatus,
  InternshipTrack,
} from '../applicants/constants/applicant.constants';

describe('DashboardService', () => {
  let service: DashboardService;
  let prisma: {
    applicant: {
      count: jest.Mock;
      groupBy: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      applicant: {
        count: jest.fn(),
        groupBy: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
  });

  afterEach(() => jest.clearAllMocks());

  it('excludes soft-deleted applicants from every aggregation query', async () => {
    prisma.applicant.count.mockResolvedValue(0);
    prisma.applicant.groupBy.mockResolvedValue([]);

    await service.getSummary();

    expect(prisma.applicant.count).toHaveBeenCalledWith({
      where: { deletedAt: null },
    });
    expect(prisma.applicant.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({ where: { deletedAt: null } }),
    );
  });

  it('defaults every status and track to 0 when there is no data for them', async () => {
    prisma.applicant.count.mockResolvedValue(1);
    prisma.applicant.groupBy
      .mockResolvedValueOnce([
        { status: ApplicantStatus.PENDING, _count: { status: 1 } },
      ])
      .mockResolvedValueOnce([
        { track: InternshipTrack.BACKEND, _count: { track: 1 } },
      ]);

    const result = await service.getSummary();

    expect(result.statusDistribution).toEqual({
      Pending: 1,
      Shortlisted: 0,
      Accepted: 0,
      Rejected: 0,
    });
    expect(result.trackDistribution).toEqual({
      'Frontend Development': 0,
      'Backend Development': 1,
      'Mobile Development': 0,
      'UI/UX Design': 0,
      'Data Analytics': 0,
    });
  });

  it('reports the correct total applicant count', async () => {
    prisma.applicant.count.mockResolvedValue(8);
    prisma.applicant.groupBy.mockResolvedValue([]);

    const result = await service.getSummary();

    expect(result.totalApplicants).toBe(8);
  });
});
