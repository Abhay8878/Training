import { InitiateUploadDto } from './dto/initiate-upload.dto';
import { CompleteUploadDto } from './dto/complete-upload.dto';
export interface UploadedFile {
    id: string;
    file_name: string;
    s3_key: string;
    uploaded_at: string;
}
export declare class UploadService {
    private uploadedFiles;
    private s3;
    private bucketName;
    initiateMultipartUpload(body: InitiateUploadDto): Promise<{
        uploadId: string;
        key: string;
        presignedUrls: any[];
    }>;
    completeMultipartUpload(body: CompleteUploadDto): Promise<{
        message: string;
        key: string;
        fileId: string;
    }>;
    getUploadedFiles(): UploadedFile[];
    getPresignedViewUrl(key: string): Promise<{
        url: string;
    }>;
}
