import { useState, useMemo } from 'react';
import { useAuth } from '../../hooks/auth/useAuth';
import ProfessionalInbox from './professional/ProfessionalInbox';

interface Message {
  id: string;
  sender: 'CUSTOMER' | 'PRO';
  text: string;
  timestamp: string;
  attachment?: { name: string; url: string };
}

interface ChatThread {
  id: string;
  proName: string;
  proRole: string;
  proRating: number;
  avatar: string;
  lastMessage: string;
  unread: boolean;
  messages: Message[];
}

const INITIAL_CHATS: ChatThread[] = [
  {
    id: 'ch-1',
    proName: 'Alice Architect',
    proRole: 'Principal Architect',
    proRating: 4.9,
    avatar: '📐',
    lastMessage: 'I have finalized the layout drawing for the villa elevation check.',
    unread: true,
    messages: [
      { id: 'm-1', sender: 'PRO', text: 'Hello! I am reviewing the structural plan coordinates.', timestamp: '10:15 AM' },
      { id: 'm-2', sender: 'CUSTOMER', text: 'Great. Can we adjust the spacing in the kitchen annex?', timestamp: '10:30 AM' },
      { id: 'm-3', sender: 'PRO', text: 'Sure. I have finalized the layout drawing for the villa elevation check.', timestamp: '11:00 AM' },
    ],
  },
  {
    id: 'ch-2',
    proName: 'Bob Builder',
    proRole: 'Plumbing Specialist',
    proRating: 4.7,
    avatar: '🔧',
    lastMessage: 'The piping draft is approved. Scheduled to start next Monday.',
    unread: false,
    messages: [
      { id: 'm-4', sender: 'PRO', text: 'Checked the site drainage parameters. Everything matches standard tolerances.', timestamp: 'Yesterday' },
      { id: 'm-5', sender: 'CUSTOMER', text: 'Excellent, let us schedule the masonry bookings.', timestamp: 'Yesterday' },
      { id: 'm-6', sender: 'PRO', text: 'The piping draft is approved. Scheduled to start next Monday.', timestamp: 'Yesterday' },
    ],
  },
];

function CustomerInbox() {
  // Active Chats state
  const [chats, setChats] = useState<ChatThread[]>(INITIAL_CHATS);
  const [selectedChatId, setSelectedChatId] = useState<string>('ch-1');
  const [activeSubTab, setActiveSubTab] = useState<'chats' | 'pros'>('chats');
  
  // Message Inputs
  const [messageText, setMessageText] = useState('');
  const [searchVal, setSearchVal] = useState('');

  // Selected chat details resolver
  const activeChat = useMemo(() => {
    return chats.find((c) => c.id === selectedChatId) || null;
  }, [chats, selectedChatId]);

  // Handle send message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !activeChat) return;

    const newMsg: Message = {
      id: `msg_${Date.now()}`,
      sender: 'CUSTOMER',
      text: messageText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChats((prev) =>
      prev.map((c) =>
        c.id === activeChat.id
          ? {
              ...c,
              lastMessage: newMsg.text,
              unread: false,
              messages: [...c.messages, newMsg],
            }
          : c
      )
    );
    setMessageText('');
  };

  // Mock upload attachment trigger
  const handleAttachFile = () => {
    if (!activeChat) return;
    const fileMsg: Message = {
      id: `msg_file_${Date.now()}`,
      sender: 'CUSTOMER',
      text: '📎 Sent attachment: ElevationDraftLayout.pdf',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      attachment: { name: 'ElevationDraftLayout.pdf', url: '#' },
    };

    setChats((prev) =>
      prev.map((c) =>
        c.id === activeChat.id
          ? {
              ...c,
              lastMessage: fileMsg.text,
              messages: [...c.messages, fileMsg],
            }
          : c
      )
    );
  };

  // Filtered chats based on search
  const filteredChats = chats.filter(
    (c) =>
      c.proName.toLowerCase().includes(searchVal.toLowerCase()) ||
      c.lastMessage.toLowerCase().includes(searchVal.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto text-left relative animate-gentle-fade">
      
      {/* Page Header */}
      <div className="border-b border-light-border pb-5 space-y-1">
        <h2 className="text-xl font-bold text-stone-900 font-serif">Message Center</h2>
        <p className="text-xs text-stone-500 font-medium">Communicate directly with trade specialists, builders, and blueprint consultants.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-white border border-light-border rounded-3xl shadow-apple-sm overflow-hidden min-h-[500px]">
        
        {/* Left sidebar: Directory navigation (Col span 4) */}
        <div className="md:col-span-4 border-r border-light-border flex flex-col bg-light-stone/10">
          
          {/* Sub tabs: Chats vs Professionals List */}
          <div className="flex border-b border-light-border p-1.5 bg-white">
            <button
              onClick={() => setActiveSubTab('chats')}
              className={`flex-1 text-center py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition cursor-pointer
                ${activeSubTab === 'chats' ? 'bg-light-stone text-stone-black shadow-xs' : 'text-stone-gray'}
              `}
            >
              Active Chats
            </button>
            <button
              onClick={() => setActiveSubTab('pros')}
              className={`flex-1 text-center py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition cursor-pointer
                ${activeSubTab === 'pros' ? 'bg-light-stone text-stone-black shadow-xs' : 'text-stone-gray'}
              `}
            >
              Connected Pros
            </button>
          </div>

          {/* Search bar */}
          <div className="p-3 border-b border-light-border bg-white">
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              className="w-full text-xs bg-light-stone/40 border border-light-border rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-emerald"
            />
          </div>

          {/* Chats / Pros listing */}
          <div className="flex-1 overflow-y-auto p-2.5 space-y-2 max-h-[360px]">
            {activeSubTab === 'chats' ? (
              filteredChats.map((c) => {
                const isSelected = c.id === selectedChatId;
                return (
                  <div
                    key={c.id}
                    onClick={() => {
                      setSelectedChatId(c.id);
                      setChats(chats.map(chat => chat.id === c.id ? { ...chat, unread: false } : chat));
                    }}
                    className={`p-3 rounded-2xl cursor-pointer flex gap-3 items-center border transition-all duration-200
                      ${isSelected 
                        ? 'bg-brand-emerald/5 border-brand-emerald/30 shadow-xs' 
                        : 'bg-white border-light-border hover:bg-light-stone/30'
                      }
                    `}
                  >
                    <span className="text-lg p-2 bg-white rounded-xl border border-light-border shadow-xs">{c.avatar}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between items-center">
                        <h4 className="text-xs font-black text-stone-black truncate">{c.proName}</h4>
                        {c.unread && <span className="w-1.5 h-1.5 rounded-full bg-brand-emerald"></span>}
                      </div>
                      <p className="text-[10px] text-stone-gray font-semibold truncate mt-0.5">{c.lastMessage}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              chats.map((c) => (
                <div
                  key={c.id}
                  onClick={() => {
                    setSelectedChatId(c.id);
                    setActiveSubTab('chats');
                  }}
                  className="p-3 bg-white border border-light-border rounded-2xl flex items-center justify-between hover:bg-light-stone/30 cursor-pointer transition"
                >
                  <div className="flex gap-3 items-center">
                    <span className="text-lg">{c.avatar}</span>
                    <div>
                      <h4 className="text-xs font-black text-stone-black">{c.proName}</h4>
                      <span className="text-[8px] font-black uppercase text-stone-gray tracking-wider">{c.proRole}</span>
                    </div>
                  </div>
                  <span className="text-[8px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">⭐ {c.proRating}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right side: Message details thread contents (Col span 8) */}
        <div className="md:col-span-8 flex flex-col justify-between bg-white h-full min-h-[450px]">
          {activeChat ? (
            <div className="flex flex-col justify-between h-full flex-1">
              
              {/* Active chat header info */}
              <div className="p-4 border-b border-light-border flex justify-between items-center bg-light-stone/10">
                <div>
                  <h3 className="text-xs font-black text-stone-black leading-tight">{activeChat.proName}</h3>
                  <span className="text-[8px] font-black uppercase text-brand-emerald tracking-wider">{activeChat.proRole}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => alert(`Calling ${activeChat.proName} via secure voice coordinator.`)}
                    className="dbc-btn dbc-btn-sm dbc-btn-secondary"
                  >
                    📞 Call
                  </button>
                </div>
              </div>

              {/* Message scroll list feed */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[300px]">
                {activeChat.messages.map((m) => {
                  const isCustomer = m.sender === 'CUSTOMER';
                  return (
                    <div key={m.id} className={`flex ${isCustomer ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs p-3 rounded-2xl text-xs leading-relaxed font-semibold shadow-apple-sm text-left
                        ${isCustomer 
                          ? 'bg-brand-emerald text-white rounded-tr-none' 
                          : 'bg-light-stone text-stone-black rounded-tl-none border border-light-border'
                        }
                      `}>
                        <p>{m.text}</p>
                        
                        {/* Download attachment */}
                        {m.attachment && (
                          <div className="mt-2 pt-2 border-t border-white/20 flex justify-between items-center text-[9px]">
                            <span>{m.attachment.name}</span>
                            <a href={m.attachment.url} className="underline font-black">Download</a>
                          </div>
                        )}

                        <span className="block text-[7.5px] opacity-75 mt-1 text-right">{m.timestamp}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Message Input form */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-light-border flex gap-2.5 items-center">
                <button
                  type="button"
                  onClick={handleAttachFile}
                  className="p-2.5 border border-light-border rounded-full hover:bg-light-stone text-xs transition cursor-pointer"
                  title="Attach blueprints/images"
                >
                  📎
                </button>
                <input
                  type="text"
                  placeholder="Type message details..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="flex-1 dbc-input text-xs placeholder:text-stone-400 rounded-full"
                />
                <button
                  type="submit"
                  className="dbc-btn dbc-btn-md dbc-btn-primary rounded-full"
                >
                  Send
                </button>
              </form>

            </div>
          ) : (
            <div className="flex flex-col justify-center items-center text-center p-8 space-y-2 h-full">
              <span className="text-3xl">💬</span>
              <h3 className="text-xs font-bold text-stone-black uppercase tracking-widest">Select a Conversation</h3>
              <p className="text-[10px] text-stone-gray font-semibold max-w-xs leading-relaxed">
                Pick a chat thread from the left list or connected professionals directory to begin.
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}

export default function WorkspaceInbox() {
  const { user } = useAuth();

  if (user?.role === 'ROLE_PROVIDER') {
    return <ProfessionalInbox />;
  }

  return <CustomerInbox />;
}

