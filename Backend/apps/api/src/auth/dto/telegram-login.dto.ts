import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class TelegramLoginDto {
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

  @IsInt()
  auth_date!: number;

  @IsString()
  hash!: string;
}
