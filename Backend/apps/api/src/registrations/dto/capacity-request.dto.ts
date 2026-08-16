import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class CapacityRequestDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  requestedExtraPeople!: number;
}
