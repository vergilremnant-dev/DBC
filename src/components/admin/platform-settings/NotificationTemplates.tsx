import { useState } from 'react';
import SectionCard from './SectionCard';

export interface NotificationTemplate {
  id: string;
  key: 'registration' | 'verification_approved' | 'verification_rejected' | 'requirement_created' | 'quotation_submitted' | 'project_assigned';
  label: string;
  subject: string;
  body: string;
  variables: string[];
}

const TEMPLATE_LABELS: Record<NotificationTemplate['key'], { label: string; icon: string }> = {
  registration: { label: 'Registration Welcome', icon: '👋' },
  verification_approved: { label: 'Verification Approved', icon: '✅' },
  verification_rejected: { label: 'Verification Rejected', icon: '❌' },
  requirement_created: { label: 'Requirement Created', icon: '📋' },
  quotation_submitted: { label: 'Quotation Submitted', icon: '📄' },
  project_assigned: { label: 'Project Assigned', icon: '🏗️' },
};

interface TemplateEditorProps {
  template: NotificationTemplate;
  onChange: (t: NotificationTemplate) => void;
}

function TemplateEditor({ template, onChange }: TemplateEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { label, icon } = TEMPLATE_LABELS[template.key];

  const inputCls = "dbc-input text-xs";

  return (
    <div className="border border-light-border rounded-2xl overflow-hidden">
      <button
        onClick={() => setIsOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left bg-stone-50 hover:bg-stone-100 transition cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-emerald"
        aria-expanded={isOpen}
        aria-controls={`template-body-${template.id}`}
      >
        <div className="flex items-center gap-3">
          <span className="text-base" aria-hidden="true">{icon}</span>
          <div>
            <p className="text-xs font-black text-stone-800">{label}</p>
            <p className="text-[10px] text-stone-500 font-medium truncate max-w-[240px] mt-0.5">{template.subject}</p>
          </div>
        </div>
        <span className="text-stone-400 text-xs font-bold transition-transform duration-200" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</span>
      </button>

      {isOpen && (
        <div id={`template-body-${template.id}`} className="p-5 space-y-4 border-t border-light-border bg-white">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-stone-500 mb-1.5">Subject</label>
            <input
              type="text"
              value={template.subject}
              onChange={e => onChange({ ...template, subject: e.target.value })}
              className={inputCls}
              placeholder="Email subject line"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-stone-500 mb-1.5">Message Body</label>
            <textarea
              value={template.body}
              onChange={e => onChange({ ...template, body: e.target.value })}
              className={`${inputCls} resize-y min-h-[100px]`}
              placeholder="Message body content…"
              rows={5}
            />
          </div>
          {template.variables.length > 0 && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-stone-500 mb-2">Available Variables</p>
              <div className="flex flex-wrap gap-1.5">
                {template.variables.map(v => (
                  <span key={v} className="text-[9px] font-black text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded font-mono">
                    {`{{${v}}}`}
                  </span>
                ))}
              </div>
              <p className="text-[9px] text-stone-400 font-medium mt-1.5">Click a variable to copy; paste it into the subject or body.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface NotificationTemplatesProps {
  templates: NotificationTemplate[];
  onChange: (templates: NotificationTemplate[]) => void;
}

export default function NotificationTemplates({ templates, onChange }: NotificationTemplatesProps) {
  const handleChange = (updated: NotificationTemplate) => {
    onChange(templates.map(t => t.id === updated.id ? updated : t));
  };

  return (
    <SectionCard title="Notification Templates" subtitle="Edit email subject lines and message body for system notifications." icon="📨">
      {templates.length === 0 ? (
        <div className="text-center py-10 space-y-2">
          <span className="text-2xl block">📨</span>
          <p className="text-xs font-bold text-stone-500 uppercase tracking-widest">No notification templates configured.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {templates.map(t => (
            <TemplateEditor key={t.id} template={t} onChange={handleChange} />
          ))}
        </div>
      )}
    </SectionCard>
  );
}
