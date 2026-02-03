import React, { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Package, Save, X } from 'lucide-react';
import api from '../../api/client';
import { toast } from 'sonner';

export default function AdminServices() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    base_price: '',
    category: '',
    deliverables_text: '',
    active: true
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const data = await api.getServices();
      setServices(data);
    } catch (error) {
      toast.error('Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (service) => {
    setEditingId(service.id);
    setFormData({
      name: service.name,
      description: service.description,
      base_price: service.base_price.toString(),
      category: service.category,
      deliverables_text: service.deliverables_text || '',
      active: service.active
    });
    setShowNew(false);
  };

  const handleNew = () => {
    setEditingId(null);
    setFormData({
      name: '',
      description: '',
      base_price: '',
      category: '',
      deliverables_text: '',
      active: true
    });
    setShowNew(true);
  };

  const handleCancel = () => {
    setEditingId(null);
    setShowNew(false);
    setFormData({ name: '', description: '', base_price: '', category: '', deliverables_text: '', active: true });
  };

  const handleSave = async () => {
    if (!formData.name || !formData.description || !formData.base_price || !formData.category) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      const data = {
        ...formData,
        base_price: parseFloat(formData.base_price)
      };

      if (editingId) {
        await api.updateService(editingId, data);
        toast.success('Service updated');
      } else {
        await api.createService(data);
        toast.success('Service created');
      }

      handleCancel();
      fetchServices();
    } catch (error) {
      toast.error(error.message || 'Failed to save service');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this service?')) return;

    try {
      await api.deleteService(id);
      toast.success('Service deleted');
      fetchServices();
    } catch (error) {
      toast.error('Failed to delete service');
    }
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
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight mb-2">Services</h1>
          <p className="text-slate-500 font-mono text-xs uppercase tracking-widest">Manage your service offerings</p>
        </div>
        <button
          onClick={handleNew}
          className="btn-primary flex items-center gap-2"
          data-testid="new-service-btn"
        >
          <Plus className="w-4 h-4" />
          Add Service
        </button>
      </div>

      {/* New/Edit Form */}
      {(showNew || editingId) && (
        <div className="card p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold uppercase tracking-tight">
              {editingId ? 'Edit Service' : 'New Service'}
            </h3>
            <button onClick={handleCancel} className="text-slate-500 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-2">Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input-box"
                placeholder="Service name"
                data-testid="service-name-input"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-2">Category *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="input-box"
                data-testid="service-category-select"
              >
                <option value="">Select category</option>
                <option value="web_design">Web Design</option>
                <option value="branding">Branding</option>
                <option value="marketing">Marketing</option>
                <option value="ai">AI Integration</option>
                <option value="automation">Automation</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-2">Base Price *</label>
              <input
                type="number"
                value={formData.base_price}
                onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
                className="input-box"
                placeholder="0.00"
                step="0.01"
                data-testid="service-price-input"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-2">Active</label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="w-4 h-4 rounded border-white/10 bg-white/5"
                />
                <span className="text-sm">Service is active</span>
              </label>
            </div>
            <div className="md:col-span-2">
              <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-2">Description *</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input-box min-h-[100px] resize-none"
                placeholder="Service description"
                data-testid="service-description-input"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-2">Deliverables</label>
              <textarea
                value={formData.deliverables_text}
                onChange={(e) => setFormData({ ...formData, deliverables_text: e.target.value })}
                className="input-box min-h-[80px] resize-none"
                placeholder="List of deliverables"
                data-testid="service-deliverables-input"
              />
            </div>
          </div>
          <div className="flex justify-end gap-4 mt-6">
            <button onClick={handleCancel} className="btn-secondary">Cancel</button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary flex items-center gap-2"
              data-testid="save-service-btn"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Service
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Services Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Service</th>
                <th>Category</th>
                <th>Price</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {services.map(service => (
                <tr key={service.id} data-testid={`service-row-${service.id}`}>
                  <td>
                    <div>
                      <p className="font-semibold">{service.name}</p>
                      <p className="text-xs text-slate-500 line-clamp-1">{service.description}</p>
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-default">{service.category?.replace('_', ' ')}</span>
                  </td>
                  <td>
                    <span className="font-bold">${service.base_price?.toFixed(2)}</span>
                  </td>
                  <td>
                    <span className={`badge badge-${service.active ? 'green' : 'red'}`}>
                      {service.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(service)}
                        className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                        data-testid={`edit-service-${service.id}`}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(service.id)}
                        className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        data-testid={`delete-service-${service.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
