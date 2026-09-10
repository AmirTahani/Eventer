import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class TelegramLoginDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id!: number;

  @IsString()
  first_name!: string;

  @IsOptional()
  @IsString()
  last_name?: string;

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  photo_url?: string;

  @Type(() => Number)
  @IsInt()
  auth_date!: number;

  @IsString()
  hash!: string;
}
