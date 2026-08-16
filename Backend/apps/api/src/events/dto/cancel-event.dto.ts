import { IsOptional, IsString } from 'class-validator';

export class CancelEventDto {
  @IsOptional()
  @IsString()
  reason?: string;
}
