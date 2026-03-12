import { useState, useEffect, useRef } from 'react';
import {
  initiateMultipartUpload,
  uploadPartsToS3,
  completeMultipartUpload,
  getUploadedFiles,
  getPresignedViewUrl,
} from './api/multipart-upload';

interface UploadedFile {
  id: string;
  file_name: string;
  s3_key: string;
  uploaded_at: string;
}

function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadPhase, setUploadPhase] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch uploaded files on mount
  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      const data = await getUploadedFiles();
      setFiles(data || []);
    } catch {
      // Server may not be running yet
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError('');
      setSuccessMsg('');
      setUploadProgress(0);
      setUploadPhase('');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setError('');
    setSuccessMsg('');
    setUploadProgress(0);

    try {
      // Step 1: Initiate multipart upload
      setUploadPhase('Initiating upload...');
      const { uploadId, key, presignedUrls } = await initiateMultipartUpload({
        file_name: selectedFile.name,
        file_size: selectedFile.size,
        mimeType: selectedFile.type || 'application/octet-stream',
      });

      // Step 2: Upload parts to S3
      setUploadPhase('Uploading to S3...');
      const parts = await uploadPartsToS3({
        file: selectedFile,
        presignedUrls,
        onProgress: (percent) => setUploadProgress(percent),
      });

      // Step 3: Complete multipart upload
      setUploadPhase('Completing upload...');
      await completeMultipartUpload({
        uploadId,
        key,
        file_name: selectedFile.name,
        parts,
      });

      setUploadPhase('');
      setUploadProgress(100);
      setSuccessMsg(`"${selectedFile.name}" uploaded successfully!`);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      // Refresh file list
      await fetchFiles();
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Upload failed');
      setUploadPhase('');
    } finally {
      setIsUploading(false);
    }
  };

  const handleView3D = async (file: UploadedFile) => {
    try {
      const presignedUrl = await getPresignedViewUrl(file.s3_key);
      const viewerBaseUrl = 'https://meshviewer.cloud.dexis.com//?';

      // Determine format from file extension
      const ext = file.file_name.split('.').pop()?.toLowerCase() || 'stl';
      const formatMap: Record<string, string> = {
        stl: 'stl',
        obj: 'obj',
        ply: 'ply',
        glb: 'glTF',
        gltf: 'glTF',
      };
      const projectFormat = formatMap[ext] || 'stl';

      const viewerUrl = `${viewerBaseUrl}projectFormat=${projectFormat}&url=${encodeURIComponent(presignedUrl)}`;
      window.open(
        viewerUrl,
        '_blank',
        'width=1200,height=800,scrollbars=yes,resizable=yes',
      );
    } catch (err) {
      console.error('Failed to open 3D viewer', err);
      setError('Failed to generate view URL');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleString();
  };

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
            <h1>3D Image Upload</h1>
          </div>
          <p className="subtitle">Multipart S3 Upload with 3D Viewer</p>
        </div>
      </header>

      <main className="main">
        {/* Upload Section */}
        <section className="card upload-card">
          <h2 className="card-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Upload 3D Model
          </h2>

          <div className="upload-area">
            <input
              ref={fileInputRef}
              type="file"
              id="file-input"
              accept=".stl,.obj,.ply,.glb,.gltf,.dcm,.nrrd"
              onChange={handleFileSelect}
              disabled={isUploading}
            />
            <label htmlFor="file-input" className="file-label">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
              {selectedFile ? (
                <div className="file-info">
                  <span className="file-name">{selectedFile.name}</span>
                  <span className="file-size">{formatFileSize(selectedFile.size)}</span>
                </div>
              ) : (
                <div className="file-placeholder">
                  <span>Click to select a 3D model file</span>
                  <span className="file-types">STL, OBJ, PLY, GLB, GLTF</span>
                </div>
              )}
            </label>
          </div>

          {/* Progress Bar */}
          {(isUploading || uploadProgress > 0) && (
            <div className="progress-section">
              <div className="progress-header">
                <span className="progress-phase">{uploadPhase || 'Complete'}</span>
                <span className="progress-percent">{uploadProgress}%</span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Messages */}
          {error && <div className="message error">{error}</div>}
          {successMsg && <div className="message success">{successMsg}</div>}

          <button
            className="btn btn-primary"
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
          >
            {isUploading ? (
              <>
                <svg className="spinner" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" strokeDasharray="60" strokeDashoffset="20" />
                </svg>
                Uploading...
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                Upload File
              </>
            )}
          </button>
        </section>

        {/* Uploaded Files Section */}
        <section className="card files-card">
          <div className="card-title-row">
            <h2 className="card-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              Uploaded Files
            </h2>
            <button className="btn btn-ghost" onClick={fetchFiles}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
              Refresh
            </button>
          </div>

          {files.length === 0 ? (
            <div className="empty-state">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" opacity="0.3">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              </svg>
              <p>No files uploaded yet</p>
              <span>Upload a 3D model to get started</span>
            </div>
          ) : (
            <div className="file-list">
              {files.map((file) => (
                <div key={file.id} className="file-item">
                  <div className="file-item-icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                      <line x1="12" y1="22.08" x2="12" y2="12" />
                    </svg>
                  </div>
                  <div className="file-item-info">
                    <span className="file-item-name">{file.file_name}</span>
                    <span className="file-item-date">{formatDate(file.uploaded_at)}</span>
                  </div>
                  <button
                    className="btn btn-view"
                    onClick={() => handleView3D(file)}
                    title="View in 3D Viewer"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                    View 3D
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
