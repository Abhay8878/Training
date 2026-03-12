import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { UploadService } from './upload.service';
import { InitiateUploadDto } from './dto/initiate-upload.dto';
import { CompleteUploadDto } from './dto/complete-upload.dto';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  /* ---------- INITIATE MULTIPART ---------- */
  @Post('initiate')
  async initiateMultipartUpload(@Body() body: InitiateUploadDto) {
    return this.uploadService.initiateMultipartUpload(body);
  }

  /* ---------- COMPLETE MULTIPART ---------- */
  @Post('complete')
  async completeMultipartUpload(@Body() body: CompleteUploadDto) {
    return this.uploadService.completeMultipartUpload(body);
  }

  /* ---------- LIST UPLOADED FILES ---------- */
  @Get('files')
  getUploadedFiles() {
    return this.uploadService.getUploadedFiles();
  }

  /* ---------- GET PRESIGNED VIEW URL ---------- */
  @Get('view-file')
  async getPresignedViewUrl(@Query('key') key: string) {
    return this.uploadService.getPresignedViewUrl(key);
  }
}
