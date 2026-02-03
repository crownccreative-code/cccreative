import React, { useEffect, useState, useCallback } from 'react';
import { Upload, File, Trash2, Image, Video, FileText } from 'lucide-react';
import api from '../../api/client';
import { toast } from 'sonner';

export default function PortalFiles() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      const data = await api.getFiles();
      setFiles(data);
    } catch (error) {
      toast.error('Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = useCallback(async (uploadFiles) => {
    if (!uploadFiles || uploadFiles.length === 0) return;

    setUploading(true);
    try {
      for (const file of uploadFiles) {
        const isVideo = file.type.startsWith('video/');
        const resourceType = isVideo ? 'video' : 'image';

        // Get signature
        const sig = await api.getUploadSignature(resourceType, 'uploads/');

        // Upload to Cloudinary
        const formData = new FormData();
        formData.append('file', file);
        formData.append('api_key', sig.api_key);
        formData.append('timestamp', sig.timestamp);
        formData.append('signature', sig.signature);
        formData.append('folder', sig.folder);

        const cloudinaryRes = await fetch(
          `https://api.cloudinary.com/v1_1/${sig.cloud_name}/${resourceType}/upload`,
          { method: 'POST', body: formData }
        );

        if (!cloudinaryRes.ok) {
          throw new Error('Upload failed');
        }

        const result = await cloudinaryRes.json();

        // Register file in backend
        await api.registerFileUpload({
          filename: file.name,
          url: result.secure_url,
          public_id: result.public_id,
          mime_type: file.type,
          size: result.bytes
        });

        toast.success(`${file.name} uploaded`);
      }

      fetchFiles();
    } catch (error) {
      toast.error(error.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }, []);

  const handleDelete = async (fileId) => {
    if (!window.confirm('Are you sure you want to delete this file?')) return;

    try {
      await api.deleteFile(fileId);
      toast.success('File deleted');
      setFiles(files.filter(f => f.id !== fileId));
    } catch (error) {
      toast.error('Failed to delete file');
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(Array.from(e.dataTransfer.files));
    }
  };

  const getFileIcon = (mimeType) => {
    if (mimeType?.startsWith('image/')) return <Image className="w-6 h-6 text-blue-400" />;
    if (mimeType?.startsWith('video/')) return <Video className="w-6 h-6 text-purple-400" />;
    return <FileText className="w-6 h-6 text-slate-400" />;
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black uppercase tracking-tight mb-2">Files</h1>
        <p className="text-slate-500 font-mono text-xs uppercase tracking-widest">Upload and manage your files</p>
      </div>

      {/* Upload Zone */}
      <div
        className={`card p-8 mb-8 border-dashed border-2 transition-colors ${
          dragActive ? 'border-blue-500 bg-blue-500/5' : 'border-white/10'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="text-center">
          {uploading ? (
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4" />
              <p className="text-slate-400">Uploading...</p>
            </div>
          ) : (
            <>
              <Upload className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-lg font-semibold mb-2">Drop files here to upload</p>
              <p className="text-sm text-slate-500 mb-4">or click to browse</p>
              <label className="btn-primary cursor-pointer inline-flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Choose Files
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => handleUpload(Array.from(e.target.files))}
                  accept="image/*,video/*,.pdf,.doc,.docx"
                  data-testid="file-input"
                />
              </label>
            </>
          )}
        </div>
      </div>

      {/* Files List */}
      {files.length === 0 ? (
        <div className="card p-12 text-center">
          <File className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold mb-2">No Files</h3>
          <p className="text-slate-500 text-sm">Upload your first file above</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {files.map(file => (
            <div key={file.id} className="card p-4" data-testid={`file-${file.id}`}>
              <div className="flex items-start gap-4">
                {file.mime_type?.startsWith('image/') ? (
                  <img 
                    src={file.url} 
                    alt={file.filename}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-16 h-16 bg-white/5 rounded-lg flex items-center justify-center">
                    {getFileIcon(file.mime_type)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate" title={file.filename}>{file.filename}</p>
                  <p className="text-xs text-slate-500">
                    {formatSize(file.size)} • {new Date(file.created_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(file.id)}
                  className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  data-testid={`delete-file-${file.id}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <a
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 block text-center text-xs font-mono text-blue-400 hover:text-blue-300 uppercase tracking-widest transition-colors"
              >
                View File
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
