import { UploadService } from './upload.service';
import { InitiateUploadDto } from './dto/initiate-upload.dto';
import { CompleteUploadDto } from './dto/complete-upload.dto';
export declare class UploadController {
    private readonly uploadService;
    constructor(uploadService: UploadService);
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
    getUploadedFiles(): import("./upload.service").UploadedFile[];
    getPresignedViewUrl(key: string): Promise<{
        url: string;
    }>;
}
