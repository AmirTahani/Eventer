import { IsOptional, IsString, MinLength } from 'class-validator';

export class UploadUrlDto {
  @IsString()
  @MinLength(1)
  contentType!: string;

  @IsOptional()
  @IsString()
  filename?: string;
}
