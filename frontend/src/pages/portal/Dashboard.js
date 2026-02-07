import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  Crown,
  CheckCircle, 
  Circle, 
  Upload, 
  File, 
  Image, 
  Video, 
  FileText,
  Trash2,
  MessageSquare,
  ArrowRight,
  Clock
} from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';

export default function PortalDashboard() {
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [files, setFiles] = useState([]);
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [projectData, filesData, threadsData] = await Promise.all([
        api.getMyProject(),
        api.getProjectFiles(user.id).catch(() => []),
        api.getThreads().catch(() => [])
      ]);
      setProject(projectData);
      setFiles(filesData);
      setThreads(threadsData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStep = async (stepId, currentCompleted) => {
    try {
      await api.toggleNextStep(stepId, !currentCompleted);
      setProject({
        ...project,
        next_steps: project.next_steps.map(s => 
          s.id === stepId ? { ...s, completed: !currentCompleted } : s
        )
      });
    } catch (error) {
      toast.error('Failed to update step');
    }
  };

  const handleFileUpload = useCallback(async (uploadFiles) => {
    if (!uploadFiles || uploadFiles.length === 0) return;
    setUploading(true);

    try {
      for (const file of uploadFiles) {
        const isVideo = file.type.startsWith('video/');
        const resourceType = isVideo ? 'video' : 'image';

        // Get signature
        const sig = await api.getUploadSignature(resourceType, 'projects/');

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

        if (!cloudinaryRes.ok) throw new Error('Upload failed');
        const result = await cloudinaryRes.json();

        // Register file
        const newFile = await api.uploadProjectFile(user.id, {
          filename: file.name,
          url: result.secure_url,
          public_id: result.public_id,
          mime_type: file.type,
          size: result.bytes,
          uploaded_by: 'client'
        });

        setFiles(prev => [newFile, ...prev]);
        toast.success(`${file.name} uploaded`);
      }
    } catch (error) {
      toast.error('File upload failed. Please contact admin.');
    } finally {
      setUploading(false);
    }
  }, [user.id]);

  const handleDeleteFile = async (fileId) => {
    if (!window.confirm('Delete this file?')) return;
    try {
      await api.deleteProjectFile(fileId);
      setFiles(files.filter(f => f.id !== fileId));
      toast.success('File deleted');
    } catch (error) {
      toast.error('Failed to delete file');
    }
  };

  const getFileIcon = (mimeType) => {
    if (mimeType?.startsWith('image/')) return <Image className="w-5 h-5 text-blue-400" />;
    if (mimeType?.startsWith('video/')) return <Video className="w-5 h-5 text-purple-400" />;
    return <FileText className="w-5 h-5 text-slate-400" />;
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const completedSteps = project?.next_steps?.filter(s => s.completed).length || 0;
  const totalSteps = project?.next_steps?.length || 0;

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Welcome Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <Crown className="w-8 h-8 text-[#D4AF37]" />
          <h1 className="text-3xl font-black uppercase tracking-tight">
            Welcome, {user?.name?.split(' ')[0]}
          </h1>
        </div>
        <p className="text-slate-500 font-mono text-xs uppercase tracking-widest">
          Your Personal Client Portal
        </p>
      </div>

      {/* Project Status Card */}
      <div className="mb-8 p-8 rounded-2xl relative overflow-hidden" style={{ backgroundColor: '#0A0A0A', border: '1px solid rgba(255,255,255,0.05)' }}>
        {/* Decorative glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[100px] rounded-full"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-yellow-500/5 blur-[80px] rounded-full"></div>
        
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-2">Project Status</p>
              <h2 className="text-2xl font-bold text-white">{project?.status_text || 'Getting Started'}</h2>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">Progress</p>
              <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-[#D4AF37]">
                {project?.progress_percentage || 0}%
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="h-3 bg-white/5 rounded-full overflow-hidden mb-2">
            <div 
              className="h-full rounded-full transition-all duration-1000 ease-out"
              style={{ 
                width: `${project?.progress_percentage || 0}%`,
                background: 'linear-gradient(90deg, #3B82F6, #60A5FA, #D4AF37)'
              }}
            />
          </div>
          <p className="text-[10px] font-mono text-slate-600 text-right">
            Last updated: {project?.updated_at ? new Date(project.updated_at).toLocaleDateString() : 'N/A'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Next Steps / Action Items */}
        <div className="p-6 rounded-xl" style={{ backgroundColor: '#0A0A0A', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">Next Steps</p>
              <h3 className="text-lg font-bold">Action Items</h3>
            </div>
            {totalSteps > 0 && (
              <span className="text-sm font-mono text-slate-500">
                {completedSteps}/{totalSteps} completed
              </span>
            )}
          </div>

          {project?.next_steps?.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-10 h-10 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">No action items yet</p>
              <p className="text-slate-600 text-xs mt-1">Your project manager will add tasks here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {project?.next_steps?.map((step) => (
                <button
                  key={step.id}
                  onClick={() => handleToggleStep(step.id, step.completed)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl text-left transition-all duration-200 ${
                    step.completed 
                      ? 'bg-green-500/5 border border-green-500/20' 
                      : 'bg-white/[0.02] border border-white/5 hover:border-blue-500/30'
                  }`}
                  data-testid={`step-${step.id}`}
                >
                  {step.completed ? (
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-600 flex-shrink-0" />
                  )}
                  <span className={`text-sm ${step.completed ? 'line-through text-slate-500' : 'text-white'}`}>
                    {step.text}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Messages Preview */}
        <div className="p-6 rounded-xl" style={{ backgroundColor: '#0A0A0A', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">Communication</p>
              <h3 className="text-lg font-bold">Messages</h3>
            </div>
            <Link 
              to="/portal/messages" 
              className="text-[10px] font-mono text-blue-400 uppercase tracking-widest hover:text-blue-300 flex items-center gap-1"
            >
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {threads.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="w-10 h-10 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">No messages yet</p>
              <Link to="/portal/messages" className="text-blue-400 text-xs mt-2 inline-block hover:text-blue-300">
                Start a conversation
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {threads.slice(0, 3).map(thread => (
                <Link
                  key={thread.id}
                  to={`/portal/messages/${thread.id}`}
                  className="flex items-center gap-4 p-4 bg-white/[0.02] border border-white/5 rounded-xl hover:border-blue-500/30 transition-colors"
                >
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <MessageSquare className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{thread.subject}</p>
                    <p className="text-xs text-slate-500 truncate">{thread.last_message || 'No messages yet'}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Project Files */}
      <div className="mt-8 p-6 rounded-xl" style={{ backgroundColor: '#0A0A0A', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">Shared Files</p>
            <h3 className="text-lg font-bold">Project Files</h3>
          </div>
        </div>

        {/* Upload Zone */}
        <label className={`flex items-center justify-center gap-3 p-6 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 mb-6 ${
          uploading 
            ? 'border-blue-500/50 bg-blue-500/5' 
            : 'border-white/10 hover:border-[#D4AF37]/50 hover:bg-yellow-500/5'
        }`}>
          {uploading ? (
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Upload className="w-5 h-5 text-[#D4AF37]" />
          )}
          <span className="text-sm text-slate-400">
            {uploading ? 'Uploading...' : 'Click to upload files for your project'}
          </span>
          <input
            type="file"
            multiple
            className="hidden"
            onChange={(e) => handleFileUpload(Array.from(e.target.files))}
            disabled={uploading}
            accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx"
            data-testid="client-file-upload"
          />
        </label>

        {/* Files Grid */}
        {files.length === 0 ? (
          <div className="text-center py-8">
            <File className="w-10 h-10 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">No files shared yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {files.map(file => (
              <div 
                key={file.id} 
                className="flex items-center gap-4 p-4 bg-white/[0.02] border border-white/5 rounded-xl group hover:border-white/20 transition-colors"
              >
                <div className="p-3 bg-white/5 rounded-lg">
                  {getFileIcon(file.mime_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" title={file.filename}>{file.filename}</p>
                  <p className="text-[10px] text-slate-500">
                    {formatSize(file.size)} • {file.uploaded_by === 'admin' ? 'From CCC' : 'Uploaded by you'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] font-mono text-blue-400 uppercase tracking-wider hover:text-blue-300"
                  >
                    View
                  </a>
                  {file.uploaded_by === 'client' && (
                    <button
                      onClick={() => handleDeleteFile(file.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:bg-red-500/10 rounded transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
