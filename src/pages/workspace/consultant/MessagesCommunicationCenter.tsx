import { useState, useMemo, useEffect, startTransition } from 'react';

// ==========================================
// Types & Interfaces
// ==========================================
interface Message {
  id: string;
  sender: 'CUSTOMER' | 'PRO' | 'SYSTEM';
  senderName: string;
  text: string;
  timestamp: string;
  isPinned?: boolean;
  attachment?: { name: string; size: string; type: string };
}

interface CustomerThread {
  id: string;
  name: string;
  avatar: string;
  type: 'Customer' | 'Professional' | 'Group';
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  isPinned: boolean;
  priority: 'High' | 'Medium' | 'Low';
  isOnline: boolean;
  messages: Message[];
}

const getUniqueId = (prefix: string = 'id') => `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

export default function MessagesCommunicationCenter() {
  const [isLoading, setIsLoading] = useState(true);
  const [activeConvId, setActiveConvId] = useState<string>('CONV-01');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');

  // Input composer
  const [composeText, setComposeText] = useState('');

  // Internal conversation notes (autosave)
  const [internalNotes, setInternalNotes] = useState('Client mentioned they want the final report by Monday morning.');
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  // Conversations list
  const [conversations, setConversations] = useState<CustomerThread[]>([
    {
      id: 'CONV-01',
      name: 'Ramesh Kumar (Client)',
      avatar: '👨',
      type: 'Customer',
      lastMessage: 'Vastu pillar placement check looks satisfactory. Thanks!',
      timestamp: '10 mins ago',
      unreadCount: 2,
      isPinned: true,
      priority: 'High',
      isOnline: true,
      messages: [
        { id: 'm-1', sender: 'SYSTEM', senderName: 'System', text: 'Consultation Scheduled & Blueprints Shared.', timestamp: '01-Aug &bull; 09:00 AM' },
        { id: 'm-2', sender: 'CUSTOMER', senderName: 'Ramesh Kumar', text: 'Hello John! I have uploaded the draft blueprints file for our 4BHK villa layout review.', timestamp: '01-Aug &bull; 09:15 AM', attachment: { name: 'Villa_Blueprints_v1.pdf', size: '3.4 MB', type: 'Blueprint' } },
        { id: 'm-3', sender: 'PRO', senderName: 'John Anderson', text: 'I am auditing the stairwells column load limit and matching entrance doorway directions with Vastu standards.', timestamp: '01-Aug &bull; 09:45 AM' },
        { id: 'm-4', sender: 'CUSTOMER', senderName: 'Ramesh Kumar', text: 'Vastu pillar placement check looks satisfactory. Thanks!', timestamp: '01-Aug &bull; 10:00 AM' }
      ]
    },
    {
      id: 'CONV-02',
      name: 'Sita Sharma (Client)',
      avatar: '👩',
      type: 'Customer',
      lastMessage: 'Awaiting updated cabinet layouts.',
      timestamp: '2 hours ago',
      unreadCount: 0,
      isPinned: false,
      priority: 'Medium',
      isOnline: false,
      messages: [
        { id: 'm-5', sender: 'CUSTOMER', senderName: 'Sita Sharma', text: 'Hello, looking forward to space layout verification checks.', timestamp: '30-Jul &bull; 03:00 PM' }
      ]
    },
    {
      id: 'CONV-03',
      name: 'Structural Review Group',
      avatar: '👥',
      type: 'Group',
      lastMessage: 'Alice: Base soil raft alignment is complete.',
      timestamp: '1 day ago',
      unreadCount: 0,
      isPinned: false,
      priority: 'High',
      isOnline: true,
      messages: [
        { id: 'm-6', sender: 'SYSTEM', senderName: 'System', text: 'Group Conversation Created.', timestamp: '28-Jul &bull; 10:00 AM' }
      ]
    }
  ]);

  // Selected thread
  const activeConv = useMemo(() => {
    return conversations.find(c => c.id === activeConvId) || null;
  }, [conversations, activeConvId]);

  // Shared Files list derived from active thread
  const sharedFiles = useMemo(() => {
    if (!activeConv) return [];
    return activeConv.messages
      .filter(m => m.attachment)
      .map(m => ({
        name: m.attachment!.name,
        type: m.attachment!.type,
        uploadedBy: m.senderName,
        date: m.timestamp.split('&bull;')[0].trim()
      }));
  }, [activeConv]);

  // Quick Templates
  const templates = [
    { title: 'Confirm', text: 'I have successfully reviewed your blueprints. Our report is ready.' },
    { title: 'Reminder', text: 'Friendly reminder of our upcoming video consultation session scheduled tomorrow.' },
    { title: 'Follow-up', text: 'Thank you for our consultation session! Please check recommended milestones.' }
  ];

  // Startup timer
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 700);
    return () => clearTimeout(timer);
  }, []);

  // Autosave simulator
  useEffect(() => {
    if (isLoading) return;
    startTransition(() => {
      setIsSavingNotes(true);
    });
    const timer = setTimeout(() => {
      startTransition(() => {
        setIsSavingNotes(false);
      });
    }, 500);
    return () => clearTimeout(timer);
  }, [internalNotes, isLoading]);

  // Stats calculation
  const stats = useMemo(() => {
    return {
      unread: conversations.reduce((acc, c) => acc + c.unreadCount, 0),
      active: conversations.length,
      pendingFup: conversations.filter(c => c.unreadCount > 0).length,
      groupCount: conversations.filter(c => c.type === 'Group').length,
    };
  }, [conversations]);

  // Apply filters
  const filteredConvs = useMemo(() => {
    return conversations.filter(c => {
      const q = searchQuery.toLowerCase().trim();
      const matchQuery = !q || c.name.toLowerCase().includes(q) || c.lastMessage.toLowerCase().includes(q);
      const matchType = filterType === 'ALL' || c.type === filterType;
      return matchQuery && matchType;
    });
  }, [conversations, searchQuery, filterType]);

  const handleSend = (text: string) => {
    if (!text.trim() || !activeConvId) return;
    const newMsg: Message = {
      id: getUniqueId('m'),
      sender: 'PRO',
      senderName: 'John Anderson',
      text: text.trim(),
      timestamp: 'Just now'
    };

    setConversations(prev => prev.map(c => {
      if (c.id === activeConvId) {
        return {
          ...c,
          lastMessage: newMsg.text,
          messages: [...c.messages, newMsg]
        };
      }
      return c;
    }));
    setComposeText('');
  };

  const handleMarkAllRead = () => {
    setConversations(prev => prev.map(c => ({ ...c, unreadCount: 0 })));
    alert('All conversations marked read.');
  };

  const handleAttachFile = () => {
    if (!activeConvId) return;
    const newMsg: Message = {
      id: getUniqueId('m'),
      sender: 'PRO',
      senderName: 'John Anderson',
      text: '📎 Shared document file: Soil_Inspection_Report.pdf',
      timestamp: 'Just now',
      attachment: { name: 'Soil_Inspection_Report.pdf', size: '2.1 MB', type: 'Document' }
    };

    setConversations(prev => prev.map(c => {
      if (c.id === activeConvId) {
        return {
          ...c,
          lastMessage: newMsg.text,
          messages: [...c.messages, newMsg]
        };
      }
      return c;
    }));
    alert('Mock document attached.');
  };

  if (isLoading) {
    return <SkeletonConversation />;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20 text-left animate-gentle-fade select-none">
      
      {/* 1. Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-light-border p-6 rounded-3xl shadow-apple-sm relative">
        <div className="space-y-1">
          <span className="text-[10px] font-black uppercase text-stone-500 tracking-wider">collaboration central</span>
          <h1 className="text-xl sm:text-2xl font-black text-stone-900 leading-tight">Communication Center</h1>
          <p className="text-xs text-stone-500 font-medium">Manage discussions and coordinate with clients, builders, and inspectors.</p>
        </div>

        <div className="flex gap-2 text-xs">
          <button
            onClick={handleMarkAllRead}
            className="dbc-btn dbc-btn-md dbc-btn-secondary bg-white border border-stone-200 hover:bg-stone-50"
          >
            Mark All Read
          </button>
          <button
            onClick={() => {
              const name = prompt('Enter recipient name:');
              if (name) {
                setConversations(prev => [
                  ...prev,
                  { id: getUniqueId('CONV'), name, avatar: '👤', type: 'Customer', lastMessage: 'Chat initialized.', timestamp: 'Just now', unreadCount: 0, isPinned: false, priority: 'Medium', isOnline: true, messages: [] }
                ]);
              }
            }}
            className="dbc-btn dbc-btn-md dbc-btn-primary"
          >
            New Conversation
          </button>
        </div>
      </header>

      {/* 2. KPI Summary Cards Grid */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Unread Messages', count: stats.unread, icon: '✉️', color: 'bg-emerald-50 text-emerald-800' },
          { label: 'Active Chats', count: stats.active, icon: '💬', color: 'bg-blue-50 text-blue-800' },
          { label: 'Pending customer replies', count: stats.pendingFup, icon: '⏳', color: 'bg-amber-50 text-amber-800' },
          { label: 'Groups Active', count: stats.groupCount, icon: '👥', color: 'bg-indigo-50 text-indigo-800' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white border border-light-border p-4 rounded-2xl shadow-apple-xs hover:shadow-apple-sm transition flex flex-col justify-between">
            <span className={`text-base p-2 rounded-xl w-fit ${stat.color}`}>{stat.icon}</span>
            <div className="mt-4 space-y-0.5">
              <span className="block text-2xl font-black text-stone-900">{stat.count}</span>
              <span className="block text-[9.5px] font-bold text-stone-450 uppercase tracking-wider">{stat.label}</span>
            </div>
          </div>
        ))}
      </section>

      {/* Three Column Chat Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start min-h-[600px]">
        
        {/* Left Column: Conversations List (Col span 3) */}
        <div className="lg:col-span-3 bg-white border border-light-border rounded-3xl p-4 shadow-apple-sm space-y-4 max-h-[600px] flex flex-col overflow-hidden">
          <input
            type="text"
            placeholder="Search discussions..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="dbc-input text-xs"
          />

          <div className="flex gap-1 border-b border-light-border pb-2 text-[9.5px] font-black uppercase tracking-wider">
            {['ALL', 'Customer', 'Group'].map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`flex-1 text-center py-1 rounded-lg border cursor-pointer transition ${
                  filterType === type ? 'bg-stone-black border-stone-black text-white' : 'bg-white border-stone-200 text-stone-500'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 max-h-[420px]">
            {filteredConvs.map(conv => {
              const isSelected = conv.id === activeConvId;
              return (
                <div
                  key={conv.id}
                  onClick={() => {
                    setActiveConvId(conv.id);
                    setConversations(conversations.map(c => c.id === conv.id ? { ...c, unreadCount: 0 } : c));
                  }}
                  className={`p-3 rounded-2xl cursor-pointer flex gap-2.5 items-center border transition duration-200 ${
                    isSelected ? 'bg-brand-emerald/5 border-brand-emerald/40 shadow-xs' : 'bg-white border-light-border hover:bg-stone-50'
                  }`}
                >
                  <span className="text-xl p-2 bg-stone-50 rounded-xl border border-light-border shrink-0">{conv.avatar}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-black text-stone-900 truncate">{conv.name}</h4>
                      {conv.unreadCount > 0 && (
                        <span className="bg-brand-emerald text-white text-[8px] font-black px-1.5 py-0.5 rounded-full">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-stone-500 font-semibold truncate mt-0.5">{conv.lastMessage}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Middle Column: Chat workspace thread (Col span 6) */}
        <div className="lg:col-span-6 bg-white border border-light-border rounded-3xl shadow-apple-sm max-h-[600px] flex flex-col justify-between overflow-hidden">
          {activeConv ? (
            <div className="flex flex-col justify-between h-full flex-1">
              
              {/* Thread header */}
              <div className="p-4 border-b border-light-border flex justify-between items-center bg-light-stone/10">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{activeConv.avatar}</span>
                  <div>
                    <h3 className="text-xs font-black text-stone-900 leading-none">{activeConv.name}</h3>
                    <span className="text-[8px] font-black uppercase text-brand-emerald tracking-wider">{activeConv.type} Conversation</span>
                  </div>
                </div>
                <button
                  onClick={() => alert(`Voice session coordinator initialized.`)}
                  className="dbc-btn dbc-btn-sm dbc-btn-secondary bg-white border border-stone-200 hover:bg-stone-50"
                >
                  📞 Voice Call
                </button>
              </div>

              {/* Message Feed list */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[340px] min-h-[300px]">
                {activeConv.messages.length === 0 ? (
                  <div className="text-center py-10 text-stone-450 border border-dashed border-stone-200 rounded-2xl">
                    No messages in this chat thread.
                  </div>
                ) : (
                  activeConv.messages.map(msg => {
                    const isPro = msg.sender === 'PRO';
                    const isSys = msg.sender === 'SYSTEM';

                    if (isSys) {
                      return (
                        <div key={msg.id} className="text-center">
                          <span className="inline-block bg-stone-100 border border-light-border/40 text-stone-500 text-[8.5px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                            ⚙️ {msg.text} &bull; {msg.timestamp}
                          </span>
                        </div>
                      );
                    }

                    return (
                      <div key={msg.id} className={`flex ${isPro ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs p-3 rounded-2xl text-xs leading-relaxed font-semibold shadow-apple-sm text-left ${
                          isPro ? 'bg-brand-emerald text-white rounded-tr-none' : 'bg-stone-50 text-stone-850 rounded-tl-none border border-stone-200'
                        }`}>
                          {!isPro && <span className="block text-[8px] opacity-75 font-black uppercase tracking-wider mb-1">{msg.senderName}</span>}
                          <p>{msg.text}</p>
                          {msg.attachment && (
                            <div className="mt-2 pt-2 border-t border-white/20 flex justify-between items-center text-[9px] font-bold">
                              <span>📂 {msg.attachment.name} ({msg.attachment.size})</span>
                              <button onClick={() => alert('File download placeholder.')} className="underline uppercase">Open</button>
                            </div>
                          )}
                          <span className="block text-[7.5px] opacity-70 text-right mt-1.5">{msg.timestamp}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Message Composer & Templates */}
              <div className="p-4 border-t border-light-border bg-stone-50/50 space-y-3">
                <div className="flex flex-wrap gap-1.5 text-[8.5px] font-bold text-stone-500">
                  {templates.map(tmpl => (
                    <button
                      key={tmpl.title}
                      type="button"
                      onClick={() => handleSend(tmpl.text)}
                      className="px-2.5 py-1 rounded-full border border-stone-200 bg-white hover:bg-stone-50 transition cursor-pointer"
                    >
                      {tmpl.title} template
                    </button>
                  ))}
                </div>

                <form
                  onSubmit={e => {
                    e.preventDefault();
                    handleSend(composeText);
                  }}
                  className="flex gap-2 items-center"
                >
                  <button
                    type="button"
                    onClick={handleAttachFile}
                    className="dbc-btn dbc-btn-md dbc-btn-secondary px-3.5 bg-white border border-stone-200 hover:bg-stone-50"
                  >
                    📎
                  </button>
                  <input
                    type="text"
                    placeholder="Type reply message details..."
                    value={composeText}
                    onChange={e => setComposeText(e.target.value)}
                    className="flex-1 dbc-input"
                  />
                  <button
                    type="submit"
                    className="dbc-btn dbc-btn-md dbc-btn-primary"
                  >
                    Send
                  </button>
                </form>
              </div>

            </div>
          ) : (
            <div className="flex flex-col justify-center items-center text-center p-8 space-y-2 h-[450px]">
              <span className="text-3xl">💬</span>
              <h3 className="text-xs font-black text-stone-400 uppercase tracking-widest">Select a Conversation</h3>
              <p className="text-[10px] text-stone-500 max-w-xs leading-relaxed">Pick a chat thread from left inbox directory to collaborate.</p>
            </div>
          )}
        </div>

        {/* Right Column: Shared Files, Private Notes & Smart Assistant (Col span 3) */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Shared files manager */}
          <section className="bg-white border border-light-border p-5 rounded-3xl shadow-apple-sm space-y-4">
            <h3 className="text-xs font-black uppercase text-stone-900 border-b border-light-border/40 pb-2">Shared Attachments</h3>
            {sharedFiles.length === 0 ? (
              <p className="text-[10px] text-stone-400 font-semibold italic text-center py-2">No attachments shared yet.</p>
            ) : (
              <div className="space-y-2">
                {sharedFiles.map((file, idx) => (
                  <div key={idx} className="p-2.5 bg-stone-50 border border-stone-200 rounded-xl flex justify-between items-center text-xs">
                    <div>
                      <span className="font-bold text-stone-850 block truncate max-w-[120px]">{file.name}</span>
                      <span className="block text-[8px] text-stone-400 font-bold uppercase mt-0.5">{file.uploadedBy} &bull; {file.date}</span>
                    </div>
                    <button
                      onClick={() => alert(`Downloading shared file: ${file.name}`)}
                      className="text-brand-emerald text-[8.5px] font-black uppercase hover:underline"
                    >
                      Open
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Internal Notes */}
          <section className="bg-white border border-light-border p-5 rounded-3xl shadow-apple-sm space-y-3">
            <div className="flex justify-between items-center text-[10px] text-stone-400 font-semibold">
              <span>🔒 Internal Notes (Private)</span>
              {isSavingNotes && <span className="text-brand-emerald animate-pulse">Saving...</span>}
            </div>
            <textarea
              value={internalNotes}
              onChange={e => setInternalNotes(e.target.value)}
              placeholder="Write chat logs notes here..."
              className="dbc-input h-24 resize-none"
            />
          </section>

          {/* Smart Assistant panel */}
          <section className="bg-gradient-to-br from-stone-950 to-stone-900 border border-stone-850 p-5 rounded-3xl shadow-apple-sm text-white space-y-4 relative overflow-hidden">
            <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl"></div>
            <div className="space-y-0.5">
              <span className="text-[8.5px] font-black uppercase text-emerald-400 tracking-wider">Assistant</span>
              <h3 className="text-xs font-black">AI Conversation summary</h3>
            </div>
            <ul className="space-y-2 text-[9.5px] text-stone-300 font-medium">
              <li className="flex items-start gap-2">
                <span className="text-emerald-400">✦</span>
                <span>Ramesh shared blueprints blueprints.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400">✦</span>
                <span>Recommend scheduled soil inspections.</span>
              </li>
            </ul>
          </section>

        </div>

      </div>

    </div>
  );
}

// ==========================================
// Loading Skeletons
// ==========================================
function SkeletonConversation() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 text-left animate-pulse">
      <div className="h-28 bg-white border border-light-border rounded-3xl p-6 shadow-apple-sm"></div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, idx) => (
          <div key={idx} className="h-24 bg-white border border-light-border rounded-2xl p-4"></div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-3 h-[500px] bg-white border border-light-border rounded-3xl p-4 shadow-apple-sm"></div>
        <div className="lg:col-span-6 h-[500px] bg-white border border-light-border rounded-3xl p-6 shadow-apple-sm"></div>
        <div className="lg:col-span-3 h-[500px] bg-white border border-light-border rounded-3xl p-4 shadow-apple-sm"></div>
      </div>
    </div>
  );
}
