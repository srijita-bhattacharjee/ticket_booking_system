'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bot,
  MessageSquare,
  X,
  Send,
  Sparkles,
  Trash2,
  Ticket,
  Calendar,
  MapPin,
  ChevronRight,
  User,
  Loader2,
} from 'lucide-react';
import { chatbotService } from '../services/api';

export interface EventCardData {
  id: string;
  title: string;
  eventType: string;
  eventDate: string;
  startTime: string;
  venueName: string;
  minPrice: number;
  imageUrl?: string | null;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  eventCards?: EventCardData[];
  quickReplies?: string[];
  timestamp: string;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'welcome-1',
    sender: 'bot',
    text: `👋 **Hi there! I'm TicketBot.**\n\nI can help you search live events, check active bookings, view food coupons, and answer questions about seat reservations!`,
    quickReplies: ['🎭 Upcoming Events', '🍕 Food Coupons', '⏱️ Seat Hold Info'],
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  },
];

export default function ChatbotWidget() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (customMessage?: string) => {
    const textToSend = (customMessage || input).trim();
    if (!textToSend || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customMessage) setInput('');
    setIsLoading(true);

    try {
      const res = await chatbotService.query(textToSend);
      const data = res.data;

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: data.reply || "I've processed your query.",
        eventCards: data.eventCards,
        quickReplies: data.quickReplies,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: `bot-err-${Date.now()}`,
        sender: 'bot',
        text: '❌ Oops! I ran into an issue processing your query. Please try again.',
        quickReplies: ['🎭 Upcoming Events', '⏱️ Seat Hold Info'],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    setMessages(INITIAL_MESSAGES);
  };

  const renderFormattedText = (text: string) => {
    // Replace **bold** with bold spans, preserve line breaks
    const lines = text.split('\n');
    return lines.map((line, lIdx) => {
      const parts = line.split(/(\*\*.*?\*\*|\`.*?\`)/g);
      return (
        <React.Fragment key={lIdx}>
          {parts.map((part, pIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return (
                <strong key={pIdx} className="font-semibold text-slate-100">
                  {part.slice(2, -2)}
                </strong>
              );
            }
            if (part.startsWith('`') && part.endsWith('`')) {
              return (
                <code key={pIdx} className="bg-slate-800 text-indigo-300 px-1.5 py-0.5 rounded text-xs font-mono">
                  {part.slice(1, -1)}
                </code>
              );
            }
            return part;
          })}
          {lIdx < lines.length - 1 && <br />}
        </React.Fragment>
      );
    });
  };

  return (
    <>
      {/* Floating Launcher Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white px-4 py-3.5 rounded-full shadow-2xl hover:scale-105 transition-all duration-300 group border border-indigo-400/30"
          aria-label="Open TicketBot Chat"
        >
          <div className="relative flex items-center justify-center">
            <Bot className="w-6 h-6 animate-pulse text-indigo-100" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-900 animate-ping" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-900" />
          </div>
          <span className="font-semibold text-sm tracking-wide hidden sm:inline text-white">Ask TicketBot</span>
          <Sparkles className="w-4 h-4 text-amber-300 group-hover:rotate-12 transition-transform" />
        </button>
      )}

      {/* Chat Window Drawer */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[420 h] max-w-[420px] h-[580px] max-h-[85vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5 bg-slate-800/90 border-b border-slate-700/80">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-md border border-indigo-400/30">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-100 text-sm">TicketBot Assistant</h3>
                  <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full font-medium border border-emerald-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Online
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">AI Ticket & Discovery Guide</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleClearHistory}
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-700/60 rounded-lg transition-colors"
                title="Clear Chat History"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-700/60 rounded-lg transition-colors"
                title="Close Chat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Message Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm text-slate-200 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'bot' && (
                  <div className="w-7 h-7 rounded-lg bg-indigo-600/80 flex items-center justify-center flex-shrink-0 mt-1 border border-indigo-400/30 shadow-sm">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}

                <div className={`max-w-[85%] space-y-2`}>
                  {/* Bubble */}
                  <div
                    className={`px-3.5 py-2.5 rounded-2xl ${
                      msg.sender === 'user'
                        ? 'bg-indigo-600 text-white rounded-tr-none shadow-md'
                        : 'bg-slate-800/90 text-slate-200 border border-slate-700/70 rounded-tl-none shadow-sm'
                    }`}
                  >
                    <div className="leading-relaxed text-xs sm:text-sm">
                      {renderFormattedText(msg.text)}
                    </div>
                    <div
                      className={`text-[10px] mt-1.5 text-right ${
                        msg.sender === 'user' ? 'text-indigo-200' : 'text-slate-400'
                      }`}
                    >
                      {msg.timestamp}
                    </div>
                  </div>

                  {/* Event Cards Carousel / Grid */}
                  {msg.eventCards && msg.eventCards.length > 0 && (
                    <div className="space-y-2 mt-2">
                      <p className="text-[11px] font-semibold text-indigo-400 flex items-center gap-1 uppercase tracking-wider">
                        <Ticket className="w-3.5 h-3.5" /> Recommended Events
                      </p>
                      <div className="grid grid-cols-1 gap-2">
                        {msg.eventCards.map((card) => (
                          <div
                            key={card.id}
                            className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-3 hover:border-indigo-500/60 transition-all duration-200 flex flex-col justify-between group shadow-sm"
                          >
                            <div className="flex gap-3">
                              {card.imageUrl ? (
                                <img
                                  src={card.imageUrl}
                                  alt={card.title}
                                  className="w-14 h-14 rounded-lg object-cover bg-slate-700 flex-shrink-0"
                                />
                              ) : (
                                <div className="w-14 h-14 rounded-lg bg-indigo-900/50 border border-indigo-500/30 flex items-center justify-center flex-shrink-0 text-indigo-300">
                                  <Ticket className="w-6 h-6" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-800/50 mb-1">
                                  {card.eventType}
                                </span>
                                <h4 className="font-semibold text-slate-100 text-xs truncate group-hover:text-indigo-300 transition-colors">
                                  {card.title}
                                </h4>
                                <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3 text-slate-500" />
                                    {new Date(card.eventDate).toLocaleDateString([], {
                                      month: 'short',
                                      day: 'numeric',
                                    })}
                                  </span>
                                  <span>•</span>
                                  <span className="flex items-center gap-1 truncate">
                                    <MapPin className="w-3 h-3 text-slate-500 flex-shrink-0" />
                                    <span className="truncate">{card.venueName}</span>
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-700/50 text-xs">
                              <span className="text-slate-300 text-[11px]">
                                From <strong className="text-emerald-400 font-bold">${card.minPrice}</strong>
                              </span>
                              <button
                                onClick={() => {
                                  setIsOpen(false);
                                  router.push(`/events/${card.id}`);
                                }}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white px-2.5 py-1 rounded-lg font-medium text-[11px] flex items-center gap-1 transition-colors shadow-sm"
                              >
                                Book Now
                                <ChevronRight className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quick Action Replies */}
                  {msg.quickReplies && msg.quickReplies.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {msg.quickReplies.map((replyText, rIdx) => (
                        <button
                          key={rIdx}
                          onClick={() => handleSendMessage(replyText)}
                          className="text-[11px] bg-slate-800 hover:bg-indigo-900/60 text-slate-300 hover:text-indigo-200 border border-slate-700/80 hover:border-indigo-500/50 px-2.5 py-1 rounded-full transition-all duration-200 text-left"
                        >
                          {replyText}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {msg.sender === 'user' && (
                  <div className="w-7 h-7 rounded-lg bg-slate-700 flex items-center justify-center flex-shrink-0 mt-1 border border-slate-600">
                    <User className="w-4 h-4 text-slate-300" />
                  </div>
                )}
              </div>
            ))}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex gap-2.5 justify-start items-center text-slate-400 text-xs">
                <div className="w-7 h-7 rounded-lg bg-indigo-600/80 flex items-center justify-center flex-shrink-0 border border-indigo-400/30">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-slate-800/90 px-3.5 py-2.5 rounded-2xl rounded-tl-none border border-slate-700/70 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                  <span>TicketBot is thinking...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts bar (Sticky above input) */}
          <div className="px-3 py-1.5 bg-slate-800/40 border-t border-slate-800 flex gap-2 overflow-x-auto no-scrollbar text-[11px]">
            <button
              onClick={() => handleSendMessage('Show me upcoming concerts')}
              className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 whitespace-nowrap transition-colors"
            >
              🎵 Concerts
            </button>
            <button
              onClick={() => handleSendMessage('Show active food coupons')}
              className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 whitespace-nowrap transition-colors"
            >
              🍕 Food Coupons
            </button>
            <button
              onClick={() => handleSendMessage('How does seat holding work?')}
              className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 whitespace-nowrap transition-colors"
            >
              ⏱️ Hold Info
            </button>
          </div>

          {/* Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-slate-800/90 border-t border-slate-700/80 flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about events, bookings, deals..."
              disabled={isLoading}
              className="flex-1 bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 text-xs sm:text-sm px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white p-2.5 rounded-xl transition-colors flex items-center justify-center shadow-sm"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
