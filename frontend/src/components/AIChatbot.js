import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Send, X, Home, MapPin, Sparkles, Bot, User, ChevronRight, Plus } from 'lucide-react';
import { chatbotAPI, getMediaUrl } from '../utils/api';

const AIChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [showPropertyCards, setShowPropertyCards] = useState([]);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const startNewSession = async () => {
    try {
      const response = await chatbotAPI.newSession();
      setSessionId(response.data.session_id);
      setMessages([{
        role: 'assistant',
        content: response.data.message || "Welcome to ApnaGhr. I'm here to help you find your perfect home. What's your budget, preferred location, or property type?",
        timestamp: new Date()
      }]);
      setShowPropertyCards([]);
    } catch (error) {
      console.error('Failed to start session:', error);
    }
  };

  useEffect(() => {
    if (isOpen && !sessionId) {
      startNewSession();
    }
  }, [isOpen, sessionId]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await chatbotAPI.sendMessage(sessionId, userMessage.content);
      
      const assistantMessage = {
        role: 'assistant',
        content: response.data.response,
        timestamp: new Date(),
        properties: response.data.properties
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      if (response.data.properties) {
        setShowPropertyCards(response.data.properties);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'I apologize, something went wrong. Please try again.',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickPrompts = [
    "2BHK under ₹15,000",
    "Furnished flat near metro",
    "Family-friendly 3BHK",
    "Pet-friendly apartments"
  ];

  return (
    <>
      {/* Floating Chat Button - Premium Design with Breathing Glow */}
      <motion.button
        data-testid="chatbot-toggle-btn"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-24 right-6 z-50 w-14 h-14 bg-[#04473C] shadow-xl flex items-center justify-center group breathe-glow"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
            >
              <X className="w-6 h-6 text-white" strokeWidth={1.5} />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              className="relative"
            >
              <MessageCircle className="w-6 h-6 text-white" strokeWidth={1.5} />
              <motion.span
                className="absolute -top-1 -right-1 w-3 h-3 bg-[#C6A87C] rounded-full"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              />
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Tooltip - only shows when chat is closed */}
        {!isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 2 }}
            className="absolute right-full mr-3 bg-white px-3 py-2 text-sm text-[#1A1C20] whitespace-nowrap border border-[#E5E1DB] shadow-lg hidden group-hover:block"
          >
            <span className="text-[#C6A87C] font-medium">AI</span> Property Assistant
            <div className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-3 bg-white border-r border-b border-[#E5E1DB] rotate-[-45deg]" />
          </motion.div>
        )}
      </motion.button>

      {/* Chat Window - Premium Design */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            data-testid="chatbot-window"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-44 right-6 z-50 w-96 h-[500px] max-h-[70vh] bg-white border border-[#E5E1DB] overflow-hidden flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="bg-[#04473C] p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/10 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-[#C6A87C]" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="font-medium text-white" style={{ fontFamily: 'Playfair Display, serif' }}>ApnaGhr AI</h3>
                    <p className="text-xs text-white/60">Property Assistant</p>
                  </div>
                </div>
                <button
                  data-testid="new-chat-btn"
                  onClick={startNewSession}
                  className="p-2 hover:bg-white/10 transition-colors"
                  title="New Chat"
                >
                  <Plus className="w-5 h-5 text-white" strokeWidth={1.5} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#FDFCFB]">
              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-start gap-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-7 h-7 flex items-center justify-center flex-shrink-0 ${
                      msg.role === 'user' ? 'bg-[#04473C]' : 'bg-[#C6A87C]'
                    }`}>
                      {msg.role === 'user' ? (
                        <User className="w-4 h-4 text-white" strokeWidth={1.5} />
                      ) : (
                        <Bot className="w-4 h-4 text-[#1A1C20]" strokeWidth={1.5} />
                      )}
                    </div>
                    <div className={`p-3 ${
                      msg.role === 'user' 
                        ? 'bg-[#04473C] text-white' 
                        : 'bg-white border border-[#E5E1DB] text-[#1A1C20]'
                    }`}>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* Loading Indicator */}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2"
                >
                  <div className="w-7 h-7 bg-[#C6A87C] flex items-center justify-center">
                    <Bot className="w-4 h-4 text-[#1A1C20]" strokeWidth={1.5} />
                  </div>
                  <div className="bg-white border border-[#E5E1DB] p-3">
                    <div className="flex gap-1">
                      {[0, 1, 2].map(i => (
                        <motion.span
                          key={i}
                          className="w-2 h-2 bg-[#04473C] rounded-full"
                          animate={{ y: [0, -4, 0] }}
                          transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.1 }}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Property Cards */}
              {showPropertyCards.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3 mt-4"
                >
                  <p className="text-xs font-medium tracking-wide uppercase text-[#4A4D53]">Recommended Properties</p>
                  {showPropertyCards.map((property, idx) => (
                    <motion.div
                      key={property.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      data-testid={`property-card-${property.id}`}
                      className="bg-white border border-[#E5E1DB] overflow-hidden cursor-pointer hover:-translate-y-1 hover:shadow-lg transition-all"
                      onClick={() => window.open(`/property/${property.id}`, '_blank')}
                    >
                      <div className="flex">
                        {property.images?.[0] && (
                          <img
                            src={getMediaUrl(property.images[0])}
                            alt={property.title}
                            className="w-20 h-20 object-cover border-r border-[#E5E1DB]"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80';
                            }}
                          />
                        )}
                        <div className="flex-1 p-3">
                          <h4 className="font-medium text-sm truncate text-[#1A1C20]">{property.title}</h4>
                          <div className="flex items-center gap-1 text-xs text-[#4A4D53] mt-1">
                            <MapPin className="w-3 h-3" strokeWidth={1.5} />
                            <span className="truncate">{property.location}</span>
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <span className="price-display text-sm">
                              <span className="price-currency text-xs">₹</span>
                              {property.rent?.toLocaleString('en-IN')}
                              <span className="text-[#4A4D53] text-xs font-normal">/mo</span>
                            </span>
                            <ChevronRight className="w-4 h-4 text-[#D0C9C0]" strokeWidth={1.5} />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Prompts */}
            {messages.length <= 1 && (
              <div className="px-4 py-3 border-t border-[#E5E1DB] bg-[#F5F3F0]">
                <p className="text-xs font-medium tracking-wide uppercase text-[#4A4D53] mb-2">Quick Start</p>
                <div className="flex flex-wrap gap-2">
                  {quickPrompts.map((prompt, idx) => (
                    <motion.button
                      key={idx}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setInput(prompt);
                        setTimeout(() => handleSendMessage(), 100);
                      }}
                      className="px-3 py-1.5 bg-white border border-[#E5E1DB] text-xs font-medium text-[#1A1C20] hover:border-[#04473C] transition-colors"
                    >
                      {prompt}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Area */}
            <div className="p-4 border-t border-[#E5E1DB] bg-white">
              <div className="flex gap-3">
                <input
                  data-testid="chatbot-input"
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Describe your ideal home..."
                  className="flex-1 px-4 py-3 border border-[#E5E1DB] text-sm focus:outline-none focus:border-[#04473C] transition-colors"
                  disabled={isLoading}
                />
                <button
                  data-testid="chatbot-send-btn"
                  onClick={handleSendMessage}
                  disabled={!input.trim() || isLoading}
                  className="w-12 h-12 bg-[#04473C] flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#03352D] transition-colors"
                >
                  <Send className="w-5 h-5 text-white" strokeWidth={1.5} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIChatbot;
