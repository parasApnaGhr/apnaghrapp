// @ts-nocheck
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, X } from 'lucide-react';
import { chatAPI } from '../utils/api';
import { toast } from 'sonner';

const ChatWindow = ({ otherUserId, otherUserName, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  const loadMessages = useCallback(async () => {
    try {
      const response = await chatAPI.getMessages(otherUserId);
      setMessages(response.data);
    } catch (error) {
      console.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [otherUserId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [loadMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      await chatAPI.sendMessage({
        receiver_id: otherUserId,
        message: newMessage,
      });
      setNewMessage('');
      loadMessages();
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  return (
    <div className="fixed bottom-4 right-4 w-96 h-[500px] bg-white rounded-xl border border-[var(--stitch-line)] shadow-xl flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[var(--stitch-line)]">
        <div>
          <h3 className="font-bold">{otherUserName}</h3>
          <p className="text-xs text-[var(--stitch-muted)]">Online</p>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-[#F3F2EB] rounded-lg"
          data-testid="close-chat"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-[var(--stitch-ink)] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-sm text-[var(--stitch-muted)]">Loading...</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-[var(--stitch-muted)]">No messages yet</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isCurrentUser = msg.sender_id !== otherUserId;
            return (
              <div
                key={idx}
                className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    isCurrentUser
                      ? 'bg-[var(--stitch-ink)] text-white'
                      : 'bg-[#F3F2EB] text-[var(--stitch-ink)]'
                  }`}
                >
                  <p className="text-sm">{msg.message}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {new Date(msg.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 border-t border-[var(--stitch-line)]">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 input-field py-2"
            data-testid="chat-input"
          />
          <button
            type="submit"
            className="stitch-button px-4 py-2"
            data-testid="send-message"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatWindow;
