import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';

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

export class ReplacePricingTiersDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PricingTierDto)
  tiers!: PricingTierDto[];

  @IsOptional()
  @IsBoolean()
  force?: boolean;
}
