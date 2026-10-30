import React, { useEffect, useState, useRef, startTransition } from 'react';
import { useSearchParams } from 'react-router-dom';
import { chatApi } from '../../services/chat/chatService';
import type { Conversation, Message, SendMessageRequest } from '../../types/chat/chatTypes';
import { useAuth } from '../../hooks/auth/useAuth';

export function ChatPanel() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConvo, setSelectedConvo] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  // Input states
  const [inputText, setInputText] = useState('');
  const [attachUrl, setAttachUrl] = useState('');
  const [showAttachInput, setShowAttachInput] = useState(false);
  const [attachType, setAttachType] = useState<'IMAGE' | 'FILE'>('IMAGE');

  const [loading, setLoading] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Read params for auto creation if redirected from bookings details
  const bookingIdParam = searchParams.get('bookingId');
  const consultationIdParam = searchParams.get('consultationId');
  // Open a specific existing thread (e.g. from a project request): /chat?conversation=<id>
  const conversationParam = searchParams.get('conversation');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async (autoSelectId?: string) => {
    try {
      const list = await chatApi.listConversations();
      setConversations(list);
      if (autoSelectId) {
        const found = list.find((c) => c.id === autoSelectId);
        if (found) setSelectedConvo(found);
      }
    } catch (err) {
      console.error('Failed to load chat conversations', err);
    }
  };

  // 1. Initial Load and Auto-Chat initialization
  useEffect(() => {
    async function initChat() {
      try {
        setLoading(true);
        if (bookingIdParam) {
          const convo = await chatApi.createConversation({ bookingId: bookingIdParam });
          await loadConversations(convo.id);
        } else if (consultationIdParam) {
          const convo = await chatApi.createConversation({ consultationBookingId: consultationIdParam });
          await loadConversations(convo.id);
        } else {
          await loadConversations(conversationParam || undefined);
        }
      } catch (err) {
        console.error('Failed to initialize target conversation', err);
      } finally {
        setLoading(false);
      }
    }
    initChat();
  }, [bookingIdParam, consultationIdParam, conversationParam]);

  // 2. Fetch Messages when Conversation changes
  useEffect(() => {
    if (!selectedConvo) {
      startTransition(() => {
        setMessages([]);
      });
      return;
    }

    async function fetchMessages() {
      try {
        setLoadingMsgs(true);
        const msgList = await chatApi.getMessages(selectedConvo!.id);
        setMessages(msgList);
        // Clear local unread messages counter
        setConversations((prev) =>
          prev.map((c) => (c.id === selectedConvo!.id ? { ...c, messages: [] } : c))
        );
      } catch (err) {
        console.error('Failed to load messages', err);
      } finally {
        setLoadingMsgs(false);
      }
    }

    fetchMessages();
  }, [selectedConvo]);

  // Scroll to bottom when messages update
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 3. Auto-Polling Refresh (every 5 seconds)
  useEffect(() => {
    if (!selectedConvo) return;
    const interval = setInterval(async () => {
      try {
        const [updatedConvos, msgList] = await Promise.all([
          chatApi.listConversations(),
          chatApi.getMessages(selectedConvo.id),
        ]);
        setConversations(updatedConvos);
        setMessages(msgList);
      } catch (err) {
        console.error('Polling sync error', err);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [selectedConvo]);

  // 4. Send Message Form Submit
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConvo || (!inputText.trim() && !attachUrl.trim())) return;

    try {
      setIsTyping(true);
      const payload: SendMessageRequest = {
        conversationId: selectedConvo.id,
        content: inputText.trim() || 'Shared attachment',
        messageType: showAttachInput && attachUrl ? attachType : 'TEXT',
        attachmentUrl: showAttachInput && attachUrl ? attachUrl.trim() : undefined,
      };

      const newMsg = await chatApi.sendMessage(payload);
      setMessages((prev) => [...prev, newMsg]);

      // Reset Inputs
      setInputText('');
      setAttachUrl('');
      setShowAttachInput(false);

      // Re-trigger conversations list sync to update lastMessage previews
      await loadConversations(selectedConvo.id);
    } catch (err) {
      console.error('Failed to dispatch message', err);
    } finally {
      setIsTyping(false);
    }
  };

  const getRecipientName = (convo: Conversation) => {
    if (user?.role === 'ROLE_CUSTOMER') {
      return convo.provider?.fullName || 'Provider Partner';
    }
    return convo.customer?.fullName || 'Customer User';
  };

  const getRecipientSub = (convo: Conversation) => {
    if (user?.role === 'ROLE_CUSTOMER') {
      return convo.provider?.businessName || 'Verified Partner';
    }
    return 'Client';
  };

  return (
    <div className="bg-warm-cream text-stone-900 font-sans flex flex-col">

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 md:grid-cols-[280px_1fr] gap-4 min-h-[calc(100vh-140px)]">
        
        {/* Conversations Sidebar (Hidden on mobile when chat is active) */}
        <section className={`rounded-2xl border border-light-border bg-white p-4 shadow-xs flex flex-col ${selectedConvo ? 'hidden md:flex' : 'flex'}`}>
          <h2 className="text-sm font-bold text-stone-900 font-display border-b border-light-border pb-3">Conversations</h2>
          
          <div className="mt-3 flex-1 space-y-1.5 overflow-y-auto no-scrollbar">
            {loading ? (
              <div className="text-xs text-stone-400 py-4 animate-pulse">Initializing inbox...</div>
            ) : conversations.length === 0 ? (
              <div className="text-xs text-stone-400 py-6 text-center">No active chats found. Chats are generated automatically from active bookings.</div>
            ) : (
              conversations.map((convo) => {
                const isActive = selectedConvo?.id === convo.id;
                const unreadCount = convo.messages?.length || 0;
                return (
                  <div
                    key={convo.id}
                    onClick={() => setSelectedConvo(convo)}
                    className={`rounded-xl p-3 flex flex-col justify-between cursor-pointer border transition ${
                      isActive 
                        ? 'bg-brand-emerald border-brand-emerald text-white shadow-xs' 
                        : 'border-transparent bg-warm-cream text-stone-black hover:bg-stone-100'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="truncate">
                        <h4 className="text-xs font-bold truncate">{getRecipientName(convo)}</h4>
                        <span className={`text-3xs uppercase tracking-wider font-bold ${isActive ? 'text-stone-200' : 'text-stone-500'}`}>
                          {getRecipientSub(convo)}
                        </span>
                      </div>
                      {unreadCount > 0 && (
                        <span className="bg-brand-emerald border border-brand-emerald text-white rounded-full text-3xs font-bold px-2 py-0.5 animate-bounce">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                    
                    <p className={`mt-2 text-2xs truncate ${isActive ? 'text-stone-200' : 'text-stone-500'}`}>
                      {convo.lastMessage || 'Conversation started'}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Chat box section (Hidden on mobile when no chat is active) */}
        <section className={`rounded-2xl border border-light-border bg-white shadow-xs flex flex-col overflow-hidden ${!selectedConvo ? 'hidden md:flex justify-center items-center p-6 text-center text-stone-400' : 'flex'}`}>
          {!selectedConvo ? (
            <div className="space-y-2">
              <span className="text-4xl">💬</span>
              <h3 className="text-sm font-bold text-stone-700">Select a Conversation</h3>
              <p className="text-xs max-w-xs mx-auto leading-relaxed">Select a conversation from the inbox to communicate with customers or partners securely.</p>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="border-b border-light-border px-5 py-4 bg-warm-cream flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedConvo(null)}
                    className="md:hidden text-stone-500 hover:text-stone-850 text-sm font-bold mr-1 cursor-pointer"
                  >
                    ← Inbox
                  </button>
                  <div>
                    <h3 className="text-sm font-bold text-stone-900 leading-tight">{getRecipientName(selectedConvo)}</h3>
                    <p className="text-3xs text-stone-600 uppercase tracking-wider font-bold mt-0.5 flex items-center gap-1.5">
                      <span>{getRecipientSub(selectedConvo)}</span>
                      {selectedConvo.booking && (
                        <span>• Ref: {selectedConvo.booking.bookingNumber}</span>
                      )}
                      {selectedConvo.consultationBooking && (
                        <span>• Ref: {selectedConvo.consultationBooking.bookingNumber}</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Message Thread */}
              <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-warm-cream/50">
                {loadingMsgs ? (
                  <div className="text-xs text-stone-400 animate-pulse text-center py-4">Fetching message history...</div>
                ) : messages.length === 0 ? (
                  <div className="text-xs text-stone-400 text-center py-8">Inbox is empty. Send a message to start conversation!</div>
                ) : (
                  messages.map((msg) => {
                    const isOwn = String(msg.senderId) === String(user?.id);
                    return (
                      <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 shadow-xs text-xs relative group ${
                          isOwn 
                            ? 'bg-brand-emerald text-white rounded-tr-none' 
                            : 'bg-white border border-light-border text-stone-900 rounded-tl-none'
                        }`}>
                          
                          {/* Attachment Rendering */}
                          {msg.attachmentUrl && (
                            <div className="mb-2 rounded-lg overflow-hidden border border-light-border bg-warm-cream max-w-[200px]">
                              {msg.messageType === 'IMAGE' ? (
                                <img
                                  src={msg.attachmentUrl}
                                  alt="Attachment"
                                  className="w-full object-cover max-h-32"
                                />
                              ) : (
                                <a
                                  href={msg.attachmentUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-3 text-2xs font-bold text-wood-brown block hover:underline"
                                >
                                  📄 View PDF / Document
                                </a>
                              )}
                            </div>
                          )}

                          <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                          
                          <div className={`flex items-center gap-1.5 justify-end mt-1 text-3xs uppercase tracking-wider font-bold ${isOwn ? 'text-emerald-100' : 'text-stone-600'}`}>
                            <span>
                              {new Date(msg.createdAt).toLocaleTimeString('en-IN', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            {isOwn && (
                              <span className={msg.isRead ? 'text-amber-300 font-bold' : 'text-stone-300'}>
                                {msg.isRead ? '✓✓ Read' : '✓'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Typing Indicator */}
              {isTyping && (
                <div className="px-5 py-2 text-2xs text-stone-500 animate-pulse font-medium bg-warm-cream">
                  💬 Typing reply...
                </div>
              )}

              {/* Input Form Area */}
              <form onSubmit={handleSendMessage} className="border-t border-light-border p-4 space-y-3 bg-white">
                {/* Mock Attachment Toggle Drawer */}
                {showAttachInput && (
                  <div className="flex items-center gap-3 p-3 bg-warm-cream rounded-xl border border-light-border text-xs">
                    <select
                      value={attachType}
                      onChange={(e) => setAttachType(e.target.value as 'IMAGE' | 'FILE')}
                      className="rounded border border-light-border bg-white px-2 py-1 text-2xs font-bold focus:outline-none"
                    >
                      <option value="IMAGE">📷 Image Link</option>
                      <option value="FILE">📄 PDF File</option>
                    </select>
                    <input
                      type="text"
                      value={attachUrl}
                      onChange={(e) => setAttachUrl(e.target.value)}
                      placeholder="Paste mockup URL..."
                      className="flex-1 rounded border border-light-border bg-white px-3 py-1 text-2xs focus:outline-none focus:border-brand-emerald"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setAttachUrl('');
                        setShowAttachInput(false);
                      }}
                      className="text-2xs font-bold text-stone-500 hover:text-stone-600 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAttachInput(!showAttachInput)}
                    className="rounded-lg border border-light-border bg-white hover:bg-warm-cream text-stone-600 h-10 w-10 flex items-center justify-center transition cursor-pointer"
                    title="Attach mock file"
                  >
                    📎
                  </button>
                  
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Type message details..."
                    className="flex-1 rounded-lg border border-light-border px-4 h-10 text-xs text-stone-900 focus:border-brand-emerald focus:ring-1 focus:ring-brand-emerald focus:outline-none bg-white"
                  />

                  <button
                    type="submit"
                    disabled={!inputText.trim() && !attachUrl.trim()}
                    className="rounded-lg bg-brand-emerald hover:bg-brand-emerald/90 px-5 h-10 text-white font-bold text-xs disabled:opacity-50 transition cursor-pointer"
                  >
                    Send
                  </button>
                </div>
              </form>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
