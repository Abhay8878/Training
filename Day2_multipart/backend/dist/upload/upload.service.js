"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadService = void 0;
const common_1 = require("@nestjs/common");
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const uuid_1 = require("uuid");
let UploadService = class UploadService {
    constructor() {
        this.uploadedFiles = [];
        this.s3 = new client_s3_1.S3Client({
            region: process.env.AWS_REGION,
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            },
        });
        this.bucketName = process.env.S3_BUCKET_NAME;
    }
    async initiateMultipartUpload(body) {
        const { file_name, file_size, mimeType } = body;
        const key = `multipart-uploads/${(0, uuid_1.v4)()}-${file_name}`;
        const createCommand = new client_s3_1.CreateMultipartUploadCommand({
            Bucket: this.bucketName,
            Key: key,
            ContentType: mimeType || 'application/octet-stream',
        });
        const createResponse = await this.s3.send(createCommand);
        const uploadId = createResponse.UploadId;
        const chunkSize = 5 * 1024 * 1024;
        const partCount = Math.ceil(file_size / chunkSize);
        const presignedUrls = [];
        for (let i = 0; i < partCount; i++) {
            const uploadPartCommand = new client_s3_1.UploadPartCommand({
                Bucket: this.bucketName,
                Key: key,
                UploadId: uploadId,
                PartNumber: i + 1,
            });
            const signedUrl = await (0, s3_request_presigner_1.getSignedUrl)(this.s3, uploadPartCommand, {
                expiresIn: 3600,
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
    async completeMultipartUpload(body) {
        const { uploadId, key, parts, file_name } = body;
        const completeCommand = new client_s3_1.CompleteMultipartUploadCommand({
            Bucket: this.bucketName,
            Key: key,
            UploadId: uploadId,
            MultipartUpload: {
                Parts: parts,
            },
        });
        await this.s3.send(completeCommand);
        const record = {
            id: (0, uuid_1.v4)(),
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
    getUploadedFiles() {
        return this.uploadedFiles;
    }
    async getPresignedViewUrl(key) {
        const command = new client_s3_1.GetObjectCommand({
            Bucket: this.bucketName,
            Key: key,
        });
        const signedUrl = await (0, s3_request_presigner_1.getSignedUrl)(this.s3, command, {
            expiresIn: 604800,
        });
        return { url: signedUrl };
    }
};
exports.UploadService = UploadService;
exports.UploadService = UploadService = __decorate([
    (0, common_1.Injectable)()
], UploadService);
//# sourceMappingURL=upload.service.js.map