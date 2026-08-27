import { useState, useMemo, useEffect } from 'react';
import MessagesCommunicationCenter from '../consultant/MessagesCommunicationCenter';

// ==========================================
// Types & Interfaces
// ==========================================
interface ChatMessage {
  id: string;
  sender: 'PRO' | 'CUSTOMER';
  text: string;
  timestamp: string;
  attachment?: { name: string; size: string };
}

interface ChatThread {
  id: string;
  customerName: string;
  projectName: string;
  latestMessage: string;
  timestamp: string;
  unreadCount: number;
  type: 'Project' | 'Quotation' | 'General';
  isPinned: boolean;
  isArchived: boolean;
  messages: ChatMessage[];
}

export default function ProfessionalInbox() {
  const [workspaceView, setWorkspaceView] = useState<'PRO' | 'CONSULTANT'>(() => {
    return (localStorage.getItem('dbc_provider_view') as 'PRO' | 'CONSULTANT') || 'PRO';
  });

  useEffect(() => {
    const handleStorage = () => {
      setWorkspaceView((localStorage.getItem('dbc_provider_view') as 'PRO' | 'CONSULTANT') || 'PRO');
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const [isLoading, setIsLoading] = useState(true);
  const [selectedThreadId, setSelectedThreadId] = useState('th-1');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UNREAD' | 'PINNED' | 'ARCHIVED'>('ALL');

  // Composer state
  const [typedMessage, setTypedMessage] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');

  // Conversation database
  const [threads, setThreads] = useState<ChatThread[]>([
    {
      id: 'th-1',
      customerName: 'Ramesh Kumar',
      projectName: 'Jubilee Hills Duplex Foundation',
      latestMessage: 'Please review the updated column steel placement diagrams.',
      timestamp: '10 mins ago',
      unreadCount: 2,
      type: 'Project',
      isPinned: true,
      isArchived: false,
      messages: [
        { id: 'm1', sender: 'CUSTOMER', text: 'Hello, did you get a chance to look at the excavation levels report?', timestamp: '09:00 AM' },
        { id: 'm2', sender: 'PRO', text: 'Yes Ramesh, the soil load bearing limits look consistent. You can proceed with reinforcement coordinates alignment.', timestamp: '09:30 AM' },
        { id: 'm3', sender: 'CUSTOMER', text: 'Excellent. Please review the updated column steel placement diagrams.', timestamp: '10:15 AM' }
      ]
    },
    {
      id: 'th-2',
      customerName: 'Sita Sharma',
      projectName: 'Smart Home Automation Integration',
      latestMessage: 'Quotation looks acceptable. Let us schedule a site call soon.',
      timestamp: 'Yesterday',
      unreadCount: 0,
      type: 'Quotation',
      isPinned: false,
      isArchived: false,
      messages: [
        { id: 'm4', sender: 'PRO', text: 'Submitted proposal draft ref QT-802 for distribution piping coordinates.', timestamp: 'Yesterday' },
        { id: 'm5', sender: 'CUSTOMER', text: 'Quotation looks acceptable. Let us schedule a site call soon.', timestamp: 'Yesterday' }
      ]
    }
  ]);

  const templates = [
    { label: 'Site Confirmation', text: 'This is to confirm our scheduled site visit coordinates for tomorrow.' },
    { label: 'Quotation Update', text: 'I have updated our quotation breakdown details. Please check proposal status.' },
    { label: 'Request Documents', text: 'Please upload the latest CAD blueprints drawings or soil report references.' }
  ];

  const notifications = [
    { text: 'Ramesh Kumar replied in Jubilee Hills thread', time: '10 mins ago' },
    { text: 'New conversation created: Sita Sharma', time: 'Yesterday' }
  ];

  // Startup loader
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 700);
    return () => clearTimeout(timer);
  }, []);

  const activeThread = useMemo(() => {
    return threads.find(t => t.id === selectedThreadId) || null;
  }, [threads, selectedThreadId]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const content = typedMessage.trim() || selectedTemplate;
    if (!content || !activeThread) return;

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'PRO',
      text: content,
      timestamp: 'Just now'
    };

    setThreads(prev => prev.map(t => {
      if (t.id === activeThread.id) {
        return {
          ...t,
          latestMessage: content,
          messages: [...t.messages, newMsg]
        };
      }
      return t;
    }));

    setTypedMessage('');
    setSelectedTemplate('');
    alert('Message sent.');
  };

  const handleAttachFile = () => {
    if (!activeThread) return;
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'PRO',
      text: '📎 Sent structural blueprint drawing attachment.',
      timestamp: 'Just now',
      attachment: { name: 'Blueprint_Layout_Final.pdf', size: '4.8 MB' }
    };

    setThreads(prev => prev.map(t => {
      if (t.id === activeThread.id) {
        return {
          ...t,
          latestMessage: newMsg.text,
          messages: [...t.messages, newMsg]
        };
      }
      return t;
    }));
    alert('Attachment shared in conversation.');
  };

  const filteredThreads = useMemo(() => {
    return threads.filter(t => {
      const qLower = searchQuery.toLowerCase().trim();
      const matchQuery = !qLower || t.customerName.toLowerCase().includes(qLower) || t.projectName.toLowerCase().includes(qLower);
      
      if (statusFilter === 'UNREAD') return matchQuery && t.unreadCount > 0;
      if (statusFilter === 'PINNED') return matchQuery && t.isPinned;
      if (statusFilter === 'ARCHIVED') return matchQuery && t.isArchived;
      return matchQuery && !t.isArchived;
    });
  }, [threads, searchQuery, statusFilter]);

  const stats = useMemo(() => {
    return {
      unread: threads.filter(t => t.unreadCount > 0).length,
      active: threads.filter(t => !t.isArchived).length,
      project: threads.filter(t => t.type === 'Project').length,
      quote: threads.filter(t => t.type === 'Quotation').length,
    };
  }, [threads]);

  if (workspaceView === 'CONSULTANT') {
    return <MessagesCommunicationCenter />;
  }

  if (isLoading) {
    return <SkeletonMessages />;
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20 text-left animate-gentle-fade select-none">
      
      {/* 1. Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-light-border p-6 rounded-3xl shadow-apple-sm relative">
        <div className="space-y-1">
          <span className="text-[10px] font-black uppercase text-stone-500 tracking-wider font-sans">Collaboration workspace</span>
          <h1 className="text-xl sm:text-2xl font-black text-stone-900 leading-tight font-serif">Messages</h1>
          <p className="text-xs text-stone-500 font-medium">Communicate with customers regarding active quotations, milestones, and site visits.</p>
        </div>

        <div className="flex gap-2 text-xs">
          <button
            onClick={() => {
              setThreads(prev => prev.map(t => ({ ...t, unreadCount: 0 })));
              alert('All messages marked read.');
            }}
            className="dbc-btn dbc-btn-md dbc-btn-secondary bg-white border border-stone-200 hover:bg-stone-50"
          >
            Mark all read
          </button>
        </div>
      </header>

      {/* 2. Stats summary */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Unread Messages', count: stats.unread, icon: '✉️', color: 'bg-emerald-50 text-emerald-800' },
          { label: 'Active chats', count: stats.active, icon: '💬', color: 'bg-blue-50 text-blue-800' },
          { label: 'Project boards', count: stats.project, icon: '🏗️', color: 'bg-amber-50 text-amber-800' },
          { label: 'Proposal chats', count: stats.quote, icon: '📝', color: 'bg-indigo-50 text-indigo-800' }
        ].map((kpi, idx) => (
          <div key={idx} className="bg-white border border-light-border p-4 rounded-2xl shadow-apple-xs hover:shadow-apple-sm transition flex flex-col justify-between">
            <span className={`text-base p-2 rounded-xl w-fit ${kpi.color}`}>{kpi.icon}</span>
            <div className="mt-4 space-y-0.5">
              <span className="block text-2xl font-black text-stone-900">{kpi.count}</span>
              <span className="block text-[9.5px] font-bold text-stone-450 uppercase tracking-wider">{kpi.label}</span>
            </div>
          </div>
        ))}
      </section>

      {/* 3-Column messaging workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white border border-light-border rounded-3xl shadow-apple-sm overflow-hidden h-[550px] items-stretch">
        
        {/* Column 1: Conversations directory selector list (Col span 3) */}
        <div className="lg:col-span-3 border-r border-light-border flex flex-col bg-stone-50/50">
          <div className="p-4 border-b border-light-border space-y-3 bg-white">
            <input
              type="text"
              placeholder="Search chat list..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="dbc-input text-xs"
            />
            <div className="flex gap-1.5 flex-wrap text-[9px] font-black uppercase tracking-wider">
              <button onClick={() => setStatusFilter('ALL')} className={`px-2 py-0.5 rounded ${statusFilter === 'ALL' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600'}`}>
                All
              </button>
              <button onClick={() => setStatusFilter('UNREAD')} className={`px-2 py-0.5 rounded ${statusFilter === 'UNREAD' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600'}`}>
                Unread
              </button>
              <button onClick={() => setStatusFilter('PINNED')} className={`px-2 py-0.5 rounded ${statusFilter === 'PINNED' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600'}`}>
                Pinned
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
            {filteredThreads.map(t => {
              const isSelected = t.id === selectedThreadId;
              return (
                <div
                  key={t.id}
                  onClick={() => {
                    setSelectedThreadId(t.id);
                    setThreads(prev => prev.map(item => item.id === t.id ? { ...item, unreadCount: 0 } : item));
                  }}
                  className={`p-3 rounded-2xl border text-left cursor-pointer transition select-none ${
                    isSelected 
                      ? 'bg-emerald-50/30 border-brand-emerald/20 shadow-xs' 
                      : 'bg-white border-light-border hover:bg-stone-50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <strong className="text-xs text-stone-900 block truncate">{t.customerName}</strong>
                    <span className="text-[8px] text-stone-400 font-bold shrink-0">{t.timestamp}</span>
                  </div>
                  <span className="block text-[9px] text-stone-450 font-medium truncate mt-0.5">{t.projectName}</span>
                  <p className="text-[10px] text-stone-600 truncate font-semibold mt-1.5">{t.latestMessage}</p>
                  
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-light-border/40">
                    <span className="text-[8px] font-black uppercase bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded">
                      {t.type}
                    </span>
                    {t.unreadCount > 0 && (
                      <span className="w-4 h-4 bg-brand-emerald text-white rounded-full flex items-center justify-center text-[8.5px] font-black">
                        {t.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Column 2: Message view workspace bubble stream (Col span 6) */}
        <div className="lg:col-span-6 flex flex-col bg-white">
          {activeThread ? (
            <>
              {/* Active Conversation header */}
              <div className="p-4 border-b border-light-border bg-stone-50/30">
                <h4 className="text-xs font-black text-stone-900 leading-none">{activeThread.customerName}</h4>
                <span className="text-[10px] text-stone-450 font-bold mt-1 block">Project context: {activeThread.projectName}</span>
              </div>

              {/* Bubbles log stream */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {activeThread.messages.map(msg => {
                  const isPro = msg.sender === 'PRO';
                  return (
                    <div key={msg.id} className={`flex ${isPro ? 'justify-end' : 'justify-start'}`}>
                      <div className={`p-3 rounded-2xl max-w-sm text-xs font-semibold leading-relaxed ${
                        isPro ? 'bg-brand-emerald text-white' : 'bg-stone-50 border border-stone-200 text-stone-800'
                      }`}>
                        <p>{msg.text}</p>
                        {msg.attachment && (
                          <div className="mt-2 p-2 bg-stone-900/10 rounded-xl flex justify-between items-center gap-2 text-[10px]">
                            <span>📁 {msg.attachment.name} ({msg.attachment.size})</span>
                            <button onClick={() => alert('Downloading attachments...')} className="underline font-black">Open</button>
                          </div>
                        )}
                        <span className="block text-[8px] opacity-60 text-right mt-1 font-bold">{msg.timestamp}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Composer */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-light-border space-y-3">
                {/* Template selector dropdown */}
                <div className="flex gap-2 items-center">
                  <span className="text-[8px] font-black uppercase text-stone-400">Quick Templates:</span>
                  <select
                    value={selectedTemplate}
                    onChange={e => {
                      setSelectedTemplate(e.target.value);
                      setTypedMessage(e.target.value);
                    }}
                    className="dbc-input text-[9.5px] bg-white py-0.5 px-2 w-auto"
                  >
                    <option value="">Select a template...</option>
                    {templates.map((t, idx) => (
                      <option key={idx} value={t.text}>{t.label}</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Type a communication update..."
                    value={typedMessage}
                    onChange={e => setTypedMessage(e.target.value)}
                    className="flex-1 dbc-input text-xs"
                  />
                  <button type="button" onClick={handleAttachFile} className="dbc-btn dbc-btn-md dbc-btn-secondary p-2 bg-white border border-stone-200 hover:bg-stone-50">
                    📎
                  </button>
                  <button type="submit" className="dbc-btn dbc-btn-md dbc-btn-primary">
                    Send
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-stone-400 text-xs">
              Select a conversation from the directory.
            </div>
          )}
        </div>

        {/* Column 3: Attachments, quick actions sidebar, updates list (Col span 3) */}
        <div className="lg:col-span-3 border-l border-light-border bg-stone-50/50 p-4 space-y-6 flex flex-col justify-between">
          
          <div className="space-y-6">
            {/* Customer notification feed */}
            <div className="space-y-3">
              <span className="block text-[8px] font-black uppercase text-stone-400 tracking-wider">Latest Notifications</span>
              <div className="space-y-2">
                {notifications.map((n, idx) => (
                  <div key={idx} className="p-2 bg-white border border-stone-200 rounded-xl text-[10px] text-stone-600 font-semibold leading-tight">
                    <p>{n.text}</p>
                    <span className="text-[7.5px] text-stone-400 font-bold block mt-0.5">{n.time}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions links */}
            <div className="space-y-2">
              <span className="block text-[8px] font-black uppercase text-stone-400 tracking-wider font-sans">Context shortcuts</span>
              <button onClick={() => alert('Redirecting to project drawings...')} className="w-full text-left p-2.5 bg-white border border-stone-200 hover:bg-stone-50 transition rounded-xl text-[10px] font-bold text-stone-750 flex items-center gap-2">
                🏗️ Open Project files
              </button>
              <button onClick={() => alert('Opening quotation proposal editor...')} className="w-full text-left p-2.5 bg-white border border-stone-200 hover:bg-stone-50 transition rounded-xl text-[10px] font-bold text-stone-750 flex items-center gap-2">
                📝 View Quotation draft
              </button>
            </div>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-[9px] font-medium text-amber-800 leading-normal">
            🛡️ Privacy guidelines: Real-time socket links are offline; message logs are saved locally inside active project directory drafts.
          </div>

        </div>

      </div>

    </div>
  );
}

// ==========================================
// Loading Skeletons
// ==========================================
function SkeletonMessages() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 text-left animate-pulse">
      <div className="h-28 bg-white border border-light-border rounded-3xl p-6 shadow-apple-sm"></div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, idx) => (
          <div key={idx} className="h-24 bg-white border border-light-border rounded-2xl p-4"></div>
        ))}
      </div>

      <div className="h-96 bg-white border border-light-border rounded-3xl p-6 shadow-apple-sm"></div>
    </div>
  );
}
