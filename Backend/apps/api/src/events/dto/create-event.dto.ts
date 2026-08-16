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
  ValidateNested,
} from 'class-validator';
import { EventVisibilityMode } from '@prisma/client';

class PricingTierDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsString()
  @MinLength(1)
  price!: string;

  @IsDateString()
  startsAt!: string;
}

export class CreateEventDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  coverImageKey?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  dressCode?: string;

  @IsOptional()
  @IsBoolean()
  ageRestriction?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minAge?: number;

  @IsOptional()
  @IsString()
  rules?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  djIds?: string[];

  @IsOptional()
  @IsString()
  locationId?: string | null;

  @IsDateString()
  startAt!: string;

  @IsDateString()
  endAt!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  capacity!: number;

  @IsString()
  @MinLength(1)
  price!: string;

  @IsString()
  @MinLength(3)
  currency!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxPeoplePerRegistration!: number;

  @IsOptional()
  @IsBoolean()
  approvalRequired?: boolean;

  @IsOptional()
  @IsEnum(EventVisibilityMode)
  visibilityMode?: EventVisibilityMode;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PricingTierDto)
  pricingTiers?: PricingTierDto[];

  @IsOptional()
  @IsBoolean()
  notifyOnEditDefault?: boolean;
}
