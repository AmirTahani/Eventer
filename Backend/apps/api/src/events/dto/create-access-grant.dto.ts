import { IsEnum, IsString, MinLength } from 'class-validator';
import { EventAccessGrantType } from '@prisma/client';

export class CreateAccessGrantDto {
  @IsEnum(EventAccessGrantType)
  grantType!: EventAccessGrantType;

  @IsString()
  @MinLength(1)
  subjectUserId!: string;
}
