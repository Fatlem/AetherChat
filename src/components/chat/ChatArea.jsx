import React from 'react';
import { MessageSquare, Phone, Video, Send } from 'lucide-react';

export default function ChatArea({ 
  activeChat, 
  currentUser, 
  messages, 
  newMessage, 
  setNewMessage, 
  handleSendMessage, 
  setShowCall 
}) {
  if (!activeChat) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-950">
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

  return (
    <div className="flex-1 flex flex-col bg-slate-950">
      <div className="p-4 border-b border-slate-800 bg-slate-900/40 backdrop-blur flex items-center justify-between">
        <div className="flex items-center gap-3">
          {activeChat.isChannel ? (
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold">
              #
            </div>
          ) : (
            <img src={activeChat.photoURL} alt={activeChat.displayName} className="w-10 h-10 rounded-full object-cover" />
          )}
          <div>
            <h3 className="font-bold text-sm">{activeChat.name || activeChat.displayName}</h3>
            <p className="text-xs text-indigo-400">
              {activeChat.isChannel ? 'Grup Publik' : `@${activeChat.username}`}
            </p>
          </div>
        </div>

        {!activeChat.isChannel && (
          <div className="flex items-center gap-2">
            <button onClick={() => setShowCall('voice')} className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-indigo-400 transition">
              <Phone className="w-5 h-5" />
            </button>
            <button onClick={() => setShowCall('video')} className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-indigo-400 transition">
              <Video className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isMe = msg.senderId === currentUser.uid;
          return (
            <div key={msg.id} className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
              <img src={msg.senderPhoto} alt="Avatar" className="w-7 h-7 rounded-full object-cover" />
              <div className={`max-w-md p-3.5 rounded-2xl text-sm ${isMe ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-slate-800/80 text-slate-100 rounded-bl-none border border-slate-700/50'}`}>
                {!isMe && <p className="text-[10px] font-bold text-indigo-400 mb-1">{msg.senderName}</p>}
                <p className="leading-relaxed">{msg.text}</p>
              </div>
            </div>
          );
        })}
      </div>

      <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-800 bg-slate-900/40">
        <div className="flex items-center gap-2">
          <input 
            type="text" 
            placeholder="Ketik pesan di sini..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1 bg-slate-800/60 border border-slate-700/60 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition"
          />
          <button type="submit" className="p-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-600/30 transition">
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}