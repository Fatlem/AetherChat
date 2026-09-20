import React from 'react';
import { Search, UserPlus, LogOut } from 'lucide-react';
import { signOut } from "firebase/auth";
import { auth } from '../../config/firebase';

export default function Sidebar({ 
  userProfile, 
  currentUser, 
  searchQuery, 
  setSearchQuery, 
  activeTab, 
  setActiveTab, 
  activeChat, 
  setActiveChat, 
  friendsList = [], 
  setShowAddFriend 
}) {
  // Ambil nama & username secara fleksibel dari userProfile atau currentUser
  const displayName = userProfile?.displayName || currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Pengguna';
  const username = userProfile?.username || currentUser?.email?.split('@')[0] || 'user';
  
  // Avatar fallback aman
  const avatarSrc = userProfile?.photoURL || currentUser?.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`;

  // Filter daftar teman berdasarkan input pencarian
  const filteredFriends = friendsList.filter(friend => 
    friend.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    friend.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-80 border-r flex flex-col bg-slate-900/60 border-slate-800 text-slate-100">
      <div className="p-4 border-b flex items-center justify-between border-slate-800">
        <div className="flex items-center gap-3 min-w-0">
          <img 
            src={avatarSrc} 
            alt={displayName} 
            className="w-10 h-10 rounded-full object-cover border border-indigo-500/50 bg-slate-800 flex-shrink-0" 
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`;
            }}
          />
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-sm leading-snug truncate text-white">{displayName}</h3>
            <p className="text-xs text-indigo-400 truncate">@{username}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button 
            onClick={() => setShowAddFriend(true)}
            className="p-2 hover:bg-slate-800/50 rounded-xl text-slate-400 hover:text-indigo-400 transition"
            title="Tambah Teman"
          >
            <UserPlus className="w-5 h-5" />
          </button>
          <button 
            onClick={() => signOut(auth)}
            className="p-2 hover:bg-slate-800/50 rounded-xl text-slate-400 hover:text-red-400 transition"
            title="Keluar"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="p-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input 
            type="text" 
            placeholder="Cari obrolan / teman..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition"
          />
        </div>
      </div>

      <div className="flex border-b border-slate-800 px-3">
        <button 
          onClick={() => setActiveTab('chats')}
          className={`flex-1 py-2 text-xs font-semibold border-b-2 transition ${activeTab === 'chats' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
        >
          Obrolan
        </button>
        <button 
          onClick={() => setActiveTab('friends')}
          className={`flex-1 py-2 text-xs font-semibold border-b-2 transition ${activeTab === 'friends' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
        >
          Teman ({friendsList.length})
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {activeTab === 'chats' && (
          <>
            <div 
              onClick={() => setActiveChat({ id: 'global-community', name: 'Komunitas Aether', isChannel: true })}
              className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition ${activeChat?.id === 'global-community' ? 'bg-indigo-600/20 border border-indigo-500/30' : 'hover:bg-slate-800/40'}`}
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold flex-shrink-0">
                #
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm truncate text-white">Komunitas Aether</h4>
                <p className="text-xs text-slate-400 truncate">Ruang obrolan publik bersama</p>
              </div>
            </div>

            {filteredFriends.map(friend => {
              const friendAvatar = friend.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${friend.username}`;
              return (
                <div 
                  key={friend.uid}
                  onClick={() => setActiveChat({ ...friend, isChannel: false })}
                  className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition ${activeChat?.uid === friend.uid ? 'bg-indigo-600/20 border border-indigo-500/30' : 'hover:bg-slate-800/40'}`}
                >
                  <img 
                    src={friendAvatar} 
                    alt={friend.displayName} 
                    className="w-10 h-10 rounded-full object-cover bg-slate-800 flex-shrink-0" 
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${friend.username}`;
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm truncate text-white">{friend.displayName}</h4>
                    <p className="text-xs text-slate-400 truncate">@{friend.username}</p>
                  </div>
                </div>
              );
            })}
          </>
        )}

        {activeTab === 'friends' && (
          <div className="space-y-1">
            {filteredFriends.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">
                Belum ada teman. Klik ikon tambah teman untuk mencari berdasarkan username!
              </div>
            ) : (
              filteredFriends.map(friend => {
                const friendAvatar = friend.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${friend.username}`;
                return (
                  <div key={friend.uid} className="flex items-center justify-between p-3 bg-slate-800/30 rounded-xl">
                    <div className="flex items-center gap-3 min-w-0">
                      <img 
                        src={friendAvatar} 
                        alt={friend.displayName} 
                        className="w-10 h-10 rounded-full object-cover bg-slate-800 flex-shrink-0" 
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${friend.username}`;
                        }}
                      />
                      <div className="min-w-0">
                        <h4 className="font-semibold text-sm truncate text-white">{friend.displayName}</h4>
                        <p className="text-xs text-slate-400 truncate">@{friend.username}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        setActiveChat({ ...friend, isChannel: false });
                        setActiveTab('chats');
                      }}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition flex-shrink-0 ml-2"
                    >
                      Pesan
                    </button>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}