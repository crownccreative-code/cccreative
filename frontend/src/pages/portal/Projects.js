import React, { useEffect, useState } from 'react';
import { FolderKanban, CheckCircle, Clock, Pause, Package } from 'lucide-react';
import api from '../../api/client';
import { toast } from 'sonner';

export default function PortalProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const data = await api.getProjects();
      setProjects(data);
    } catch (error) {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <Clock className="w-5 h-5 text-blue-400" />;
      case 'delivered': return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'paused': return <Pause className="w-5 h-5 text-yellow-400" />;
      default: return <Package className="w-5 h-5 text-slate-400" />;
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      not_started: 'default',
      active: 'blue',
      paused: 'yellow',
      delivered: 'green'
    };
    return badges[status] || 'default';
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
        <h1 className="text-3xl font-black uppercase tracking-tight mb-2">Projects</h1>
        <p className="text-slate-500 font-mono text-xs uppercase tracking-widest">Track your project progress</p>
      </div>

      {/* Projects List */}
      {projects.length === 0 ? (
        <div className="card p-12 text-center">
          <FolderKanban className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold mb-2">No Projects Yet</h3>
          <p className="text-slate-500 text-sm">Projects are created automatically after payment</p>
        </div>
      ) : (
        <div className="space-y-6">
          {projects.map(project => (
            <div key={project.id} className="card p-6" data-testid={`project-${project.id}`}>
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-white/5 rounded-xl">
                    {getStatusIcon(project.status)}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">{project.title}</h3>
                    <p className="text-sm text-slate-500">Order #{project.order_id?.slice(-6)}</p>
                  </div>
                </div>
                <span className={`badge badge-${getStatusBadge(project.status)}`}>
                  {project.status?.replace('_', ' ')}
                </span>
              </div>

              {/* Timeline */}
              {project.timeline && project.timeline.length > 0 && (
                <div className="border-t border-white/5 pt-6">
                  <h4 className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-4">Project Timeline</h4>
                  <div className="space-y-4">
                    {project.timeline.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-4">
                        <div className={`w-3 h-3 rounded-full ${
                          item.status === 'completed' ? 'bg-green-500' :
                          item.status === 'in_progress' ? 'bg-blue-500' :
                          'bg-slate-600'
                        }`}></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{item.milestone}</p>
                          {item.due_date && (
                            <p className="text-xs text-slate-500">Due: {item.due_date}</p>
                          )}
                        </div>
                        <span className={`badge badge-${
                          item.status === 'completed' ? 'green' :
                          item.status === 'in_progress' ? 'blue' :
                          'default'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty Timeline */}
              {(!project.timeline || project.timeline.length === 0) && (
                <div className="border-t border-white/5 pt-6">
                  <p className="text-sm text-slate-500 text-center py-4">
                    Timeline will be updated once the project begins
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
