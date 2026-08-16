import { IsOptional, IsString, MinLength } from 'class-validator';

export class AcceptInvitationDto {
  @IsString()
  @MinLength(1)
  telegramUserId!: string;

  @IsOptional()
  @IsString()
  telegramUsername?: string;

  @IsString()
  @MinLength(1)
  firstName!: string;
}
