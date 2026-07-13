import { create } from 'zustand';

export type Role = 'user' | 'agent';

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: Date;
  intent?: string;
  data?: any;
}

interface ChatState {
  messages: Message[];
  isLoading: boolean;
  fetchHistory: () => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  addMessage: (msg: Message) => void;
  clearHistory: () => void;
}

export const useChat = create<ChatState>((set, get) => ({
  messages: [],
  isLoading: false,

  fetchHistory: async () => {
    try {
      const res = await fetch('/api/agent/chat');
      if (res.ok) {
        const data = await res.json();
        // Convert string timestamps back to Date objects
        const parsedMessages = data.messages.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp),
        }));
        set({ messages: parsedMessages });
      }
    } catch (error) {
      console.error('Failed to fetch chat history:', error);
    }
  },

  sendMessage: async (content: string) => {
    // Optimistically add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    set((state) => ({
      messages: [...state.messages, userMessage],
      isLoading: true,
    }));

    try {
      const res = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content }),
      });

      if (res.ok) {
        const data = await res.json();
        const agentMessage: Message = {
          ...data.message,
          timestamp: new Date(data.message.timestamp),
        };

        set((state) => ({
          messages: [...state.messages, agentMessage],
          isLoading: false,
        }));
      } else {
        throw new Error('API Error');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      // Fallback error message
      set((state) => ({
        messages: [
          ...state.messages,
          {
            id: Date.now().toString() + '-err',
            role: 'agent',
            content: 'Sorry, I encountered an error connecting to the server.',
            timestamp: new Date(),
          }
        ],
        isLoading: false,
      }));
    }
  },

  addMessage: (msg: Message) => {
    set((state) => ({ messages: [...state.messages, msg] }));
  },

  clearHistory: () => set({ messages: [] }),
}));
