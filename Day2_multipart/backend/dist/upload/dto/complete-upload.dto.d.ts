declare class PartDto {
    ETag: string;
    PartNumber: number;
}
export declare class CompleteUploadDto {
    uploadId: string;
    key: string;
    file_name: string;
    parts: PartDto[];
}
export {};
