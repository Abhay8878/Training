import { IsString, IsArray, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

class PartDto {
  @IsString()
  ETag: string;

  @IsNumber()
  PartNumber: number;
}

export class CompleteUploadDto {
  @IsString()
  uploadId: string;

  @IsString()
  key: string;

  @IsString()
  file_name: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PartDto)
  parts: PartDto[];
}
