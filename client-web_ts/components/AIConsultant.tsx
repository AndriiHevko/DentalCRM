import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User } from 'lucide-react';
import { ChatMessage, Role } from '../types';
import { initializeChat, sendMessageToGemini } from '../services/geminiService';
import { Chat } from '@google/genai';

const AIConsultant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: Role.MODEL,
      text: 'Вітаю! Я AI-асистент клініки Dental. Чим можу допомогти? (Ціни, послуги, запис)',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatInstance = useRef<Chat | null>(null);

  useEffect(() => {
    // Ініціалізація чату при першому рендері
    chatInstance.current = initializeChat();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: Role.USER,
      text: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const responseText = await sendMessageToGemini(userMessage.text, chatInstance.current!);

      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: Role.MODEL,
        text: responseText,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="mb-4 w-[350px] sm:w-[400px] h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-dental-600 to-dental-500 p-4 flex justify-between items-center text-white">
            <div className="flex items-center gap-2">
              <Bot size={20} />
              <div>
                <h3 className="font-semibold text-sm">AI Консультант</h3>
                <p className="text-xs text-dental-100">Онлайн</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-white/20 p-1 rounded transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === Role.USER ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl p-3 text-sm shadow-sm ${msg.role === Role.USER
                    ? 'bg-dental-600 text-white rounded-br-none'
                    : 'bg-white text-gray-700 border border-gray-100 rounded-bl-none'
                    }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                  <span className={`text-[10px] block mt-1 ${msg.role === Role.USER ? 'text-dental-200' : 'text-gray-400'}`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-100 rounded-2xl p-3 rounded-bl-none shadow-sm flex gap-1">
                  <div className="w-2 h-2 bg-dental-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-dental-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-dental-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white border-t border-gray-100 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Запитайте про ціни або послуги..."
              className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-dental-500 focus:border-transparent transition-all"
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="bg-dental-600 hover:bg-dental-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-full w-10 h-10 flex items-center justify-center transition-all shadow-md active:scale-95"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`${isOpen ? 'scale-0' : 'scale-100'} transition-transform duration-300 bg-dental-600 hover:bg-dental-700 text-white p-4 rounded-full shadow-lg hover:shadow-xl flex items-center gap-2 group`}
      >
        <MessageCircle size={28} className="group-hover:animate-pulse" />
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 font-medium whitespace-nowrap">
          Запитати AI
        </span>
      </button>
    </div>
  );
};

export default AIConsultant;