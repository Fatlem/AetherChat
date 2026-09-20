import React, { useRef, useEffect, useState } from 'react';
import { MessageSquare, Phone, Video, Send, UserPlus, Check, CheckCheck } from 'lucide-react';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../../config/firebase';

export default function ChatArea({ 
  activeChat, 
  currentUser, 
  userProfile,
  messages = [], 
  newMessage, 
  setNewMessage, 
  handleSendMessage, 
  setShowCall 
}) {
  const messagesEndRef = useRef(null);
  const [selectedUserModal, setSelectedUserModal] = useState(null);
  const [sendingRequest, setSendingRequest] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState(false);

  // Auto-scroll ke pesan terbaru
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Buka profil user saat diklik di obrolan
  const handleUserClick = async (senderId, fallbackName) => {
    if (senderId === currentUser?.uid) return; // Abaikan jika mengklik profil sendiri

    try {
      const userDoc = await getDoc(doc(db, "users", senderId));
      if (userDoc.exists()) {
        setSelectedUserModal(userDoc.data());
      } else {
        setSelectedUserModal({
          uid: senderId,
          displayName: fallbackName || 'Pengguna',
          username: 'user',
          photoURL: `https://api.dicebear.com/7.x/bottts/svg?seed=${senderId}`
        });
      }
    } catch (err) {
      console.error("Gagal mengambil data user:", err);
    }
  };

  // Kirim Permintaan Pertemanan (Masuk ke Notifikasi Lonceng Lawan Bicara)
  const handleSendFriendRequest = async () => {
    if (!selectedUserModal || !currentUser) return;
    setSendingRequest(true);

    try {
      const targetUserRef = doc(db, "users", selectedUserModal.uid);
      await updateDoc(targetUserRef, {
        friendRequests: arrayUnion(currentUser.uid)
      });

      setRequestSuccess(true);
      setTimeout(() => {
        setSelectedUserModal(null);
        setRequestSuccess(false);
      }, 1500);
    } catch (err) {
      console.error("Gagal mengirim permintaan pertemanan:", err);
    } finally {
      setSendingRequest(false);
    }
  };

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

  const isAlreadyFriend = userProfile?.friends?.includes(selectedUserModal?.uid);

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-slate-100 h-full overflow-hidden relative">
      {/* Header Obrolan */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/40 backdrop-blur flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          {activeChat.isChannel ? (
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold flex-shrink-0">
              #
            </div>
          ) : (
            <img 
              src={activeChat.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${activeChat.username || 'user'}`} 
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
            <button onClick={() => setShowCall('voice')} className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-indigo-400 transition" title="Panggilan Suara">
              <Phone className="w-5 h-5" />
            </button>
            <button onClick={() => setShowCall('video')} className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-indigo-400 transition" title="Panggilan Video">
              <Video className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Area Daftar Pesan */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isMe = msg.senderId === currentUser?.uid;
          const senderName = msg.senderName || msg.displayName || 'Pengguna';
          const avatarUrl = msg.senderPhoto || msg.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${msg.senderUsername || msg.senderId}`;

          return (
            <div key={msg.id} className={`flex items-end gap-2.5 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
              <img 
                src={avatarUrl} 
                alt={senderName} 
                onClick={() => handleUserClick(msg.senderId, senderName)}
                className={`w-8 h-8 rounded-full object-cover bg-slate-800 border border-slate-700 flex-shrink-0 ${!isMe ? 'cursor-pointer hover:border-indigo-500 transition' : ''}`} 
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${msg.senderUsername || msg.senderId}`;
                }}
              />
              <div className={`max-w-[70%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                {!isMe && (
                  <span 
                    onClick={() => handleUserClick(msg.senderId, senderName)}
                    className="text-[10px] font-bold text-indigo-400 mb-1 px-1 cursor-pointer hover:underline"
                  >
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
                  {/* Status Pesan Terkirim / Dibaca */}
                  {isMe && !activeChat.isChannel && (
                    <div className="flex justify-end mt-1 text-[10px] text-indigo-200">
                      {msg.isRead ? <CheckCheck className="w-3.5 h-3.5 text-sky-300" /> : <Check className="w-3.5 h-3.5 text-indigo-300" />}
                    </div>
                  )}
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

      {/* Modal Klik Profil User di Chat */}
      {selectedUserModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl">
            <img 
              src={selectedUserModal.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${selectedUserModal.username}`} 
              alt={selectedUserModal.displayName}
              className="w-20 h-20 rounded-full mx-auto object-cover border-2 border-indigo-500/40 bg-slate-800"
            />
            <div>
              <h3 className="text-lg font-bold text-white">{selectedUserModal.displayName}</h3>
              <p className="text-xs text-indigo-400 mt-0.5">@{selectedUserModal.username}</p>
            </div>

            {isAlreadyFriend ? (
              <div className="py-2 px-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-semibold">
                Sudah Menjadi Teman
              </div>
            ) : (
              <button
                onClick={handleSendFriendRequest}
                disabled={sendingRequest || requestSuccess}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition"
              >
                {requestSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" /> Permintaan Terkirim!
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" /> Kirim Permintaan Pertemanan
                  </>
                )}
              </button>
            )}

            <button
              onClick={() => setSelectedUserModal(null)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs transition"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}