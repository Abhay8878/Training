import axios from 'axios';

const API_BASE = 'http://localhost:3002';

const api = axios.create({
  baseURL: API_BASE,
});

/* ===========================
   INITIATE MULTIPART UPLOAD
=========================== */
export async function initiateMultipartUpload(data: {
  file_name: string;
  file_size: number;
  mimeType: string;
}) {
  const result = await api.post('/upload/initiate', data);
  return result.data.data;
}

/* ===========================
   UPLOAD PARTS TO S3
=========================== */
export async function uploadPartsToS3({
  file,
  presignedUrls,
  onProgress,
}: {
  file: File;
  presignedUrls: { partNumber: number; url: string }[];
  onProgress?: (percent: number) => void;
}) {
  const chunkSize = 5 * 1024 * 1024; // 5MB
  const parts: { ETag: string; PartNumber: number }[] = [];

  for (let i = 0; i < presignedUrls.length; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, file.size);
    const blob = file.slice(start, end);

    const response = await axios.put(presignedUrls[i].url, blob, {
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
      },
    });
    console.log(response.headers['etag'])
    const ETag = response.headers['etag'];
    if (!ETag) {
      throw new Error('Missing ETag from S3');
    }

    parts.push({
      ETag: ETag.replace(/"/g, ''),
      PartNumber: presignedUrls[i].partNumber,
    });

    if (onProgress) {
      const percent = Math.round(((i + 1) / presignedUrls.length) * 100);
      onProgress(percent);
    }
  }

  return parts;
}

/* ===========================
   COMPLETE MULTIPART
=========================== */
export async function completeMultipartUpload(data: {
  uploadId: string;
  key: string;
  file_name: string;
  parts: { ETag: string; PartNumber: number }[];
}) {
  const result = await api.post('/upload/complete', data);
  return result.data.data;
}

/* ===========================
   GET UPLOADED FILES
=========================== */
export async function getUploadedFiles() {
  const result = await api.get('/upload/files');
  return result.data.data;
}

/* ===========================
   GET PRESIGNED VIEW URL
=========================== */
export async function getPresignedViewUrl(key: string) {
  const result = await api.get('/upload/view-file', {
    params: { key },
  });
  return result.data.data.url;
}
