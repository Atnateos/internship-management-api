import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { ApplicantStatus, InternshipTrack } from '../applicants/constants/applicant.constants';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getSummary() {
    const activeFilter = { deletedAt: null }; // Exclude soft-deleted candidates

    const [total, statusGroups, trackGroups] = await Promise.all([
      this.prisma.applicant.count({ where: activeFilter }),
      this.prisma.applicant.groupBy({
        by: ['status'],
        where: activeFilter,
        _count: { status: true },
      }),
      this.prisma.applicant.groupBy({
        by: ['track'],
        where: activeFilter,
        _count: { track: true },
      }),
    ]);

    // Construct response metrics by mapping database groups to our defined enums
    const statusDistribution = Object.values(ApplicantStatus).reduce((acc, status) => {
      const match = statusGroups.find((g) => g.status === status);
      acc[status] = match ? match._count.status : 0;
      return acc;
    }, {} as Record<string, number>);

    const trackDistribution = Object.values(InternshipTrack).reduce((acc, track) => {
      const match = trackGroups.find((g) => g.track === track);
      acc[track] = match ? match._count.track : 0;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalApplicants: total,
      statusDistribution,
      trackDistribution,
    };
  }
}