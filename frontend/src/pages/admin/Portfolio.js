import React, { useEffect, useState, useCallback } from 'react';
import { Upload, Image, Video, Trash2, GripVertical, Plus } from 'lucide-react';
import api from '../../api/client';
import { toast } from 'sonner';

export default function AdminPortfolio() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    fetchPortfolio();
  }, []);

  const fetchPortfolio = async () => {
    try {
      const data = await api.getPortfolio();
      setItems(data);
    } catch (error) {
      toast.error('Failed to load portfolio');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = useCallback(async (files) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (const file of files) {
        const isVideo = file.type.startsWith('video/');
        const resourceType = isVideo ? 'video' : 'image';

        // Get signature
        const sig = await api.getUploadSignature(resourceType, 'portfolio/');

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

        // Register in backend
        await api.addPortfolioItem({
          title: file.name.split('.')[0],
          url: result.secure_url,
          public_id: result.public_id,
          mime_type: file.type,
          size: result.bytes,
          order_index: items.length
        });

        toast.success(`${file.name} uploaded`);
      }

      fetchPortfolio();
    } catch (error) {
      toast.error(error.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }, [items.length]);

  const handleDelete = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;

    try {
      await api.deletePortfolioItem(itemId);
      toast.success('Item deleted');
      setItems(items.filter(i => i.id !== itemId));
    } catch (error) {
      toast.error('Failed to delete item');
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
        <h1 className="text-3xl font-black uppercase tracking-tight mb-2">Portfolio</h1>
        <p className="text-slate-500 font-mono text-xs uppercase tracking-widest">Manage your design showcase</p>
      </div>

      {/* Upload Zone */}
      <div
        className={`card p-12 mb-8 border-dashed border-2 transition-colors ${
          dragActive ? 'border-[#D4AF37] bg-yellow-500/5' : 'border-white/10'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="text-center">
          {uploading ? (
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 border-4 border-[#D4AF37]/20 border-t-[#D4AF37] rounded-full animate-spin mb-4" />
              <p className="text-slate-400">Uploading to portfolio...</p>
            </div>
          ) : (
            <>
              <div className="w-20 h-20 mx-auto mb-6 bg-yellow-500/10 rounded-2xl flex items-center justify-center">
                <Upload className="w-10 h-10 text-[#D4AF37]" />
              </div>
              <h3 className="text-xl font-bold mb-2">Drop images or videos here</h3>
              <p className="text-slate-500 mb-6">Upload your best work to showcase in the portfolio</p>
              <label className="btn-gold cursor-pointer inline-flex items-center gap-2" data-testid="portfolio-upload-btn">
                <Plus className="w-4 h-4" />
                Choose Files
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => handleUpload(Array.from(e.target.files))}
                  accept="image/*,video/*"
                  data-testid="portfolio-file-input"
                />
              </label>
              <p className="text-xs text-slate-600 mt-4">Supports images and videos</p>
            </>
          )}
        </div>
      </div>

      {/* Portfolio Grid */}
      {items.length === 0 ? (
        <div className="card p-12 text-center">
          <Image className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold mb-2">Portfolio Empty</h3>
          <p className="text-slate-500 text-sm">Upload your first portfolio item above</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((item, idx) => (
            <div
              key={item.id}
              className="relative"
              data-testid={`portfolio-item-${item.id}`}
            >
              {/* Delete Button - Positioned outside card overflow */}
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                className="absolute -top-2 -right-2 p-2 bg-red-600 hover:bg-red-500 rounded-full text-white transition-all shadow-xl hover:scale-110 border-2 border-[#0A0A0A]"
                style={{ zIndex: 30 }}
                data-testid={`delete-portfolio-${item.id}`}
                title="Delete item"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <div className="card group aspect-square overflow-hidden">
                {item.mime_type?.startsWith('video/') ? (
                  <video
                    src={item.url}
                    className="w-full h-full object-cover"
                    muted
                    loop
                    onMouseEnter={(e) => e.target.play()}
                    onMouseLeave={(e) => { e.target.pause(); e.target.currentTime = 0; }}
                  />
                ) : (
                  <img
                    src={item.url}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    style={{ transitionDuration: '500ms' }}
                  />
                )}

                {/* Type Badge */}
                <div className="absolute top-3 left-3" style={{ zIndex: 10 }}>
                  {item.mime_type?.startsWith('video/') ? (
                    <span className="badge badge-default">
                      <Video className="w-3 h-3 mr-1" /> Video
                    </span>
                  ) : (
                    <span className="badge badge-default">
                      <Image className="w-3 h-3 mr-1" /> Image
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                  <p className="text-sm font-semibold truncate">{item.title}</p>
                  <p className="text-xs text-slate-400">{formatSize(item.size)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
