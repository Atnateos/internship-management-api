import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApplicantsService } from './applicants.service';
import { CreateApplicantDto } from './dto/create-applicant.dto';
import { UpdateApplicantDto } from './dto/update-applicant.dto';
import { QueryApplicantDto } from './dto/query-applicant.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { UpdateNotesDto } from './dto/update-notes.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Applicants')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/applicants')
export class ApplicantsController {
  constructor(private readonly applicantsService: ApplicantsService) {}

  @Post()
  @ApiOperation({ summary: 'Create applicant' })
  create(@Body() createApplicantDto: CreateApplicantDto) {
    return this.applicantsService.create(createApplicantDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get list of applicants' })
  findAll(@Query() query: QueryApplicantDto) {
    return this.applicantsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve single applicant' })
  findOne(@Param('id') id: string) {
    return this.applicantsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update applicant metadata' })
  update(
    @Param('id') id: string,
    @Body() updateApplicantDto: UpdateApplicantDto,
  ) {
    return this.applicantsService.update(id, updateApplicantDto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update candidate track status' })
  updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateStatusDto,
  ) {
    return this.applicantsService.updateStatus(id, updateStatusDto);
  }

  @Patch(':id/notes')
  @ApiOperation({ summary: 'Update candidate evaluation notes' })
  updateNotes(@Param('id') id: string, @Body() updateNotesDto: UpdateNotesDto) {
    return this.applicantsService.updateNotes(id, updateNotesDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete applicant' })
  remove(@Param('id') id: string) {
    return this.applicantsService.remove(id);
  }
}
