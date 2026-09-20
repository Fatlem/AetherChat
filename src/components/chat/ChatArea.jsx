import React, { useRef, useEffect } from 'react';
import { MessageSquare, Phone, Video, Send } from 'lucide-react';

export default function ChatArea({ 
  activeChat, 
  currentUser, 
  messages = [], 
  newMessage, 
  setNewMessage, 
  handleSendMessage, 
  setShowCall 
}) {
  const messagesEndRef = useRef(null);

  // Auto-scroll ke pesan paling bawah setiap kali pesan diperbarui
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!activeChat) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-950 text-slate-100">
        <div className="w-20 h-20 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
          <MessageSquare className="w-10 h-10" />
        </div>
        <h2 className="text-xl font-bold">Selamat Datang di AetherChat</h2>
        <p className="text-slate-400 text-sm max-w-sm mt-1">
          Pilih obrolan dari sidebar atau cari username teman Anda untuk mulai mengobrol secara langsung!
        </p>
      </div>
    );
  }

  // Fallback URL untuk foto header chat
  const headerPhoto = activeChat.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${activeChat.username || activeChat.id || 'chat'}`;

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-slate-100 h-full overflow-hidden">
      {/* Header Obrolan */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/40 backdrop-blur flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          {activeChat.isChannel ? (
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold flex-shrink-0">
              #
            </div>
          ) : (
            <img 
              src={headerPhoto} 
              alt={activeChat.displayName || activeChat.name} 
              className="w-10 h-10 rounded-full object-cover border border-indigo-500/30 bg-slate-800 flex-shrink-0"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${activeChat.username || 'user'}`;
              }}
            />
          )}
          <div className="min-w-0">
            <h3 className="font-bold text-sm truncate text-white">{activeChat.name || activeChat.displayName}</h3>
            <p className="text-xs text-indigo-400 truncate">
              {activeChat.isChannel ? 'Grup Publik' : `@${activeChat.username || 'user'}`}
            </p>
          </div>
        </div>

        {!activeChat.isChannel && (
          <div className="flex items-center gap-2 flex-shrink-0 ml-2">
            <button 
              onClick={() => setShowCall('voice')} 
              className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-indigo-400 transition"
              title="Panggilan Suara"
            >
              <Phone className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setShowCall('video')} 
              className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-indigo-400 transition"
              title="Panggilan Video"
            >
              <Video className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Area Daftar Pesan */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isMe = msg.senderId === currentUser?.uid;
          const senderName = msg.senderName || 'Pengguna';
          const avatarUrl = msg.senderPhoto || `https://api.dicebear.com/7.x/bottts/svg?seed=${msg.senderUsername || msg.senderId}`;

          return (
            <div key={msg.id} className={`flex items-end gap-2.5 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
              <img 
                src={avatarUrl} 
                alt={senderName} 
                className="w-8 h-8 rounded-full object-cover bg-slate-800 border border-slate-700 flex-shrink-0" 
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${msg.senderUsername || msg.senderId}`;
                }}
              />
              <div className={`max-w-[70%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                {!isMe && (
                  <span className="text-[10px] font-bold text-indigo-400 mb-1 px-1">
                    {senderName}
                  </span>
                )}
                <div 
                  className={`p-3.5 rounded-2xl text-sm leading-relaxed break-words shadow-sm ${
                    isMe 
                      ? 'bg-indigo-600 text-white rounded-br-none' 
                      : 'bg-slate-800/80 text-slate-100 rounded-bl-none border border-slate-700/50'
                  }`}
                >
                  <p>{msg.text}</p>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Form Input Pesan */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-800 bg-slate-900/40 flex-shrink-0">
        <div className="flex items-center gap-2">
          <input 
            type="text" 
            placeholder="Ketik pesan di sini..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1 bg-slate-800/60 border border-slate-700/60 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
          />
          <button 
            type="submit" 
            disabled={!newMessage.trim()}
            className="p-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-xl shadow-lg shadow-indigo-600/30 transition flex-shrink-0"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}