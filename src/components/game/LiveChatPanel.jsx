import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Radio } from 'lucide-react';
import { useGameSocket } from '../../context/SocketContext';
import { PlayerAvatar } from '../common/PlayerAvatar';
import { playClick } from '../../utils/sound';

export const LiveChatPanel = ({ isMobileDrawer = false, onCloseMobile }) => {
  const { chatMessages, sendChatMessage, socket } = useGameSocket();
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);
  const myPlayerId = socket?.id;

  // Auto scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    playClick();
    sendChatMessage(inputText);
    setInputText('');
  };

  return (
    <div className={`flex flex-col bg-black/30 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.35)] h-full min-h-0 ${isMobileDrawer ? 'p-3' : 'p-3'}`}>
      {/* Chat Header */}
      <div className="flex items-center justify-between pb-2 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-1.5">
          <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-white/90">
            Live Chat
          </h3>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-1" />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono text-white/50">
            {chatMessages.length} msg{chatMessages.length === 1 ? '' : 's'}
          </span>
          {isMobileDrawer && onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="text-xs font-mono text-white/70 hover:text-white px-2 py-0.5 rounded-lg bg-black/30 border border-white/15 cursor-pointer"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 min-h-0 my-2 text-xs">
        {chatMessages.length === 0 ? (
          <div className="h-full min-h-[100px] flex flex-col items-center justify-center text-center p-3">
            <MessageSquare className="w-6 h-6 text-white/30 mb-1.5 stroke-[1.5]" />
            <p className="text-[11px] text-white/70 font-medium">No chat messages yet.</p>
            <p className="text-[10px] text-white/40">Discuss suspicions or react to drawings!</p>
          </div>
        ) : (
          chatMessages.map((msg) => {
            const isMe = msg.senderId === myPlayerId;
            const timeStr = msg.timestamp
              ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : '';

            return (
              <div
                key={msg.id || `${msg.timestamp}_${msg.senderId}`}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                {/* Sender Info (Only if not self) */}
                {!isMe && (
                  <div className="flex items-center gap-1.5 mb-0.5 px-1">
                    <div className="w-4 h-4 rounded-md overflow-hidden bg-black/40 border border-white/20 shrink-0">
                      <PlayerAvatar avatar={msg.senderAvatar} name={msg.senderName} />
                    </div>
                    <span
                      className="text-[10px] font-semibold truncate max-w-[110px]"
                      style={{ color: msg.senderColor || '#e2e8f0' }}
                    >
                      {msg.senderName}
                    </span>
                    {timeStr && (
                      <span className="text-[9px] text-white/40 font-mono ml-0.5">
                        {timeStr}
                      </span>
                    )}
                  </div>
                )}

                {/* Message Bubble */}
                <div
                  className={`px-3 py-1.5 text-xs break-words max-w-[88%] shadow-sm ${
                    isMe
                      ? 'bg-indigo-600/40 backdrop-blur-md border border-indigo-400/40 text-white rounded-2xl rounded-tr-xs'
                      : 'bg-black/35 backdrop-blur-md border border-white/15 text-white/90 rounded-2xl rounded-tl-xs'
                  }`}
                >
                  <p className="leading-snug">{msg.text}</p>
                  {isMe && timeStr && (
                    <div className="text-[9px] text-indigo-200 font-mono text-right mt-0.5 opacity-75">
                      {timeStr}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <form onSubmit={handleSubmit} className="shrink-0 pt-1 border-t border-white/10">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/30 backdrop-blur border border-white/15 focus-within:border-white/35 transition">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a message..."
            maxLength={150}
            className="flex-1 bg-transparent px-2.5 py-1 text-xs text-white placeholder:text-white/40 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:hover:bg-indigo-600 text-white transition cursor-pointer shrink-0 shadow-sm"
            title="Send chat message"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
};
