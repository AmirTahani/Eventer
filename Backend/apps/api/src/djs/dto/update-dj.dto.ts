import { IsOptional, IsString, MinLength, ValidateIf } from 'class-validator';

export class UpdateDjDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  photoKey?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  instagram?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  telegramUsername?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  genre?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  bio?: string | null;
}
