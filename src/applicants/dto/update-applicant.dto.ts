import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateApplicantDto } from './create-applicant.dto';

// `status` and `notes` are intentionally excluded here: they have their own
// dedicated endpoints (PATCH /:id/status, PATCH /:id/notes) with their own
// validation and business rules (e.g. the Rejected -> Accepted transition
// guard). Allowing them through the general update would bypass those rules.
export class UpdateApplicantDto extends PartialType(
  OmitType(CreateApplicantDto, ['status', 'notes'] as const),
) {}
