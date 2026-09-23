import { mobileCustomerMessagingService } from '../../services/mobileCustomerMessagingService.js';
import type { MobileConversationThread, MobileMessageItem } from '../../types/customerMessagingMobileTypes.js';

export interface CustomerConversationScreenProps {
  threadId: string;
  onBack?: () => void;
}

export class CustomerConversationScreenController {
  private props: CustomerConversationScreenProps;
  private state: {
    thread: MobileConversationThread | null;
    messages: MobileMessageItem[];
    isLoading: boolean;
    error: string | null;
    inputText: string;
    attachmentUrl: string;
    isSending: boolean;
    sendError: string | null;
  };

  constructor(props: CustomerConversationScreenProps) {
    this.props = props;
    this.state = {
      thread: null,
      messages: [],
      isLoading: true,
      error: null,
      inputText: '',
      attachmentUrl: '',
      isSending: false,
      sendError: null,
    };
  }

  async init(): Promise<void> {
    await this.loadConversation();
  }

  async loadConversation(): Promise<void> {
    this.state.isLoading = true;
    this.state.error = null;
    try {
      const threads = await mobileCustomerMessagingService.getCustomerThreads();
      const thread = threads.find((t) => t.id === this.props.threadId) || null;
      this.state.thread = thread;

      const messages = await mobileCustomerMessagingService.getMessages(this.props.threadId);
      this.state.messages = messages;

      // Mark thread as read upon viewing
      await mobileCustomerMessagingService.markThreadRead(this.props.threadId);
    } catch (err) {
      this.state.error = err instanceof Error ? err.message : 'Unable to load conversation';
    } finally {
      this.state.isLoading = false;
    }
  }

  setInputText(text: string): void {
    this.state.inputText = text;
    this.state.sendError = null;
  }

  setAttachmentUrl(url: string): void {
    this.state.attachmentUrl = url;
  }

  async handleSendMessage(): Promise<void> {
    const text = this.state.inputText.trim();
    if (!text || this.state.isSending) return;

    this.state.isSending = true;
    this.state.sendError = null;

    try {
      const attachment = this.state.attachmentUrl.trim() || undefined;
      const newMsg = await mobileCustomerMessagingService.sendMessage(
        this.props.threadId,
        text,
        attachment
      );

      this.state.messages.push(newMsg);
      this.state.inputText = '';
      this.state.attachmentUrl = '';
    } catch (err) {
      this.state.sendError = err instanceof Error ? err.message : 'Failed to send message';
    } finally {
      this.state.isSending = false;
    }
  }

  getState() {
    return { ...this.state };
  }
}

export function renderCustomerConversationScreen(
  controller: CustomerConversationScreenController,
  onBack?: () => void
): string {
  const { thread, messages, isLoading, error, inputText, attachmentUrl, isSending, sendError } =
    controller.getState();

  if (isLoading) {
    return `
      <div class="mobile-container flex flex-col items-center justify-center p-6 space-y-4">
        <div class="spinner border-t-emerald-700 border-stone-200 border-4 w-8 h-8 rounded-full animate-spin"></div>
        <p class="text-xs font-semibold text-stone-600">Loading Conversation Feed...</p>
      </div>
    `;
  }

  if (error) {
    return `
      <div class="mobile-container p-4 space-y-4">
        <div class="flex items-center gap-3">
          <button onclick="${onBack ? 'onBack()' : 'history.back()'}" class="min-h-[44px] min-w-[44px] flex items-center justify-center text-stone-700 font-bold">
            ←
          </button>
          <h1 class="text-base font-bold text-stone-900 font-serif">Conversation</h1>
        </div>
        <div class="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-3">
          <span class="text-2xl">⚠️</span>
          <p class="text-xs font-bold text-rose-800">${error}</p>
          <button onclick="controller.loadConversation()" class="min-h-[44px] px-4 py-2 bg-rose-700 text-white font-bold text-xs rounded-xl hover:bg-rose-800">
            Retry Message Loading
          </button>
        </div>
      </div>
    `;
  }

  const providerName = thread?.providerName || 'Contractor Partner';
  const projectTitle = thread?.projectContextTitle || 'Project Conversation';

  return `
    <div class="mobile-container flex flex-col h-full p-4 space-y-4 select-none">
      <!-- Conversation Header -->
      <div class="flex items-center justify-between pb-3 border-b border-stone-200/80 shrink-0">
        <div class="flex items-center gap-3">
          <button onclick="${onBack ? 'onBack()' : 'history.back()'}" class="min-h-[44px] min-w-[44px] flex items-center justify-center text-stone-700 font-bold" aria-label="Go Back">
            ←
          </button>
          <div>
            <h1 class="text-base font-bold text-stone-900 font-serif truncate max-w-[200px]">${providerName}</h1>
            <span class="text-[10px] text-stone-500 font-bold block">🎯 ${projectTitle}</span>
          </div>
        </div>
        <span class="text-xs">💬</span>
      </div>

      <!-- Messages Stream -->
      <div class="flex-1 space-y-3 overflow-y-auto py-2 pr-1" id="messages-stream">
        ${
          messages.length === 0
            ? `
          <div class="p-6 text-center space-y-1 text-stone-400">
            <p class="text-xs font-semibold">No messages in this discussion thread yet.</p>
            <p class="text-[10px]">Send a note below to start communicating with your contractor.</p>
          </div>
        `
            : messages
                .map((m) => {
                  const isCustomer = m.senderRole === 'CUSTOMER';
                  const isSystem = m.senderRole === 'SYSTEM';

                  if (isSystem) {
                    return `
                    <div class="flex justify-center my-2">
                      <span class="dbc-badge bg-stone-100 text-stone-600 border-stone-200 text-[9px] font-bold uppercase">
                        ${m.content}
                      </span>
                    </div>
                  `;
                  }

                  return `
                  <div class="flex flex-col ${isCustomer ? 'items-end' : 'items-start'} space-y-1">
                    <span class="text-[9px] font-bold text-stone-400 px-1">
                      ${isCustomer ? 'You' : providerName} • ${m.timestamp}
                    </span>
                    
                    <div
                      class="max-w-[82%] p-3.5 rounded-2xl text-xs font-semibold ${
                        isCustomer
                          ? 'bg-stone-900 text-white rounded-br-xs shadow-sm'
                          : 'bg-stone-100 text-stone-800 border border-stone-200 rounded-bl-xs'
                      }"
                    >
                      <p class="leading-relaxed whitespace-pre-wrap">${m.content}</p>
                      
                      ${
                        m.attachment
                          ? `
                        <div class="mt-2 pt-2 border-t ${isCustomer ? 'border-stone-700 text-emerald-300' : 'border-stone-200 text-emerald-800'} text-[10px] font-bold flex items-center gap-1">
                          <span>📎 Attachment: ${m.attachment.name}</span>
                        </div>
                      `
                          : ''
                      }
                    </div>
                  </div>
                `;
                })
                .join('')
        }
      </div>

      <!-- Error banner if sending failed -->
      ${
        sendError
          ? `
        <div class="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-800 shrink-0 flex items-center justify-between">
          <span>⚠️ ${sendError}</span>
          <button onclick="controller.handleSendMessage()" class="underline text-[10px]">Retry</button>
        </div>
      `
          : ''
      }

      <!-- Message Composer (Keyboard Safe & Touch Friendly) -->
      <div class="p-3 bg-white border border-stone-200 rounded-2xl space-y-2 shrink-0 shadow-lg">
        <textarea
          placeholder="Type your message to ${providerName}..."
          rows="2"
          oninput="controller.setInputText(this.value)"
          class="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-emerald-600 resize-none"
        >${inputText}</textarea>

        <div class="flex items-center justify-between pt-1">
          <input
            type="text"
            placeholder="Optional image/doc URL..."
            value="${attachmentUrl}"
            oninput="controller.setAttachmentUrl(this.value)"
            class="text-[10px] p-1.5 bg-stone-50 border border-stone-200 rounded-lg text-stone-700 w-3/5 focus:outline-none"
          />

          <button
            onclick="controller.handleSendMessage()"
            ${isSending || !inputText.trim() ? 'disabled' : ''}
            class="min-h-[44px] min-w-[80px] px-4 dbc-btn dbc-btn-md ${!inputText.trim() ? 'bg-stone-200 text-stone-400 border-stone-200' : 'dbc-btn-primary'} font-bold text-xs"
          >
            ${isSending ? 'Sending...' : 'Send →'}
          </button>
        </div>
      </div>
    </div>
  `;
}
