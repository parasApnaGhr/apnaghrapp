import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Send, X, Home, MapPin, Sparkles, Bot, User, ChevronRight, Plus, Trash2 } from 'lucide-react';
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

  // Start new session when chat opens
  const startNewSession = async () => {
    try {
      const response = await chatbotAPI.newSession();
      setSessionId(response.data.session_id);
      setMessages([{
        role: 'assistant',
        content: response.data.message || "Namaste! 🏠 I'm your ApnaGhr assistant. Tell me about your dream home - what's your budget, preferred location, or BHK type?",
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
        content: 'Oops! Something went wrong. Please try again.',
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
      {/* Floating Chat Button */}
      <motion.button
        data-testid="chatbot-toggle-btn"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-24 right-6 z-50 w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-brutal-lg flex items-center justify-center border-3 border-black"
        whileHover={{ scale: 1.1, rotate: 5 }}
        whileTap={{ scale: 0.95 }}
        style={{ boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)' }}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
            >
              <X className="w-7 h-7 text-black" />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              className="relative"
            >
              <Bot className="w-7 h-7 text-black" />
              <motion.span
                className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-black"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            data-testid="chatbot-window"
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            className="fixed bottom-44 right-6 z-50 w-96 h-[500px] max-h-[70vh] bg-white rounded-2xl border-3 border-black overflow-hidden flex flex-col"
            style={{ boxShadow: '8px 8px 0px 0px rgba(0,0,0,1)' }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-400 to-orange-500 p-4 border-b-3 border-black">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <motion.div
                    className="w-10 h-10 bg-white rounded-full border-2 border-black flex items-center justify-center"
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                  >
                    <Sparkles className="w-5 h-5 text-amber-500" />
                  </motion.div>
                  <div>
                    <h3 className="font-black text-lg text-black">ApnaGhr AI</h3>
                    <p className="text-xs font-bold text-black/70">Your Property Assistant</p>
                  </div>
                </div>
                <button
                  data-testid="new-chat-btn"
                  onClick={startNewSession}
                  className="p-2 hover:bg-black/10 rounded-lg transition-colors"
                  title="New Chat"
                >
                  <Plus className="w-5 h-5 text-black" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-start gap-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full border-2 border-black flex items-center justify-center flex-shrink-0 ${
                      msg.role === 'user' ? 'bg-blue-400' : 'bg-amber-400'
                    }`}>
                      {msg.role === 'user' ? (
                        <User className="w-4 h-4 text-black" />
                      ) : (
                        <Bot className="w-4 h-4 text-black" />
                      )}
                    </div>
                    <div className={`rounded-2xl p-3 border-2 border-black ${
                      msg.role === 'user' 
                        ? 'bg-blue-400 text-black' 
                        : 'bg-white text-black'
                    }`}
                      style={{ boxShadow: '3px 3px 0px 0px rgba(0,0,0,1)' }}
                    >
                      <p className="text-sm font-medium whitespace-pre-wrap">{msg.content}</p>
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
                  <div className="w-8 h-8 rounded-full bg-amber-400 border-2 border-black flex items-center justify-center">
                    <Bot className="w-4 h-4 text-black" />
                  </div>
                  <div className="bg-white rounded-2xl p-3 border-2 border-black" style={{ boxShadow: '3px 3px 0px 0px rgba(0,0,0,1)' }}>
                    <motion.div className="flex gap-1">
                      {[0, 1, 2].map(i => (
                        <motion.span
                          key={i}
                          className="w-2 h-2 bg-amber-400 rounded-full"
                          animate={{ y: [0, -6, 0] }}
                          transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.1 }}
                        />
                      ))}
                    </motion.div>
                  </div>
                </motion.div>
              )}

              {/* Property Cards */}
              {showPropertyCards.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3 mt-4"
                >
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Recommended Properties</p>
                  {showPropertyCards.map((property, idx) => (
                    <motion.div
                      key={property.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      data-testid={`property-card-${property.id}`}
                      className="bg-white rounded-xl border-2 border-black overflow-hidden cursor-pointer hover:translate-x-1 hover:-translate-y-1 transition-transform"
                      style={{ boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)' }}
                      onClick={() => window.open(`/property/${property.id}`, '_blank')}
                    >
                      <div className="flex">
                        {property.images?.[0] && (
                          <img
                            src={getMediaUrl(property.images[0])}
                            alt={property.title}
                            className="w-20 h-20 object-cover border-r-2 border-black"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80';
                            }}
                          />
                        )}
                        <div className="flex-1 p-3">
                          <h4 className="font-bold text-sm truncate">{property.title}</h4>
                          <div className="flex items-center gap-1 text-xs text-gray-600 mt-1">
                            <MapPin className="w-3 h-3" />
                            <span className="truncate">{property.location}</span>
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <span className="font-black text-green-600">₹{property.rent?.toLocaleString()}/mo</span>
                            <ChevronRight className="w-4 h-4 text-gray-400" />
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
              <div className="px-4 py-2 border-t-2 border-black bg-gray-100">
                <p className="text-xs font-bold text-gray-500 mb-2">Quick Start:</p>
                <div className="flex flex-wrap gap-2">
                  {quickPrompts.map((prompt, idx) => (
                    <motion.button
                      key={idx}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setInput(prompt);
                        setTimeout(() => handleSendMessage(), 100);
                      }}
                      className="px-3 py-1 bg-white rounded-full border-2 border-black text-xs font-bold hover:bg-amber-100 transition-colors"
                      style={{ boxShadow: '2px 2px 0px 0px rgba(0,0,0,1)' }}
                    >
                      {prompt}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Area */}
            <div className="p-4 border-t-3 border-black bg-white">
              <div className="flex gap-2">
                <input
                  data-testid="chatbot-input"
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Tell me about your ideal home..."
                  className="flex-1 px-4 py-3 rounded-xl border-2 border-black font-medium text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  style={{ boxShadow: '3px 3px 0px 0px rgba(0,0,0,0.1)' }}
                  disabled={isLoading}
                />
                <motion.button
                  data-testid="chatbot-send-btn"
                  onClick={handleSendMessage}
                  disabled={!input.trim() || isLoading}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl border-2 border-black flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ boxShadow: '3px 3px 0px 0px rgba(0,0,0,1)' }}
                >
                  <Send className="w-5 h-5 text-black" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIChatbot;
