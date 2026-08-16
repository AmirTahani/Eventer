import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateInvitationDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  invitedTelegramUsername?: string;
}
