import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Radio, X } from 'lucide-react';
import { useGameSocket } from '../../context/SocketContext';
import { PlayerAvatar } from '../common/PlayerAvatar';
import { playClick } from '../../utils/sound';

export const LiveChatPanel = ({ isMobileDrawer = false, onCloseMobile }) => {
  const { chatMessages, sendChatMessage, socket } = useGameSocket();
  const [inputText, setInputText] = useState('');
  const messagesContainerRef = useRef(null);
  const myPlayerId = socket?.id;

  // Auto scroll to latest message using direct scrollTop — no scrollIntoView to prevent ancestor jitter
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    // Use rAF to ensure DOM has painted the new message before scrolling
    requestAnimationFrame(() => {
      container.scrollTop = container.scrollHeight;
    });
  }, [chatMessages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    playClick();
    sendChatMessage(inputText);
    setInputText('');
  };

  return (
    <div
      className={`flex flex-col bg-black/40 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-lg overflow-hidden ${isMobileDrawer ? 'p-3' : 'p-3'}`}
      style={{ height: '100%', minHeight: 0, maxHeight: '100%' }}
    >
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
              className="flex items-center gap-1 text-xs font-mono text-white/80 hover:text-white px-2 py-0.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 cursor-pointer shadow-sm active:scale-95 transition"
            >
              <X className="w-3 h-3" />
              <span>Close</span>
            </button>
          )}
        </div>
      </div>

      {/* Messages Scroll Area — contained via position:relative parent + absolute child so it NEVER pushes layout */}
      <div className="flex-1 min-h-0 relative" style={{ overflow: 'hidden' }}>
        <div
          ref={messagesContainerRef}
          className="absolute inset-0 overflow-y-auto overflow-x-hidden pr-1 space-y-2 py-2 text-xs"
          style={{ overscrollBehavior: 'contain' }}
        >
          {chatMessages.length === 0 ? (
            <div className="h-full min-h-[80px] flex flex-col items-center justify-center text-center p-3">
              <MessageSquare className="w-6 h-6 text-white/20 mb-1.5 stroke-[1.5]" />
              <p className="text-[11px] text-white/50 font-medium">No messages yet</p>
              <p className="text-[10px] text-white/30">Discuss suspicions here!</p>
            </div>
          ) : (
            chatMessages.map((msg) => {
              const isMe = msg.senderId === myPlayerId;

              return (
                <div
                  key={msg.id || `${msg.timestamp}_${msg.senderId}`}
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-1.5 max-w-[88%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                    {/* Avatar — only for others */}
                    {!isMe && (
                      <div className="w-5 h-5 rounded-lg overflow-hidden bg-black/40 border border-white/15 shrink-0 mt-0.5">
                        <PlayerAvatar avatar={msg.senderAvatar} name={msg.senderName} />
                      </div>
                    )}

                    {/* Bubble */}
                    <div className="flex flex-col gap-0.5">
                      {/* Name — only for others */}
                      {!isMe && (
                        <span
                          className="text-[10px] font-semibold truncate max-w-[100px] px-0.5 leading-none"
                          style={{ color: msg.senderColor || '#94a3b8' }}
                        >
                          {msg.senderName}
                        </span>
                      )}

                      {/* Message bubble */}
                      <div
                        className={`px-3 py-1.5 text-[11px] break-words leading-relaxed ${
                          isMe
                            ? 'bg-gradient-to-br from-indigo-500/50 to-violet-600/40 border border-indigo-400/30 text-white rounded-2xl rounded-tr-md shadow-md shadow-indigo-900/20'
                            : 'bg-white/8 border border-white/10 text-white/90 rounded-2xl rounded-tl-md'
                        }`}
                      >
                        <p className="leading-snug">{msg.text}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Input Box */}
      <form onSubmit={handleSubmit} className="shrink-0 pt-1.5 border-t border-white/10">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/30 backdrop-blur border border-white/15 focus-within:border-indigo-400/40 transition">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a message..."
            maxLength={150}
            className="flex-1 bg-transparent px-2.5 py-1 text-xs text-white placeholder:text-white/35 focus:outline-none"
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
