import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Send } from 'lucide-react';
import api from '../../api/client';
import { toast } from 'sonner';

const INTAKE_TYPES = [
  { id: 'branding', label: 'Branding', description: 'Logo, brand identity, guidelines' },
  { id: 'website', label: 'Website', description: 'Web design, development, landing pages' },
  { id: 'marketing', label: 'Marketing', description: 'SEO, digital marketing, social media' },
  { id: 'ai', label: 'AI Integration', description: 'AI tools, automation, chatbots' }
];

const QUESTIONS = {
  branding: [
    { id: 'business_name', label: 'What is your business name?', type: 'text' },
    { id: 'industry', label: 'What industry are you in?', type: 'text' },
    { id: 'target_audience', label: 'Describe your target audience', type: 'textarea' },
    { id: 'brand_personality', label: 'What personality should your brand convey?', type: 'textarea' },
    { id: 'competitors', label: 'Who are your main competitors?', type: 'textarea' },
    { id: 'colors', label: 'Any color preferences?', type: 'text' },
    { id: 'inspiration', label: 'Share any brands or designs you admire', type: 'textarea' }
  ],
  website: [
    { id: 'current_website', label: 'Do you have a current website? (URL)', type: 'text' },
    { id: 'goals', label: 'What are the main goals for your website?', type: 'textarea' },
    { id: 'pages', label: 'What pages do you need?', type: 'textarea' },
    { id: 'features', label: 'Any specific features needed?', type: 'textarea' },
    { id: 'content', label: 'Do you have content ready (text, images)?', type: 'text' },
    { id: 'timeline', label: 'What is your ideal timeline?', type: 'text' },
    { id: 'inspiration', label: 'Share websites you like', type: 'textarea' }
  ],
  marketing: [
    { id: 'current_efforts', label: 'What marketing are you currently doing?', type: 'textarea' },
    { id: 'goals', label: 'What are your marketing goals?', type: 'textarea' },
    { id: 'target_platforms', label: 'Which platforms do you want to focus on?', type: 'text' },
    { id: 'budget', label: 'What is your monthly marketing budget?', type: 'text' },
    { id: 'competitors', label: 'Who are your competitors?', type: 'textarea' },
    { id: 'unique_value', label: 'What makes you different from competitors?', type: 'textarea' }
  ],
  ai: [
    { id: 'current_tools', label: 'What tools/apps do you currently use?', type: 'textarea' },
    { id: 'pain_points', label: 'What repetitive tasks take up your time?', type: 'textarea' },
    { id: 'automation_goals', label: 'What would you like to automate?', type: 'textarea' },
    { id: 'team_size', label: 'How many people are on your team?', type: 'text' },
    { id: 'budget', label: 'What is your budget for AI/automation tools?', type: 'text' },
    { id: 'experience', label: 'Have you used AI tools before?', type: 'text' }
  ]
};

export default function PortalIntake() {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleAnswer = (questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedType) {
      toast.error('Please select a form type');
      return;
    }

    const questions = QUESTIONS[selectedType];
    const requiredAnswers = questions.filter(q => !answers[q.id] || answers[q.id].trim() === '');
    if (requiredAnswers.length > 0) {
      toast.error('Please fill in all fields');
      return;
    }

    setSubmitting(true);
    try {
      await api.createIntake({
        type: selectedType,
        answers
      });
      toast.success('Intake form submitted successfully!');
      navigate('/portal');
    } catch (error) {
      toast.error(error.message || 'Failed to submit form');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black uppercase tracking-tight mb-2">Intake Form</h1>
        <p className="text-slate-500 font-mono text-xs uppercase tracking-widest">Help us understand your project</p>
      </div>

      {/* Type Selection */}
      {!selectedType ? (
        <div className="card p-8">
          <h2 className="text-lg font-bold uppercase tracking-tight mb-6">Select Form Type</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {INTAKE_TYPES.map(type => (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className="p-6 bg-white/5 border border-white/10 rounded-xl text-left hover:border-blue-500/30 hover:bg-blue-500/5 transition-colors"
                data-testid={`intake-type-${type.id}`}
              >
                <h3 className="text-lg font-bold mb-2">{type.label}</h3>
                <p className="text-sm text-slate-500">{type.description}</p>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="card">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div>
                <span className="badge badge-blue mb-2">
                  {INTAKE_TYPES.find(t => t.id === selectedType)?.label}
                </span>
                <h2 className="text-lg font-bold uppercase tracking-tight">Project Details</h2>
              </div>
              <button
                type="button"
                onClick={() => { setSelectedType(null); setAnswers({}); }}
                className="text-sm text-slate-500 hover:text-white transition-colors"
              >
                Change Type
              </button>
            </div>

            <div className="p-8 space-y-8">
              {QUESTIONS[selectedType].map((question, idx) => (
                <div key={question.id} className="group">
                  <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-3">
                    {String(idx + 1).padStart(2, '0')}. {question.label}
                  </label>
                  {question.type === 'textarea' ? (
                    <textarea
                      value={answers[question.id] || ''}
                      onChange={(e) => handleAnswer(question.id, e.target.value)}
                      className="input-underline min-h-[100px] resize-none"
                      placeholder="Type your answer..."
                      data-testid={`intake-${question.id}`}
                    />
                  ) : (
                    <input
                      type="text"
                      value={answers[question.id] || ''}
                      onChange={(e) => handleAnswer(question.id, e.target.value)}
                      className="input-underline"
                      placeholder="Type your answer..."
                      data-testid={`intake-${question.id}`}
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="p-6 border-t border-white/5">
              <button
                type="submit"
                disabled={submitting}
                className="btn-gold w-full flex items-center justify-center gap-3 py-4"
                data-testid="submit-intake-btn"
              >
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Submit Intake Form
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
