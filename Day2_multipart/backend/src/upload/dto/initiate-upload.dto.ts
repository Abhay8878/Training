import { IsString, IsNumber } from 'class-validator';

export class InitiateUploadDto {
  @IsString()
  file_name: string;

  @IsNumber()
  file_size: number;

  @IsString()
  mimeType: string;
}
