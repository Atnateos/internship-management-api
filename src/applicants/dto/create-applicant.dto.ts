import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InternshipTrack, ApplicantStatus } from '../constants/applicant.constants';

export class CreateApplicantDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  // Normalize casing/whitespace before validation and before it ever reaches
  // the database, so "A@x.com" and "a@x.com" are treated as the same address.
  @Transform(({ value }) => (typeof value === 'string' ? value.toLowerCase().trim() : value))
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({ example: '+1234567890' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ enum: InternshipTrack, example: InternshipTrack.BACKEND })
  @IsEnum(InternshipTrack)
  track!: string;

  @ApiPropertyOptional({ enum: ApplicantStatus, default: ApplicantStatus.PENDING })
  @IsEnum(ApplicantStatus)
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ example: 'Solid understanding of Node.js.', maxLength: 1000 })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  notes?: string;
}