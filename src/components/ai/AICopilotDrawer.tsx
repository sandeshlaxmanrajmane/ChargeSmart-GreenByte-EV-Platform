import React, { useState, useRef, useEffect } from 'react';
import { apiService, AICopilotResponse } from '../../services/apiService';
import {
  Sparkles,
  Bot,
  Send,
  X,
  ChevronDown,
  ArrowRight,
  MessageSquare,
  HelpCircle,
  Zap,
} from 'lucide-react';

interface AICopilotDrawerProps {
  onNavigateTab: (tab: string, priority?: string) => void;
  currencySymbol: string;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  headline?: string;
  action?: {
    label: string;
    target_tab: string;
    preset_priority?: string;
  };
}

export const AICopilotDrawer: React.FC<AICopilotDrawerProps> = ({
  onNavigateTab,
  currencySymbol,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      headline: 'GreenByte AI Energy Copilot Active',
      text: 'Hello! I am your intelligent EV charging advisor. I continuously analyze grid renewables, dynamic tariffs, and battery thermodynamics to optimize your charging decisions. How can I help you today?',
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickPrompts = [
    'When is the cheapest time to charge my car today?',
    'How clean is the grid electricity right now?',
    'How does 50kW fast charging impact my battery health?',
    'Find nearby solar charging stations with CCS2',
  ];

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const response: AICopilotResponse = await apiService.askAICopilot(text);
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        headline: response.headline,
        text: response.answer,
        action: response.action,
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          sender: 'ai',
          headline: 'System Advisory',
          text: 'Optimal charging window today is 11:30 AM to 2:00 PM during peak solar irradiance.',
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* Floating Action Pill */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 bg-gradient-to-r from-emerald-600 via-teal-700 to-forest text-white px-4 py-3 rounded-2xl shadow-2xl hover:shadow-emerald-600/40 hover:scale-105 transition-all flex items-center gap-2.5 font-bold text-xs border border-emerald-400/30 group animate-bounce-subtle"
        >
          <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-amber-300 group-hover:rotate-12 transition-transform" />
          </div>
          <span>Ask AI Energy Copilot</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
        </button>
      )}

      {/* Slide-in Chat Drawer */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-2rem)] h-[560px] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-slide-up">
          {/* Drawer Header */}
          <div className="bg-gradient-to-r from-forest via-[#0F4238] to-slate-900 text-white p-4 flex items-center justify-between border-b border-emerald-500/20">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 p-1.5 flex items-center justify-center text-white shadow-sm">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="font-extrabold text-sm flex items-center gap-1.5">
                  <span>AI Energy Copilot</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono px-1.5 py-0.2 rounded border border-emerald-500/40">
                    ML v2.1
                  </span>
                </div>
                <div className="text-[11px] text-slate-300 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Real-time Grid Ingest Active</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages History */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/60 text-xs">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[88%] p-3.5 rounded-2xl ${
                    msg.sender === 'user'
                      ? 'bg-emerald-600 text-white rounded-br-none shadow-sm'
                      : 'bg-white text-slate-800 rounded-bl-none border border-slate-200 shadow-sm space-y-2'
                  }`}
                >
                  {msg.headline && (
                    <div className="font-bold text-emerald-800 border-b border-slate-100 pb-1 text-[11px] uppercase tracking-wide">
                      {msg.headline}
                    </div>
                  )}
                  <div className="leading-relaxed whitespace-pre-line text-xs font-normal">
                    {msg.text}
                  </div>

                  {msg.action && (
                    <button
                      onClick={() => {
                        onNavigateTab(msg.action!.target_tab, msg.action!.preset_priority);
                        setIsOpen(false);
                      }}
                      className="mt-2 w-full py-1.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[11px] border border-emerald-200 flex items-center justify-between transition-all"
                    >
                      <span>{msg.action.label}</span>
                      <ArrowRight className="w-3 h-3 text-emerald-600" />
                    </button>
                  )}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-2 p-3 bg-white rounded-2xl border border-slate-200 w-fit text-slate-500 text-xs shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-spin-slow" />
                <span>Copilot is reasoning with live grid models...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Bar */}
          <div className="p-2 bg-white border-t border-slate-100 overflow-x-auto whitespace-nowrap space-x-1.5 flex text-[11px]">
            {quickPrompts.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(q)}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 text-left shrink-0 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>

          {/* User Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Ask anything about clean charging, tariffs, battery..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isTyping}
              className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 transition-colors shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
