import { IsOptional, IsString, IsEnum, IsInt, IsIn, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ApplicantStatus, InternshipTrack } from '../constants/applicant.constants';

const SORTABLE_FIELDS = ['name', 'email', 'status', 'track', 'createdAt', 'updatedAt'] as const;
type SortableField = (typeof SORTABLE_FIELDS)[number];

export class QueryApplicantDto {
  @ApiPropertyOptional({ description: 'Search term for name or email' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ enum: ApplicantStatus })
  @IsEnum(ApplicantStatus)
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ enum: InternshipTrack })
  @IsEnum(InternshipTrack)
  @IsOptional()
  track?: string;

  @ApiPropertyOptional({ default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ default: 10 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 10;

  @ApiPropertyOptional({ enum: SORTABLE_FIELDS, default: 'createdAt' })
  @IsIn(SORTABLE_FIELDS)
  @IsOptional()
  sortBy?: SortableField = 'createdAt';

  @ApiPropertyOptional({ default: 'desc', enum: ['asc', 'desc'] })
  @IsIn(['asc', 'desc'])
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'desc';
}