'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useChat, Message } from '@/stores/useChat';
import { Send, Bot, User, Check, X, Package } from 'lucide-react';
import VoiceMicButton from '@/components/VoiceMicButton';

export default function ChatPage() {
  const { messages, isLoading, fetchHistory, sendMessage, addMessage } = useChat();

  const handleVoiceSuccess = (transcription: string, agentMessage: any) => {
    // Add the user's transcribed message
    const userMsg: Message = {
      id: `voice-user-${Date.now()}`,
      role: 'user',
      content: transcription,
      timestamp: new Date(),
    };
    addMessage(userMsg);

    // Add the agent's response
    const agentMsg: Message = {
      id: agentMessage.id || `voice-agent-${Date.now()}`,
      role: 'agent',
      content: agentMessage.content,
      timestamp: new Date(agentMessage.timestamp),
      intent: agentMessage.intent,
      data: agentMessage.data,
    };
    addMessage(agentMsg);
  };
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage(input);
    setInput('');
  };

  const renderProductList = (items: any[]) => (
    <div className="mt-3 grid gap-2">
      {items.map((item, idx) => (
        <div key={idx} className="bg-white/50 dark:bg-slate-800/50 p-2 rounded-lg flex items-center gap-3 border border-slate-200/50 dark:border-slate-700/50">
          <div className="bg-primary/10 p-2 rounded-md">
            <Package className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">{item.name}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Stock: {item.stock}</p>
          </div>
          <p className="text-sm font-bold text-primary">Rs {item.price}</p>
        </div>
      ))}
    </div>
  );

  const isUrduText = (text: string) => {
    return /[\u0600-\u06FF]/.test(text);
  };

  const renderBillReceipt = (data: any) => (
    <div className="mt-3 bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-md border border-slate-200/60 dark:border-slate-800/60 receipt-serrated pb-3">
      <div className="p-4 border-b border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
        <h4 className="font-extrabold text-center text-slate-800 dark:text-white uppercase tracking-wider text-xs font-mono">ZYNQ THERMAL RECEIPT</h4>
        <p className="text-center text-[10px] text-slate-400 font-mono mt-1">Customer: {data.customer}</p>
      </div>
      <div className="p-4 font-mono text-xs space-y-2">
        <div className="space-y-1.5 mb-4">
          {data.items.map((item: any, idx: number) => (
            <div key={idx} className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>{item.qty}x {item.name}</span>
              <span className="font-semibold">Rs {item.price}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between items-center pt-2 border-t border-dashed border-slate-200 dark:border-slate-800">
          <span className="font-bold text-slate-800 dark:text-slate-200">TOTAL</span>
          <span className="font-extrabold text-base text-primary">Rs {data.total}</span>
        </div>
      </div>
      <div className="flex border-t border-slate-100 dark:border-slate-800 mx-3 pt-2">
        <button className="flex-1 py-2 flex items-center justify-center gap-1.5 text-xs font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors">
          <X className="w-3.5 h-3.5" /> Cancel
        </button>
        <div className="w-[1px] bg-slate-100 dark:bg-slate-800"></div>
        <button className="flex-1 py-2 flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 rounded-lg transition-colors">
          <Check className="w-3.5 h-3.5" /> Execute
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-[calc(100vh-73px)] md:h-[calc(100vh-64px)] -mx-4 -my-4 md:-mx-8 md:-my-8 bg-[#f3f4f6] dark:bg-slate-950 relative overflow-hidden">
      {/* Chat Background Pattern (WhatsApp style) */}
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/cubes.png")' }}></div>

      {/* Header */}
      <div className="bg-white dark:bg-slate-900 px-6 py-4 border-b border-slate-200/50 dark:border-slate-800/50 flex items-center gap-3.5 shadow-sm z-10 shrink-0">
        <div className="bg-primary p-2.5 rounded-full shadow-inner">
          <Bot className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="font-bold text-slate-800 dark:text-white leading-tight">Zynq Assistant</h2>
          <p className="text-[11px] text-emerald-500 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" /> Online
          </p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 z-10 relative">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          const isUrdu = isUrduText(msg.content);
          return (
            <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-slide-up-fade`}>
              <div className={`max-w-[85%] md:max-w-[65%] flex gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                
                {/* Avatar */}
                <div className="shrink-0 mt-auto mb-1">
                  {isUser ? (
                    <div className="w-8 h-8 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center border border-slate-300/30">
                      <User className="w-4 h-4 text-slate-500" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                  )}
                </div>

                {/* Bubble */}
                <div 
                  className={`relative p-3.5 rounded-2xl shadow-sm border border-slate-200/10 ${
                    isUser 
                      ? 'bg-primary text-white rounded-br-sm' 
                      : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-bl-sm border-slate-200/50 dark:border-slate-800/50'
                  }`}
                >
                  {/* Intent Badge */}
                  {!isUser && msg.intent && msg.intent !== 'unknown' && (
                    <div className="mb-2">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-wider bg-primary/10 text-primary border border-primary/20">
                        {msg.intent.toUpperCase()}
                      </span>
                    </div>
                  )}

                  {/* Message Text */}
                  <p className={`text-[15px] leading-relaxed break-words ${
                    isUrdu ? 'font-urdu' : 'font-sans'
                  }`}>
                    {msg.content}
                  </p>

                  {/* Rich Data Cards */}
                  {!isUser && msg.data?.type === 'products' && renderProductList(msg.data.items)}
                  {!isUser && msg.data?.type === 'bill' && renderBillReceipt(msg.data)}

                  {/* Timestamp */}
                  <div className={`text-[10px] mt-2.5 flex items-center gap-1 justify-end ${
                    isUser ? 'text-white/70' : 'text-slate-400 dark:text-slate-500'
                  }`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {isUser && <Check className="w-3 h-3 inline" />}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Typing Indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex gap-2 flex-row">
              <div className="shrink-0 mt-auto mb-1">
                <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
              </div>
              <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl rounded-bl-sm shadow-sm flex items-center gap-1.5">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white dark:bg-slate-900 p-3 md:p-4 border-t border-slate-200 dark:border-slate-800 z-10 shrink-0 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
        <form onSubmit={handleSend} className="max-w-4xl mx-auto flex items-end gap-2 relative">
          
          <VoiceMicButton onSuccess={handleVoiceSuccess} disabled={isLoading} />
          
          <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-3xl border border-transparent focus-within:border-primary/30 focus-within:bg-white dark:focus-within:bg-slate-900 transition-all shadow-inner overflow-hidden">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e);
                }
              }}
              placeholder="Type a message or use voice..."
              className="w-full max-h-32 bg-transparent border-0 px-4 py-3.5 focus:ring-0 resize-none text-slate-700 dark:text-slate-200 text-[15px] leading-relaxed font-[family-name:var(--font-noto-nastaliq)]"
              rows={1}
              style={{ minHeight: '52px' }}
            />
          </div>

          <button 
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-3 bg-primary text-white rounded-full hover:bg-primary-hover transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-primary/20"
          >
            <Send className="w-5 h-5 ml-1" />
          </button>
        </form>
      </div>
    </div>
  );
}
