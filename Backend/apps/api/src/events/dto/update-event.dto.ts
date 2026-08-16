import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { EventVisibilityMode } from '@prisma/client';

export class UpdateEventDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  description?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  coverImageKey?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  category?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  dressCode?: string | null;

  @IsOptional()
  @IsBoolean()
  ageRestriction?: boolean;

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minAge?: number | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  rules?: string | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  djIds?: string[];

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  locationId?: string | null;

  @IsOptional()
  @IsDateString()
  startAt?: string;

  @IsOptional()
  @IsDateString()
  endAt?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  capacity?: number;

  @IsOptional()
  @IsBoolean()
  force?: boolean;

  @IsOptional()
  @IsString()
  @MinLength(1)
  price?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  currency?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxPeoplePerRegistration?: number;

  @IsOptional()
  @IsBoolean()
  approvalRequired?: boolean;

  @IsOptional()
  @IsEnum(EventVisibilityMode)
  visibilityMode?: EventVisibilityMode;

  @IsOptional()
  @IsBoolean()
  notifyOnEditDefault?: boolean;
}
