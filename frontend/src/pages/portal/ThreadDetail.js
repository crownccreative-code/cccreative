import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Send, User } from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';

export default function PortalThreadDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [thread, setThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, [id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchData = async () => {
    try {
      const [threadData, messagesData] = await Promise.all([
        api.getThread(id),
        api.getMessages(id)
      ]);
      setThread(threadData);
      setMessages(messagesData);
    } catch (error) {
      toast.error('Failed to load conversation');
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      const message = await api.sendMessage(id, newMessage.trim());
      setMessages([...messages, message]);
      setNewMessage('');
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
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
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="p-6 border-b border-white/5 bg-[#050505]">
        <Link to="/portal/messages" className="flex items-center gap-2 text-slate-500 hover:text-white text-sm mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Messages
        </Link>
        <h1 className="text-xl font-black uppercase tracking-tight">{thread?.subject}</h1>
        <p className="text-xs text-slate-500 font-mono">
          Started {new Date(thread?.created_at).toLocaleDateString()}
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-500">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map(message => {
            const isOwn = message.sender_id === user?.id;
            return (
              <div
                key={message.id}
                className={`flex gap-4 ${isOwn ? 'flex-row-reverse' : ''}`}
                data-testid={`message-${message.id}`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.sender_role === 'admin' ? 'bg-blue-500/20' : 'bg-white/10'
                }`}>
                  <User className={`w-5 h-5 ${message.sender_role === 'admin' ? 'text-blue-400' : 'text-slate-400'}`} />
                </div>
                <div className={`max-w-[70%] ${isOwn ? 'text-right' : ''}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold">{message.sender_name}</span>
                    {message.sender_role === 'admin' && (
                      <span className="badge badge-blue">Admin</span>
                    )}
                    <span className="text-xs text-slate-600">
                      {new Date(message.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className={`p-4 rounded-2xl ${
                    isOwn 
                      ? 'bg-blue-600 text-white rounded-br-sm' 
                      : 'bg-white/5 text-white rounded-bl-sm'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{message.body}</p>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-6 border-t border-white/5 bg-[#050505]">
        <form onSubmit={handleSend} className="flex items-center gap-4">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="input-box flex-1"
            placeholder="Type your message..."
            data-testid="message-input"
          />
          <button
            type="submit"
            disabled={sending || !newMessage.trim()}
            className="btn-primary flex items-center gap-2 disabled:opacity-50"
            data-testid="send-message-btn"
          >
            {sending ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
