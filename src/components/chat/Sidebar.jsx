import React, { useState, useEffect } from 'react';
import { Search, UserPlus, LogOut, Bell, Check, X, MessageSquare, Users, User, Settings } from 'lucide-react';
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
  setShowEditProfile
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

  const filteredFriends = friendsList.filter(friend => 
    friend.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    friend.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full h-full border-r flex flex-col bg-slate-900 border-slate-800 text-slate-100 relative select-none">
      {/* Header Profil */}
      <div className="p-3.5 border-b flex items-center justify-between border-slate-800 bg-slate-900/80 backdrop-blur">
        <div 
          onClick={() => setShowEditProfile(true)}
          className="flex items-center gap-2.5 min-w-0 cursor-pointer hover:opacity-80 transition"
        >
          <img 
            src={avatarSrc} 
            alt={displayName} 
            className="w-9 h-9 rounded-full object-cover border border-indigo-500/50 bg-slate-800 flex-shrink-0" 
          />
          <div className="min-w-0">
            <h3 className="font-bold text-xs leading-snug truncate text-white">{displayName}</h3>
            <p className="text-[10px] text-indigo-400 truncate">@{username}</p>
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 hover:bg-slate-800/80 rounded-xl text-slate-400 hover:text-indigo-400 transition relative"
            >
              <Bell className="w-4 h-4" />
              {incomingRequests.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full ring-2 ring-slate-900 animate-pulse"></span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-3 z-50">
                <h4 className="text-[10px] font-bold text-slate-400 mb-2 px-1">Permintaan Pertemanan</h4>
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
                            className="w-7 h-7 rounded-full object-cover bg-slate-800"
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-bold truncate">{reqUser.displayName}</p>
                            <p className="text-[10px] text-slate-400 truncate">@{reqUser.username}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 ml-1">
                          <button 
                            onClick={() => handleAcceptRequest(reqUser.uid)}
                            className="p-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                          <button 
                            onClick={() => handleRejectRequest(reqUser.uid)}
                            className="p-1 bg-red-600 hover:bg-red-500 text-white rounded-lg transition"
                          >
                            <X className="w-3 h-3" />
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
            className="p-2 hover:bg-slate-800/80 rounded-xl text-slate-400 hover:text-indigo-400 transition"
          >
            <UserPlus className="w-4 h-4" />
          </button>

          <button 
            onClick={() => signOut(auth)}
            className="p-2 hover:bg-slate-800/80 rounded-xl text-slate-400 hover:text-red-400 transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Input Pencarian */}
      <div className="p-2.5">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Cari obrolan / teman..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition"
          />
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1 pb-16 md:pb-2">
        {activeTab === 'chats' && (
          <>
            <div 
              onClick={() => setActiveChat({ id: 'global-community', name: 'Komunitas Aether', isChannel: true })}
              className={`flex items-center gap-2.5 p-2.5 rounded-xl cursor-pointer transition ${activeChat?.id === 'global-community' ? 'bg-indigo-600/20 border border-indigo-500/30' : 'hover:bg-slate-800/40'}`}
            >
              <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold flex-shrink-0 text-sm">
                #
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-xs truncate text-white">Komunitas Aether</h4>
                <p className="text-[10px] text-slate-400 truncate">Ruang obrolan publik bersama</p>
              </div>
            </div>

            {filteredFriends.map(friend => {
              const friendAvatar = friend.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${friend.username}`;
              return (
                <div 
                  key={friend.uid}
                  onClick={() => setActiveChat({ ...friend, isChannel: false })}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl cursor-pointer transition ${activeChat?.uid === friend.uid ? 'bg-indigo-600/20 border border-indigo-500/30' : 'hover:bg-slate-800/40'}`}
                >
                  <img 
                    src={friendAvatar} 
                    alt={friend.displayName} 
                    className="w-9 h-9 rounded-full object-cover bg-slate-800 flex-shrink-0" 
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-xs truncate text-white">{friend.displayName}</h4>
                    <p className="text-[10px] text-slate-400 truncate">@{friend.username}</p>
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
                Belum ada teman.
              </div>
            ) : (
              filteredFriends.map(friend => {
                const friendAvatar = friend.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${friend.username}`;
                return (
                  <div key={friend.uid} className="flex items-center justify-between p-2.5 bg-slate-800/30 rounded-xl">
                    <div className="flex items-center gap-2 min-w-0">
                      <img 
                        src={friendAvatar} 
                        alt={friend.displayName} 
                        className="w-8 h-8 rounded-full object-cover bg-slate-800 flex-shrink-0" 
                      />
                      <div className="min-w-0">
                        <h4 className="font-semibold text-xs truncate text-white">{friend.displayName}</h4>
                        <p className="text-[10px] text-slate-400 truncate">@{friend.username}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        setActiveChat({ ...friend, isChannel: false });
                        setActiveTab('chats');
                      }}
                      className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-semibold transition flex-shrink-0 ml-1"
                    >
                      Pesan
                    </button>
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="p-4 text-center space-y-4">
            <img src={avatarSrc} alt={displayName} className="w-20 h-20 rounded-full mx-auto object-cover border-2 border-indigo-500 bg-slate-800" />
            <div>
              <h3 className="text-base font-bold text-white">{displayName}</h3>
              <p className="text-xs text-indigo-400">@{username}</p>
            </div>
            <button 
              onClick={() => setShowEditProfile(true)}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition"
            >
              Edit Profil
            </button>
          </div>
        )}
      </div>

      {/* WhatsApp-style Bottom Mobile Navigation Bar */}
      <div className="md:hidden fixed bottom-0 inset-x-0 bg-slate-900/95 border-t border-slate-800 backdrop-blur-lg flex justify-around items-center py-2.5 z-30">
        <button 
          onClick={() => setActiveTab('chats')}
          className={`flex flex-col items-center gap-1 text-[10px] transition ${activeTab === 'chats' ? 'text-indigo-400 font-bold' : 'text-slate-400'}`}
        >
          <MessageSquare className="w-5 h-5" />
          <span>Obrolan</span>
        </button>

        <button 
          onClick={() => setActiveTab('friends')}
          className={`flex flex-col items-center gap-1 text-[10px] transition ${activeTab === 'friends' ? 'text-indigo-400 font-bold' : 'text-slate-400'}`}
        >
          <Users className="w-5 h-5" />
          <span>Teman ({friendsList.length})</span>
        </button>

        <button 
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center gap-1 text-[10px] transition ${activeTab === 'profile' ? 'text-indigo-400 font-bold' : 'text-slate-400'}`}
        >
          <User className="w-5 h-5" />
          <span>Profil</span>
        </button>
      </div>
    </div>
  );
}