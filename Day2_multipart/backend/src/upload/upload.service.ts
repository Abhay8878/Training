import { Injectable } from '@nestjs/common';
import {
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  S3Client,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuid } from 'uuid';
import { InitiateUploadDto } from './dto/initiate-upload.dto';
import { CompleteUploadDto } from './dto/complete-upload.dto';

export interface UploadedFile {
  id: string;
  file_name: string;
  s3_key: string;
  uploaded_at: string;
}

@Injectable()
export class UploadService {
  // In-memory store of uploaded files
  private uploadedFiles: UploadedFile[] = [];

  private s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });

  private bucketName = process.env.S3_BUCKET_NAME!;

  /* ========== INITIATE MULTIPART UPLOAD ========== */
  async initiateMultipartUpload(body: InitiateUploadDto) {
    const { file_name, file_size, mimeType } = body;
    const key = `multipart-uploads/${uuid()}-${file_name}`;

    // 1. Create multipart upload
    const createCommand = new CreateMultipartUploadCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: mimeType || 'application/octet-stream',
    });

    const createResponse = await this.s3.send(createCommand);
    const uploadId = createResponse.UploadId;

    // 2. Calculate number of parts (5MB per part minimum)
    const chunkSize = 5 * 1024 * 1024; // byte * kb
    const partCount = Math.ceil(file_size / chunkSize);

    // 3. Generate presigned URLs for each part
    const presignedUrls = [];
    for (let i = 0; i < partCount; i++) {
      const uploadPartCommand = new UploadPartCommand({
        Bucket: this.bucketName,
        Key: key,
        UploadId: uploadId,
        PartNumber: i + 1,
      });

      const signedUrl = await getSignedUrl(this.s3, uploadPartCommand, {
        expiresIn: 3600, //1 hour
      });

      presignedUrls.push({
        partNumber: i + 1,
        url: signedUrl,
      });
    }

    return {
      uploadId,
      key,
      presignedUrls,
    };
  }

  /* ========== COMPLETE MULTIPART UPLOAD ========== */
  async completeMultipartUpload(body: CompleteUploadDto) {
    const { uploadId, key, parts, file_name } = body;

    const completeCommand = new CompleteMultipartUploadCommand({
      Bucket: this.bucketName,
      Key: key,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: parts,
      },
    });

    await this.s3.send(completeCommand);

    // Save to in-memory store
    const record: UploadedFile = {
      id: uuid(),
      file_name,
      s3_key: key,
      uploaded_at: new Date().toISOString(),
    };
    this.uploadedFiles.push(record);

    return {
      message: 'File uploaded successfully',
      key,
      fileId: record.id,
    };
  }

  /* ========== GET UPLOADED FILES ========== */
  getUploadedFiles() {
    return this.uploadedFiles;
  }

  /* ========== GET PRESIGNED VIEW URL ========== */
  async getPresignedViewUrl(key: string) {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    const signedUrl = await getSignedUrl(this.s3, command, {
      expiresIn: 604800, // 7 days
    });

    return { url: signedUrl };
  }
}
