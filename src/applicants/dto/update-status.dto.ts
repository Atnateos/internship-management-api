import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ApplicantStatus } from '../constants/applicant.constants';

export class UpdateStatusDto {
  @ApiProperty({ enum: ApplicantStatus, example: ApplicantStatus.SHORTLISTED })
  @IsEnum(ApplicantStatus)
  status!: ApplicantStatus;
}
