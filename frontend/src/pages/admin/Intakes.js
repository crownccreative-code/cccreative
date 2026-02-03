import React, { useEffect, useState } from 'react';
import { FileText, Eye, Filter } from 'lucide-react';
import api from '../../api/client';
import { toast } from 'sonner';

export default function AdminIntakes() {
  const [intakes, setIntakes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [selectedIntake, setSelectedIntake] = useState(null);

  useEffect(() => {
    fetchIntakes();
  }, [typeFilter]);

  const fetchIntakes = async () => {
    try {
      const data = await api.getIntakes(typeFilter || null);
      setIntakes(data);
    } catch (error) {
      toast.error('Failed to load intakes');
    } finally {
      setLoading(false);
    }
  };

  const getTypeBadge = (type) => {
    const colors = {
      branding: 'gold',
      website: 'blue',
      marketing: 'green',
      ai: 'default'
    };
    return colors[type] || 'default';
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
          <h1 className="text-3xl font-black uppercase tracking-tight mb-2">Intake Forms</h1>
          <p className="text-slate-500 font-mono text-xs uppercase tracking-widest">Review client submissions</p>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="input-box w-40"
            data-testid="intake-type-filter"
          >
            <option value="">All Types</option>
            <option value="branding">Branding</option>
            <option value="website">Website</option>
            <option value="marketing">Marketing</option>
            <option value="ai">AI Integration</option>
          </select>
        </div>
      </div>

      {/* Intakes List */}
      {intakes.length === 0 ? (
        <div className="card p-12 text-center">
          <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold mb-2">No Intakes Found</h3>
          <p className="text-slate-500 text-sm">Intake forms will appear here when clients submit them</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {intakes.map(intake => (
            <div key={intake.id} className="card p-6" data-testid={`intake-${intake.id}`}>
              <div className="flex items-start justify-between mb-4">
                <span className={`badge badge-${getTypeBadge(intake.type)}`}>
                  {intake.type}
                </span>
                <span className="text-xs text-slate-500">
                  {new Date(intake.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className="mb-4">
                <p className="font-semibold">{intake.user_name}</p>
                <p className="text-sm text-slate-500">{intake.user_email}</p>
              </div>
              <button
                onClick={() => setSelectedIntake(intake)}
                className="btn-secondary w-full flex items-center justify-center gap-2"
                data-testid={`view-intake-${intake.id}`}
              >
                <Eye className="w-4 h-4" />
                View Details
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Intake Detail Modal */}
      {selectedIntake && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div>
                <span className={`badge badge-${getTypeBadge(selectedIntake.type)} mb-2`}>
                  {selectedIntake.type}
                </span>
                <h2 className="text-xl font-bold uppercase tracking-tight">Intake Form</h2>
              </div>
              <button onClick={() => setSelectedIntake(null)} className="text-slate-500 hover:text-white transition-colors text-2xl">
                ×
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              {/* Customer Info */}
              <div className="mb-6 p-4 bg-white/5 rounded-xl">
                <h4 className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-2">Submitted By</h4>
                <p className="font-semibold">{selectedIntake.user_name}</p>
                <p className="text-sm text-slate-400">{selectedIntake.user_email}</p>
                <p className="text-xs text-slate-500 mt-2">
                  {new Date(selectedIntake.created_at).toLocaleString()}
                </p>
              </div>

              {/* Answers */}
              <div className="space-y-6">
                {Object.entries(selectedIntake.answers || {}).map(([key, value]) => (
                  <div key={key}>
                    <h4 className="text-[10px] font-mono text-blue-400 uppercase tracking-widest mb-2">
                      {key.replace(/_/g, ' ')}
                    </h4>
                    <p className="text-sm text-slate-300 whitespace-pre-wrap bg-white/5 p-3 rounded-lg">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
