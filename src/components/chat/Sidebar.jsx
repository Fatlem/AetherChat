import React, { useState, useEffect } from 'react';
import { Search, UserPlus, LogOut, Bell, Check, X, Menu } from 'lucide-react';
import { signOut } from "firebase/auth";
import { doc, onSnapshot, updateDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';

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
  setShowAddFriend,
  isSidebarOpen,
  setIsSidebarOpen
}) {
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const displayName = userProfile?.displayName || currentUser?.displayName || 'Pengguna';
  const username = userProfile?.username || currentUser?.email?.split('@')[0] || 'user';
  const avatarSrc = userProfile?.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`;

  useEffect(() => {
    if (!currentUser) return;

    const userDocRef = doc(db, "users", currentUser.uid);
    const unsubscribe = onSnapshot(userDocRef, async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const requests = data.friendRequests || [];
        
        const reqProfiles = [];
        for (const reqUid of requests) {
          const reqDoc = await getDoc(doc(db, "users", reqUid));
          if (reqDoc.exists()) {
            reqProfiles.push(reqDoc.data());
          }
        }
        setIncomingRequests(reqProfiles);
      }
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleAcceptRequest = async (senderUid) => {
    try {
      await updateDoc(doc(db, "users", currentUser.uid), {
        friends: arrayUnion(senderUid),
        friendRequests: arrayRemove(senderUid)
      });
      await updateDoc(doc(db, "users", senderUid), {
        friends: arrayUnion(currentUser.uid)
      });
    } catch (err) {
      console.error("Gagal menerima pertemanan:", err);
    }
  };

  const handleRejectRequest = async (senderUid) => {
    try {
      await updateDoc(doc(db, "users", currentUser.uid), {
        friendRequests: arrayRemove(senderUid)
      });
    } catch (err) {
      console.error("Gagal menolak pertemanan:", err);
    }
  };

  const handleSelectChat = (chatData) => {
    setActiveChat(chatData);
    setIsSidebarOpen(false); // Otomatis tutup sidebar di mobile
  };

  const filteredFriends = friendsList.filter(friend => 
    friend.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    friend.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* Overlay backdrop hitam saat sidebar terbuka di HP */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)} 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 md:hidden"
        />
      )}

      <div className={`
        fixed md:static inset-y-0 left-0 z-50
        w-80 max-w-[85%] md:w-80
        border-r flex flex-col bg-slate-900 border-slate-800 text-slate-100
        transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Header Profil */}
        <div className="p-4 border-b flex items-center justify-between border-slate-800">
          <div className="flex items-center gap-3 min-w-0">
            <img 
              src={avatarSrc} 
              alt={displayName} 
              className="w-10 h-10 rounded-full object-cover border border-indigo-500/50 bg-slate-800 flex-shrink-0" 
            />
            <div className="min-w-0">
              <h3 className="font-bold text-sm leading-snug truncate text-white">{displayName}</h3>
              <p className="text-xs text-indigo-400 truncate">@{username}</p>
            </div>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Lonceng Notifikasi */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 hover:bg-slate-800/50 rounded-xl text-slate-400 hover:text-indigo-400 transition relative"
              >
                <Bell className="w-5 h-5" />
                {incomingRequests.length > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-slate-900 animate-pulse"></span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-3 z-50">
                  <h4 className="text-xs font-bold text-slate-400 mb-2 px-1">Permintaan Pertemanan</h4>
                  {incomingRequests.length === 0 ? (
                    <p className="text-xs text-slate-500 py-3 text-center">Tidak ada permintaan pertemanan.</p>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {incomingRequests.map((reqUser) => (
                        <div key={reqUser.uid} className="flex items-center justify-between p-2 bg-slate-800/50 rounded-xl">
                          <div className="flex items-center gap-2 min-w-0">
                            <img 
                              src={reqUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${reqUser.username}`} 
                              alt={reqUser.displayName} 
                              className="w-8 h-8 rounded-full object-cover bg-slate-800"
                            />
                            <div className="min-w-0">
                              <p className="text-xs font-bold truncate">{reqUser.displayName}</p>
                              <p className="text-[10px] text-slate-400 truncate">@{reqUser.username}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 ml-2">
                            <button 
                              onClick={() => handleAcceptRequest(reqUser.uid)}
                              className="p-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => handleRejectRequest(reqUser.uid)}
                              className="p-1 bg-red-600 hover:bg-red-500 text-white rounded-lg transition"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <button 
              onClick={() => setShowAddFriend(true)}
              className="p-2 hover:bg-slate-800/50 rounded-xl text-slate-400 hover:text-indigo-400 transition"
            >
              <UserPlus className="w-5 h-5" />
            </button>

            <button 
              onClick={() => signOut(auth)}
              className="p-2 hover:bg-slate-800/50 rounded-xl text-slate-400 hover:text-red-400 transition"
            >
              <LogOut className="w-5 h-5" />
            </button>

            {/* Tombol Close Sidebar di HP */}
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="p-2 md:hidden hover:bg-slate-800 rounded-xl text-slate-400"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search Input */}
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

        {/* Tabs Navigasi */}
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

        {/* List Obrolan */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {activeTab === 'chats' && (
            <>
              <div 
                onClick={() => handleSelectChat({ id: 'global-community', name: 'Komunitas Aether', isChannel: true })}
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
                    onClick={() => handleSelectChat({ ...friend, isChannel: false })}
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition ${activeChat?.uid === friend.uid ? 'bg-indigo-600/20 border border-indigo-500/30' : 'hover:bg-slate-800/40'}`}
                  >
                    <img 
                      src={friendAvatar} 
                      alt={friend.displayName} 
                      className="w-10 h-10 rounded-full object-cover bg-slate-800 flex-shrink-0" 
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
                  Belum ada teman. Klik ikon tambah teman di atas!
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
                        />
                        <div className="min-w-0">
                          <h4 className="font-semibold text-sm truncate text-white">{friend.displayName}</h4>
                          <p className="text-xs text-slate-400 truncate">@{friend.username}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          handleSelectChat({ ...friend, isChannel: false });
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
    </>
  );
}