import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Plus, ArrowRight, Send } from 'lucide-react';
import api from '../../api/client';
import { toast } from 'sonner';

export default function PortalMessages() {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchThreads();
  }, []);

  const fetchThreads = async () => {
    try {
      const data = await api.getThreads();
      setThreads(data);
    } catch (error) {
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateThread = async (e) => {
    e.preventDefault();
    if (!newSubject.trim()) {
      toast.error('Please enter a subject');
      return;
    }

    setCreating(true);
    try {
      const thread = await api.createThread(newSubject);
      toast.success('Conversation started');
      setShowNew(false);
      setNewSubject('');
      setThreads([thread, ...threads]);
    } catch (error) {
      toast.error('Failed to create conversation');
    } finally {
      setCreating(false);
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
          <h1 className="text-3xl font-black uppercase tracking-tight mb-2">Messages</h1>
          <p className="text-slate-500 font-mono text-xs uppercase tracking-widest">Communicate with our team</p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="btn-primary flex items-center gap-2"
          data-testid="new-thread-btn"
        >
          <Plus className="w-4 h-4" />
          New Conversation
        </button>
      </div>

      {/* New Thread Form */}
      {showNew && (
        <div className="card p-6 mb-6">
          <form onSubmit={handleCreateThread} className="flex items-center gap-4">
            <input
              type="text"
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              className="input-box flex-1"
              placeholder="Enter conversation subject..."
              data-testid="new-thread-subject"
            />
            <button
              type="button"
              onClick={() => setShowNew(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              className="btn-primary flex items-center gap-2"
              data-testid="create-thread-btn"
            >
              {creating ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Start
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Threads List */}
      {threads.length === 0 ? (
        <div className="card p-12 text-center">
          <MessageSquare className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold mb-2">No Conversations</h3>
          <p className="text-slate-500 text-sm mb-6">Start a conversation with our team</p>
          <button onClick={() => setShowNew(true)} className="btn-gold" data-testid="empty-new-thread-btn">
            Start Conversation
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {threads.map(thread => (
            <Link
              key={thread.id}
              to={`/portal/messages/${thread.id}`}
              className="card p-6 flex items-center justify-between hover:border-blue-500/30 transition-colors"
              data-testid={`thread-${thread.id}`}
            >
              <div className="flex items-center gap-6">
                <div className="p-3 bg-green-500/10 rounded-xl">
                  <MessageSquare className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="font-bold">{thread.subject}</p>
                  <p className="text-sm text-slate-500">
                    {thread.message_count} message(s) • {new Date(thread.updated_at).toLocaleDateString()}
                  </p>
                  {thread.last_message && (
                    <p className="text-sm text-slate-400 mt-1 line-clamp-1">
                      {thread.last_message}
                    </p>
                  )}
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-600" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
