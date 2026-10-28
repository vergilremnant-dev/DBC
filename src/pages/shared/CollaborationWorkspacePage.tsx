import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CollaborationService } from '../../services/contractor/CollaborationService.js';
import type { Conversation, Message, GlobalActivity, Announcement } from '../../types/contractor/CollaborationTypes.js';

interface TaskItem {
  id: string;
  title: string;
  completed: boolean;
  commentsCount: number;
}

interface SharedFile {
  id: string;
  name: string;
  size: string;
  uploader: string;
}

const INITIAL_TASKS: TaskItem[] = [
  { id: 't-1', title: 'Verify Vastu alignment quadrant', completed: true, commentsCount: 2 },
  { id: 't-2', title: 'Upload concrete layout blueprints', completed: false, commentsCount: 0 },
  { id: 't-3', title: 'Approve plumbing milestone payment', completed: false, commentsCount: 1 },
];

const INITIAL_FILES: SharedFile[] = [
  { id: 'f-1', name: 'Architectural Ground Plan v1.2.pdf', size: '4.2 MB', uploader: 'Alice Architect' },
  { id: 'f-2', name: 'Plumbing Drainage Blueprint.dwg', size: '8.5 MB', uploader: 'Bob Builder' },
];

export function CollaborationWorkspacePage() {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activities, setActivities] = useState<GlobalActivity[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Context drawer switcher: details (tasks/meetings) vs files vs announcements
  const [rightPanelTab, setRightPanelTab] = useState<'details' | 'files' | 'activity'>('details');

  // Interactive Task List
  const [tasks, setTasks] = useState<TaskItem[]>(INITIAL_TASKS);
  const [sharedFiles, setSharedFiles] = useState<SharedFile[]>(INITIAL_FILES);
  const [meetingSubject, setMeetingSubject] = useState('');

  // Composer fields
  const [newMessage, setNewMessage] = useState('');
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [newChatProvider, setNewChatProvider] = useState('');
  const [newChatType, setNewChatType] = useState('DIRECT');

  // Presence status tracker
  const [presenceStatus, setPresenceStatus] = useState('ONLINE');

  const token = localStorage.getItem('token') || globalThis.__accessToken;
  let currentUserRole = 'CUSTOMER';
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      currentUserRole = payload.role === 'PROVIDER' ? 'PROVIDER' : 'CUSTOMER';
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (activeConv) {
      loadMessagesList(activeConv.id);
    }
  }, [activeConv]);

  async function loadInitialData() {
    try {
      setLoading(true);
      setError('');
      const [convs, acts, anns] = await Promise.all([
        CollaborationService.listConversations(),
        CollaborationService.listActivities(),
        CollaborationService.listAnnouncements(),
      ]);
      setConversations(convs);
      setActivities(acts);
      setAnnouncements(anns);
      if (convs.length > 0) {
        setActiveConv(convs[0]);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch collaboration resources');
    } finally {
      setLoading(false);
    }
  }

  async function loadMessagesList(convId: string) {
    try {
      const list = await CollaborationService.getMessages(convId);
      setMessages(list);
    } catch (err: unknown) {
      console.error(err);
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!activeConv || !newMessage.trim()) return;
    try {
      setError('');
      await CollaborationService.sendMessage(activeConv.id, {
        content: newMessage.trim(),
      });
      setNewMessage('');
      await loadMessagesList(activeConv.id);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  }

  async function handleNewChat(e: React.FormEvent) {
    e.preventDefault();
    if (!newChatProvider.trim()) return;
    try {
      setError('');
      setSuccess('');
      const conv = await CollaborationService.createConversation({
        providerId: newChatProvider.trim(),
        conversationType: newChatType,
      });
      setSuccess('Conversation initialized!');
      setNewChatProvider('');
      setActiveConv(conv);
      const list = await CollaborationService.listConversations();
      setConversations(list);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  }

  async function handlePostAnnouncement(e: React.FormEvent) {
    e.preventDefault();
    if (!annTitle.trim() || !annContent.trim()) return;
    try {
      setError('');
      setSuccess('');
      await CollaborationService.publishAnnouncement(annTitle.trim(), annContent.trim());
      setSuccess('Announcement broadcasted successfully!');
      setAnnTitle('');
      setAnnContent('');
      const list = await CollaborationService.listAnnouncements();
      setAnnouncements(list);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  }

  async function handlePresenceChange(status: string) {
    try {
      setPresenceStatus(status);
      await CollaborationService.updatePresence(status);
    } catch (err: unknown) {
      console.error(err);
    }
  }

  // Task checkoff toggle
  const handleToggleTask = (id: string) => {
    setTasks(prev =>
      prev.map(t => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  // Schedule virtual meeting
  const handleScheduleMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingSubject.trim()) return;
    alert(`Meeting scheduled: "${meetingSubject}" for tomorrow at 2:00 PM.`);
    setMeetingSubject('');
  };

  // File upload simulation
  const handleUploadFile = () => {
    const fileName = prompt('Enter mockup file name (e.g. electrical-grid.dwg):');
    if (!fileName) return;

    const newFile: SharedFile = {
      id: `file_${Date.now()}`,
      name: fileName,
      size: '2.4 MB',
      uploader: 'You',
    };
    setSharedFiles([newFile, ...sharedFiles]);
    alert('CAD plan uploaded and shared in the project files list.');
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-stone-50">
        <div className="text-center space-y-3">
          <div className="h-8 w-8 rounded-full border-4 border-stone-200 border-t-emerald-700 animate-spin mx-auto"></div>
          <p className="text-xs font-bold text-stone-500 uppercase tracking-widest">Entering Chat Rooms...</p>
        </div>
      </div>
    );
  }

  const activeRecipientName = activeConv
    ? (currentUserRole === 'PROVIDER' ? activeConv.customer?.fullName : activeConv.provider?.fullName)
    : 'Select a conversation';

  return (
    <div className="min-h-screen bg-warm-cream text-stone-800 pb-10 flex flex-col font-sans selection:bg-emerald-50">
      
      {/* Header Area */}
      <div className="bg-white border-b border-light-border sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-0.5 text-left">
            <span className="bg-stone-150 text-stone-700 text-3xs font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
              Real-Time Collaboration Platform
            </span>
            <h1 className="text-xl font-bold text-stone-900 font-display leading-tight">
              Project Collaboration Rooms
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Real-time status indicator */}
            <div className="flex items-center gap-1.5 border border-light-border bg-stone-50 rounded-xl px-2.5 py-1.5 text-xs font-semibold">
              <span className={`w-2.5 h-2.5 rounded-full ${
                presenceStatus === 'ONLINE' ? 'bg-brand-emerald' : presenceStatus === 'AWAY' ? 'bg-amber-500' : 'bg-stone-400'
              }`} />
              <select
                value={presenceStatus}
                onChange={(e) => handlePresenceChange(e.target.value)}
                className="bg-transparent border-none text-xs font-bold text-stone-700 focus:outline-none cursor-pointer"
              >
                <option value="ONLINE">ONLINE</option>
                <option value="AWAY">AWAY</option>
                <option value="BUSY">BUSY</option>
                <option value="OFFLINE">OFFLINE</option>
              </select>
            </div>
            
            <button
              onClick={() => navigate('/')}
              className="text-xs font-bold text-stone-600 hover:text-stone-900 transition bg-light-stone/30 px-3 py-2 rounded-xl border border-light-border"
            >
              Exit Workspace
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-xs font-semibold flex items-center gap-2 text-left">
            <span className="w-1.5 h-1.5 bg-red-600 rounded-full" />
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 bg-emerald-50 border border-emerald-100 text-emerald-800 p-4 rounded-xl text-xs font-semibold flex items-center gap-2 text-left">
            <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full" />
            {success}
          </div>
        )}

        {/* 3-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* COLUMN 1: LEFT INBOX CHANNELS LIST (Col span 3) */}
          <div className="lg:col-span-3 space-y-6">
            <div className="dbc-card space-y-4">
              <h3 className="text-xs font-black text-stone-black uppercase tracking-wider border-b border-light-border/40 pb-2">Active Channels</h3>
              
              <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
                {conversations.map((conv) => {
                  const isActive = activeConv?.id === conv.id;
                  return (
                    <button
                      key={conv.id}
                      onClick={() => setActiveConv(conv)}
                      className={`w-full text-left p-3 rounded-2xl border transition flex flex-col gap-1 cursor-pointer
                        ${isActive 
                          ? 'border-brand-emerald bg-brand-emerald/5 shadow-xs font-extrabold' 
                          : 'border-light-border bg-white hover:bg-light-stone/30'
                        }
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <span className="bg-light-stone text-stone-gray text-3xs font-black px-1.5 py-0.5 rounded border border-light-border uppercase">
                          {conv.conversationType}
                        </span>
                        <span className="text-3xs text-stone-gray font-bold">
                          {conv.lastMessageAt ? new Date(conv.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                      <span className="text-xs font-black text-stone-black truncate mt-1">
                        {currentUserRole === 'PROVIDER' ? conv.customer?.fullName : conv.provider?.fullName}
                      </span>
                      {conv.lastMessage && (
                        <p className="text-2xs text-stone-gray truncate font-medium">
                          {conv.lastMessage}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Conversation Wizard Form */}
            <form onSubmit={handleNewChat} className="dbc-card space-y-3">
              <h3 className="text-xs font-black text-stone-black uppercase tracking-wider border-b border-light-border/40 pb-2">Open Chat Room</h3>
              <div className="space-y-1">
                <label className="text-3xs font-black text-stone-gray uppercase tracking-widest">Provider UUID</label>
                <input
                  type="text"
                  value={newChatProvider}
                  onChange={(e) => setNewChatProvider(e.target.value)}
                  placeholder="provider-uuid"
                  className="dbc-input"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-3xs font-black text-stone-gray uppercase tracking-widest">Room Category</label>
                <select
                  value={newChatType}
                  onChange={(e) => setNewChatType(e.target.value)}
                  className="dbc-input bg-white"
                >
                  <option value="DIRECT">Direct Message</option>
                  <option value="GROUP">Group Chat</option>
                  <option value="PROJECT">Project Workspace</option>
                  <option value="SUPPORT">Support Thread</option>
                </select>
              </div>
              <button type="submit" className="w-full dbc-btn dbc-btn-primary py-2 text-xs font-bold uppercase tracking-wider cursor-pointer">
                Create Room
              </button>
            </form>
          </div>

          {/* COLUMN 2: MIDDLE CONVERSATION TIMELINE (Col span 5) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-3xl border border-light-border shadow-apple-sm flex flex-col h-[550px] justify-between overflow-hidden">
              
              {/* Header title */}
              <div className="border-b border-light-border p-4 bg-light-stone/10 rounded-t-3xl flex justify-between items-center text-left">
                <div>
                  <h3 className="font-display font-black text-stone-black text-sm">
                    {activeConv ? activeRecipientName : 'No active channel'}
                  </h3>
                  <span className="text-3xs text-stone-gray font-bold">
                    {activeConv ? `Room Type: ${activeConv.conversationType} | ID: ${activeConv.id}` : 'Select a channel from the left sidebar to connect'}
                  </span>
                </div>
              </div>

              {/* Chat bubbles list */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[380px] bg-light-stone/5">
                {activeConv && messages.length === 0 && (
                  <div className="text-center py-12 text-stone-gray text-xs font-semibold">
                    Room active. Say hello to finalize parameters!
                  </div>
                )}

                {activeConv && messages.map((msg) => {
                  const isMyMessage = msg.senderId === (token ? JSON.parse(atob(token.split('.')[1])).id : '');
                  return (
                    <div key={msg.id} className={`flex flex-col max-w-[85%] text-left ${isMyMessage ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
                      <span className="text-3xs text-stone-gray font-bold mb-0.5">
                        {msg.sender?.fullName} • {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <div className={`p-3 rounded-2xl text-xs font-semibold leading-relaxed shadow-apple-sm
                        ${isMyMessage 
                          ? 'bg-brand-emerald text-white rounded-tr-none' 
                          : 'bg-light-stone text-stone-black border border-light-border rounded-tl-none'
                        }
                      `}>
                        {msg.content}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Message Composer Input */}
              {activeConv && (
                <form onSubmit={handleSend} className="border-t border-light-border p-4 bg-white flex gap-2.5">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type message here..."
                    className="flex-1 bg-light-stone/40 border border-light-border rounded-xl px-4 py-2.5 text-xs text-stone-black focus:outline-none focus:border-brand-emerald focus:ring-1 focus:ring-brand-emerald"
                  />
                  <button type="submit" className="dbc-btn dbc-btn-primary px-4 py-2 text-xs font-bold uppercase tracking-wider cursor-pointer">
                    Send
                  </button>
                </form>
              )}

            </div>
          </div>

          {/* COLUMN 3: RIGHT CONTEXT DRAWER PANEL (Col span 4) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Drawer Switcher Tabs */}
            <div className="flex border-b border-light-border p-1 bg-white rounded-2xl shadow-apple-sm">
              {([
                { id: 'details', label: 'Tasks & Meetings', icon: '📋' },
                { id: 'files', label: 'Files Library', icon: '📁' },
                { id: 'activity', label: 'Feed Log', icon: '🕒' },
              ] as const).map((t) => {
                const isActive = rightPanelTab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setRightPanelTab(t.id)}
                    className={`flex-1 text-center py-2 rounded-xl text-3xs font-black uppercase tracking-wider transition cursor-pointer select-none
                      ${isActive ? 'bg-light-stone text-stone-black shadow-xs font-extrabold' : 'text-stone-gray'}
                    `}
                  >
                    <span>{t.icon}</span>
                    <span className="hidden md:inline ml-1">{t.label}</span>
                  </button>
                );
              })}
            </div>

            {/* RENDER TAB: TASKS & VIRTUAL MEETINGS */}
            {rightPanelTab === 'details' && (
              <div className="space-y-6">
                
                {/* Tasks discussion checklists */}
                <div className="dbc-card space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-wider text-stone-black">Project Task Checklist</h3>
                  <div className="space-y-3">
                    {tasks.map((task) => (
                      <div key={task.id} className="flex items-start gap-3 text-xs font-semibold text-stone-gray">
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={() => handleToggleTask(task.id)}
                          className="w-4 h-4 rounded text-brand-emerald focus:ring-brand-emerald mt-0.5 cursor-pointer"
                        />
                        <div className="flex-1 text-left">
                          <span className={task.completed ? 'line-through text-stone-gray/60' : 'text-stone-black'}>
                            {task.title}
                          </span>
                          {task.commentsCount > 0 && (
                            <span className="block text-3xs text-brand-emerald font-bold mt-0.5">
                              💬 {task.commentsCount} comments
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Virtual meeting scheduler */}
                <form onSubmit={handleScheduleMeeting} className="dbc-card space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-wider text-stone-black">Schedule Consultation Call</h3>
                  <div className="space-y-1.5">
                    <input
                      type="text"
                      placeholder="Meeting Agenda (e.g. window alignment review)"
                      value={meetingSubject}
                      onChange={(e) => setMeetingSubject(e.target.value)}
                      className="dbc-input"
                      required
                    />
                  </div>
                  <button type="submit" className="w-full dbc-btn dbc-btn-primary py-2 text-xs font-bold uppercase tracking-wider cursor-pointer">
                    Schedule Call
                  </button>
                </form>

              </div>
            )}

            {/* RENDER TAB: FILES LIBRARY */}
            {rightPanelTab === 'files' && (
              <div className="dbc-card space-y-4">
                <div className="flex justify-between items-center border-b border-light-border/40 pb-2">
                  <h3 className="text-xs font-black uppercase tracking-wider text-stone-black">Shared Blueprints</h3>
                  <button
                    onClick={handleUploadFile}
                    className="text-3xs font-black uppercase text-brand-emerald hover:underline focus:outline-none"
                  >
                    Upload File +
                  </button>
                </div>

                <div className="space-y-3">
                  {sharedFiles.map((file) => (
                    <div key={file.id} className="p-3 bg-light-stone/30 border border-light-border rounded-2xl flex justify-between items-center text-left">
                      <div className="min-w-0 pr-2">
                        <h4 className="text-xs font-black text-stone-black truncate">📄 {file.name}</h4>
                        <span className="block text-3xs text-stone-gray font-semibold mt-0.5">Uploader: {file.uploader} • {file.size}</span>
                      </div>
                      <button
                        onClick={() => alert(`Downloading file: ${file.name}`)}
                        className="text-3xs font-black text-brand-emerald hover:underline focus:outline-none"
                      >
                        Download
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* RENDER TAB: FEED LOG */}
            {rightPanelTab === 'activity' && (
              <div className="dbc-card space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-stone-black">Global Activities</h3>
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                  {activities.map((act) => (
                    <div key={act.id} className="border-l-2 border-light-border pl-3 relative space-y-1 text-left">
                      <span className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-brand-emerald" />
                      <div className="text-3xs text-stone-gray font-black uppercase tracking-wider">{act.activityType}</div>
                      <div className="text-2xs text-stone-gray font-semibold leading-relaxed">{act.description}</div>
                      <span className="block text-3xs text-stone-gray/80 font-bold">{new Date(act.createdAt).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* System announcements bulletins */}
            <div className="dbc-card space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-stone-black border-b border-light-border/40 pb-2">Global Notices</h3>
              <div className="space-y-3 max-h-[220px] overflow-y-auto text-left">
                {announcements.map((ann) => (
                  <div key={ann.id} className="bg-light-stone/30 border border-light-border rounded-2xl p-3 space-y-1.5">
                    <h5 className="font-black text-xs text-stone-black">{ann.title}</h5>
                    <p className="text-2xs text-stone-gray font-semibold leading-relaxed">{ann.content}</p>
                    <span className="block text-3xs text-stone-gray font-bold">
                      {ann.author?.fullName} • {new Date(ann.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>

              {/* Notice Publisher */}
              {(currentUserRole === 'PROVIDER' || currentUserRole === 'ADMIN') && (
                <form onSubmit={handlePostAnnouncement} className="space-y-3 pt-3 border-t border-light-border/40">
                  <h4 className="text-3xs font-black uppercase tracking-wider text-stone-black">Publish Bulletin Notice</h4>
                  <input
                    type="text"
                    placeholder="Notice Title"
                    value={annTitle}
                    onChange={(e) => setAnnTitle(e.target.value)}
                    className="dbc-input"
                    required
                  />
                  <textarea
                    placeholder="Notice Content details..."
                    value={annContent}
                    onChange={(e) => setAnnContent(e.target.value)}
                    className="dbc-input h-14 resize-none"
                    required
                  />
                  <button type="submit" className="w-full dbc-btn dbc-btn-primary py-2 text-xs font-bold uppercase tracking-wider cursor-pointer">
                    Publish Notice
                  </button>
                </form>
              )}
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
