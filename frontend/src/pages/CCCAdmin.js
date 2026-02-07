import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Crown, 
  Users, 
  ChevronRight, 
  Search, 
  Plus, 
  Trash2, 
  Save, 
  ArrowLeft,
  CheckCircle,
  Circle,
  Upload,
  File,
  Image,
  Video,
  FileText,
  LogOut,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { toast } from 'sonner';

const CCC_ADMIN_EMAIL = 'crownccreative@gmail.com';

export default function CCCAdmin() {
  const navigate = useNavigate();
  const { user, logout, loading: authLoading } = useAuth();
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientProject, setClientProject] = useState(null);
  const [projectFiles, setProjectFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newStepText, setNewStepText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [uploading, setUploading] = useState(false);

  // Check if user is authorized
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate('/login');
        return;
      }
      if (user.email.toLowerCase() !== CCC_ADMIN_EMAIL.toLowerCase()) {
        toast.error('Access denied. CCC Admin only.');
        navigate('/');
        return;
      }
      fetchClients();
    }
  }, [user, authLoading, navigate]);

  const fetchClients = async () => {
    try {
      const data = await api.getAllClients();
      setClients(data);
    } catch (error) {
      toast.error('Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  const selectClient = async (client) => {
    setSelectedClient(client);
    try {
      const [project, files] = await Promise.all([
        api.getClientProject(client.id),
        api.getProjectFiles(client.id).catch(() => [])
      ]);
      setClientProject(project);
      setProjectFiles(files);
    } catch (error) {
      toast.error('Failed to load client project');
    }
  };

  const handleSaveProject = async () => {
    if (!clientProject) return;
    setSaving(true);
    try {
      await api.updateClientProject(selectedClient.id, {
        status_text: clientProject.status_text,
        progress_percentage: clientProject.progress_percentage,
        next_steps: clientProject.next_steps,
        notes: clientProject.notes
      });
      toast.success('Project saved successfully');
      fetchClients(); // Refresh client list
    } catch (error) {
      toast.error('Failed to save project');
    } finally {
      setSaving(false);
    }
  };

  const handleAddNextStep = async () => {
    if (!newStepText.trim()) return;
    try {
      const result = await api.addNextStep(selectedClient.id, newStepText);
      setClientProject({
        ...clientProject,
        next_steps: [...clientProject.next_steps, result.step]
      });
      setNewStepText('');
      toast.success('Step added');
    } catch (error) {
      toast.error('Failed to add step');
    }
  };

  const handleRemoveStep = async (stepId) => {
    try {
      await api.removeNextStep(selectedClient.id, stepId);
      setClientProject({
        ...clientProject,
        next_steps: clientProject.next_steps.filter(s => s.id !== stepId)
      });
      toast.success('Step removed');
    } catch (error) {
      toast.error('Failed to remove step');
    }
  };

  const handleToggleStep = (stepId) => {
    setClientProject({
      ...clientProject,
      next_steps: clientProject.next_steps.map(s => 
        s.id === stepId ? { ...s, completed: !s.completed } : s
      )
    });
  };

  const handleFileUpload = async (files) => {
    if (!files || files.length === 0) return;
    setUploading(true);

    try {
      for (const file of files) {
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
        const newFile = await api.uploadProjectFile(selectedClient.id, {
          filename: file.name,
          url: result.secure_url,
          public_id: result.public_id,
          mime_type: file.type,
          size: result.bytes,
          uploaded_by: 'admin'
        });

        setProjectFiles(prev => [newFile, ...prev]);
        toast.success(`${file.name} uploaded`);
      }
    } catch (error) {
      toast.error('File upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFile = async (fileId) => {
    if (!window.confirm('Delete this file?')) return;
    try {
      await api.deleteProjectFile(fileId);
      setProjectFiles(projectFiles.filter(f => f.id !== fileId));
      toast.success('File deleted');
    } catch (error) {
      toast.error('Failed to delete file');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getFileIcon = (mimeType) => {
    if (mimeType?.startsWith('image/')) return <Image className="w-4 h-4 text-blue-400" />;
    if (mimeType?.startsWith('video/')) return <Video className="w-4 h-4 text-purple-400" />;
    return <FileText className="w-4 h-4 text-slate-400" />;
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-[#F5F5F7]">
      {/* Header */}
      <header className="border-b border-white/5 bg-[#0A0A0A]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Crown className="w-6 h-6 text-[#D4AF37]" />
            <div>
              <h1 className="text-lg font-bold tracking-wide uppercase">CCC Admin</h1>
              <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Client Management</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-[10px] font-mono uppercase tracking-widest text-slate-500 hover:text-red-400 transition-colors"
            data-testid="ccc-admin-logout"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Client List */}
          <div className="lg:col-span-1">
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search clients..."
                  className="w-full pl-10 pr-4 py-3 bg-[#0A0A0A] border border-white/10 rounded-xl text-sm focus:border-blue-500/50 focus:outline-none transition-colors"
                  data-testid="client-search"
                />
              </div>
            </div>

            <div className="space-y-3">
              {filteredClients.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm">No clients found</p>
                </div>
              ) : (
                filteredClients.map(client => (
                  <button
                    key={client.id}
                    onClick={() => selectClient(client)}
                    className={`w-full p-4 rounded-xl border text-left transition-all duration-200 ${
                      selectedClient?.id === client.id
                        ? 'bg-blue-500/10 border-blue-500/50'
                        : 'bg-[#0A0A0A] border-white/5 hover:border-white/20'
                    }`}
                    data-testid={`client-${client.id}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{client.name}</p>
                        <p className="text-xs text-slate-500">{client.email}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-600" />
                    </div>
                    {client.has_project && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mb-1">
                          <span>{client.status_text || 'No status'}</span>
                          <span>{client.progress_percentage || 0}%</span>
                        </div>
                        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-blue-500 to-[#D4AF37] transition-all duration-500"
                            style={{ width: `${client.progress_percentage || 0}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Project Editor */}
          <div className="lg:col-span-2">
            {!selectedClient ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <Users className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                  <p className="text-slate-500">Select a client to manage their project</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Client Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">{selectedClient.name}</h2>
                    <p className="text-sm text-slate-500">{selectedClient.email}</p>
                  </div>
                  <button
                    onClick={handleSaveProject}
                    disabled={saving}
                    className="btn-primary flex items-center gap-2"
                    data-testid="save-project-btn"
                  >
                    {saving ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Save Changes
                  </button>
                </div>

                {clientProject && (
                  <>
                    {/* Status & Progress */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-6 bg-[#0A0A0A] border border-white/5 rounded-xl">
                        <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-3">
                          Project Status
                        </label>
                        <input
                          type="text"
                          value={clientProject.status_text}
                          onChange={(e) => setClientProject({ ...clientProject, status_text: e.target.value })}
                          className="w-full bg-[#151515] border border-white/10 rounded-lg px-4 py-3 text-sm focus:border-blue-500/50 focus:outline-none"
                          placeholder="e.g., In Progress, Review, Completed"
                          data-testid="status-input"
                        />
                      </div>

                      <div className="p-6 bg-[#0A0A0A] border border-white/5 rounded-xl">
                        <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-3">
                          Progress: {clientProject.progress_percentage}%
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={clientProject.progress_percentage}
                          onChange={(e) => setClientProject({ ...clientProject, progress_percentage: parseInt(e.target.value) })}
                          className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500"
                          data-testid="progress-slider"
                        />
                        <div className="mt-3 h-2 bg-white/5 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-blue-500 to-[#D4AF37] transition-all"
                            style={{ width: `${clientProject.progress_percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Next Steps */}
                    <div className="p-6 bg-[#0A0A0A] border border-white/5 rounded-xl">
                      <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-4">
                        Next Steps / Action Items
                      </label>
                      
                      {/* Add new step */}
                      <div className="flex gap-3 mb-4">
                        <input
                          type="text"
                          value={newStepText}
                          onChange={(e) => setNewStepText(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleAddNextStep()}
                          className="flex-1 bg-[#151515] border border-white/10 rounded-lg px-4 py-2 text-sm focus:border-blue-500/50 focus:outline-none"
                          placeholder="Add a new action item..."
                          data-testid="new-step-input"
                        />
                        <button
                          onClick={handleAddNextStep}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
                          data-testid="add-step-btn"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Steps list */}
                      <div className="space-y-2">
                        {clientProject.next_steps.length === 0 ? (
                          <p className="text-slate-600 text-sm text-center py-4">No action items yet</p>
                        ) : (
                          clientProject.next_steps.map((step, idx) => (
                            <div 
                              key={step.id} 
                              className="flex items-center gap-3 p-3 bg-[#151515] rounded-lg group"
                            >
                              <button
                                onClick={() => handleToggleStep(step.id)}
                                className="flex-shrink-0"
                              >
                                {step.completed ? (
                                  <CheckCircle className="w-5 h-5 text-green-500" />
                                ) : (
                                  <Circle className="w-5 h-5 text-slate-600" />
                                )}
                              </button>
                              <span className={`flex-1 text-sm ${step.completed ? 'line-through text-slate-500' : ''}`}>
                                {step.text}
                              </span>
                              <button
                                onClick={() => handleRemoveStep(step.id)}
                                className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:bg-red-500/10 rounded transition-all"
                                data-testid={`remove-step-${step.id}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Notes */}
                    <div className="p-6 bg-[#0A0A0A] border border-white/5 rounded-xl">
                      <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-3">
                        Internal Notes
                      </label>
                      <textarea
                        value={clientProject.notes || ''}
                        onChange={(e) => setClientProject({ ...clientProject, notes: e.target.value })}
                        className="w-full bg-[#151515] border border-white/10 rounded-lg px-4 py-3 text-sm focus:border-blue-500/50 focus:outline-none resize-none h-24"
                        placeholder="Add notes about this project..."
                        data-testid="notes-textarea"
                      />
                    </div>

                    {/* Files */}
                    <div className="p-6 bg-[#0A0A0A] border border-white/5 rounded-xl">
                      <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-4">
                        Project Files
                      </label>

                      {/* Upload */}
                      <label className={`flex items-center justify-center gap-3 p-6 border-2 border-dashed rounded-xl cursor-pointer transition-colors mb-4 ${
                        uploading ? 'border-blue-500/50 bg-blue-500/5' : 'border-white/10 hover:border-white/30'
                      }`}>
                        {uploading ? (
                          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Upload className="w-5 h-5 text-slate-500" />
                        )}
                        <span className="text-sm text-slate-400">
                          {uploading ? 'Uploading...' : 'Click to upload files for this client'}
                        </span>
                        <input
                          type="file"
                          multiple
                          className="hidden"
                          onChange={(e) => handleFileUpload(Array.from(e.target.files))}
                          disabled={uploading}
                          data-testid="file-upload-input"
                        />
                      </label>

                      {/* Files list */}
                      <div className="space-y-2">
                        {projectFiles.length === 0 ? (
                          <p className="text-slate-600 text-sm text-center py-4">No files uploaded yet</p>
                        ) : (
                          projectFiles.map(file => (
                            <div key={file.id} className="flex items-center gap-3 p-3 bg-[#151515] rounded-lg group">
                              {getFileIcon(file.mime_type)}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{file.filename}</p>
                                <p className="text-[10px] text-slate-500">
                                  {formatSize(file.size)} • Uploaded by {file.uploaded_by === 'admin' ? 'You' : file.uploader_name}
                                </p>
                              </div>
                              <a
                                href={file.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] font-mono text-blue-400 hover:text-blue-300 uppercase tracking-wider"
                              >
                                View
                              </a>
                              <button
                                onClick={() => handleDeleteFile(file.id)}
                                className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:bg-red-500/10 rounded transition-all"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
