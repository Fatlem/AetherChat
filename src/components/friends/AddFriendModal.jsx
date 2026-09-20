import React, { useState } from 'react';
import { UserPlus, X, CheckCircle } from 'lucide-react';
import { collection, query, where, getDocs, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../../config/firebase';

export default function AddFriendModal({ setShowAddFriend, currentUser, userProfile, setUserProfile }) {
  const [friendSearchQuery, setFriendSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const handleSearchFriends = async () => {
    if (!friendSearchQuery.trim()) return;
    const cleanSearch = friendSearchQuery.toLowerCase().trim();
    const q = query(collection(db, "users"), where("username", "==", cleanSearch));
    const querySnapshot = await getDocs(q);
    const results = [];
    querySnapshot.forEach((docSnap) => {
      if (docSnap.data().uid !== currentUser.uid) {
        results.push(docSnap.data());
      }
    });
    setSearchResults(results);
  };

  const handleAddFriend = async (targetUser) => {
    try {
      const currentUserRef = doc(db, "users", currentUser.uid);
      await updateDoc(currentUserRef, { friends: arrayUnion(targetUser.uid) });
      setUserProfile(prev => ({ ...prev, friends: [...(prev.friends || []), targetUser.uid] }));
      alert(`Berhasil menambahkan ${targetUser.displayName} sebagai teman!`);
    } catch (err) {
      console.error(err);
      alert("Gagal menambahkan teman.");
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative">
        <button onClick={() => setShowAddFriend(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-indigo-400" /> Cari & Tambah Teman
        </h3>

        <div className="flex gap-2 mb-4">
          <input 
            type="text" 
            placeholder="Masukkan username tepat..."
            value={friendSearchQuery}
            onChange={(e) => setFriendSearchQuery(e.target.value)}
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-indigo-500"
          />
          <button onClick={handleSearchFriends} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-sm transition">
            Cari
          </button>
        </div>

        <div className="space-y-2 max-h-60 overflow-y-auto">
          {searchResults.length > 0 ? (
            searchResults.map((user) => {
              const isAlreadyFriend = userProfile?.friends?.includes(user.uid);
              return (
                <div key={user.uid} className="flex items-center justify-between p-3 bg-slate-800/40 rounded-xl border border-slate-700/50">
                  <div className="flex items-center gap-3">
                    <img src={user.photoURL} alt={user.displayName} className="w-10 h-10 rounded-full object-cover" />
                    <div>
                      <h4 className="font-semibold text-sm">{user.displayName}</h4>
                      <p className="text-xs text-indigo-400">@{user.username}</p>
                    </div>
                  </div>
                  
                  {isAlreadyFriend ? (
                    <span className="text-xs text-emerald-400 flex items-center gap-1 font-semibold">
                      <CheckCircle className="w-4 h-4" /> Teman
                    </span>
                  ) : (
                    <button onClick={() => handleAddFriend(user)} className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition">
                      + Tambah
                    </button>
                  )}
                </div>
              );
            })
          ) : (
            <p className="text-xs text-center text-slate-500 py-4">Ketik username dan tekan tombol Cari.</p>
          )}
        </div>
      </div>
    </div>
  );
}