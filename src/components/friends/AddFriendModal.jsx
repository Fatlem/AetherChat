import React, { useState } from 'react';
import { UserPlus, X, CheckCircle, Loader2 } from 'lucide-react';
import { collection, query, where, getDocs, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../../config/firebase';

export default function AddFriendModal({ setShowAddFriend, currentUser, userProfile, setUserProfile }) {
  const [friendSearchQuery, setFriendSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearchFriends = async (e) => {
    if (e) e.preventDefault();
    if (!friendSearchQuery.trim()) return;

    setLoading(true);
    setHasSearched(true);
    const cleanSearch = friendSearchQuery.toLowerCase().trim();

    try {
      // Query berdasarkan username
      let q = query(collection(db, "users"), where("username", "==", cleanSearch));
      let querySnapshot = await getDocs(q);

      // Fallback query ke usernameLower jika query pertama kosong
      if (querySnapshot.empty) {
        q = query(collection(db, "users"), where("usernameLower", "==", cleanSearch));
        querySnapshot = await getDocs(q);
      }

      const results = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.uid !== currentUser?.uid) {
          results.push(data);
        }
      });

      setSearchResults(results);
    } catch (err) {
      console.error("Error searching friends:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFriend = async (targetUser) => {
    try {
      const currentUserRef = doc(db, "users", currentUser.uid);
      await updateDoc(currentUserRef, { friends: arrayUnion(targetUser.uid) });
      setUserProfile(prev => ({ ...prev, friends: [...(prev?.friends || []), targetUser.uid] }));
      alert(`Berhasil menambahkan ${targetUser.displayName} sebagai teman!`);
    } catch (err) {
      console.error(err);
      alert("Gagal menambahkan teman.");
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative">
        <button onClick={() => setShowAddFriend(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white transition">
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-white">
          <UserPlus className="w-5 h-5 text-indigo-400" /> Cari & Tambah Teman
        </h3>

        <form onSubmit={handleSearchFriends} className="flex gap-2 mb-4">
          <input 
            type="text" 
            placeholder="Masukkan username tepat..."
            value={friendSearchQuery}
            onChange={(e) => setFriendSearchQuery(e.target.value)}
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
          />
          <button 
            type="submit" 
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition flex items-center justify-center min-w-[70px]"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Cari'}
          </button>
        </form>

        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {searchResults.length > 0 ? (
            searchResults.map((user) => {
              const isAlreadyFriend = userProfile?.friends?.includes(user.uid);
              const avatarSrc = user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username || user.displayName}`;

              return (
                <div key={user.uid} className="flex items-center justify-between p-3 bg-slate-800/40 rounded-xl border border-slate-700/50">
                  <div className="flex items-center gap-3">
                    <img 
                      src={avatarSrc} 
                      alt={user.displayName} 
                      className="w-10 h-10 rounded-full object-cover bg-slate-700 border border-slate-600" 
                    />
                    <div>
                      <h4 className="font-semibold text-sm text-white">{user.displayName}</h4>
                      <p className="text-xs text-indigo-400">@{user.username}</p>
                    </div>
                  </div>
                  
                  {isAlreadyFriend ? (
                    <span className="text-xs text-emerald-400 flex items-center gap-1 font-semibold">
                      <CheckCircle className="w-4 h-4" /> Teman
                    </span>
                  ) : (
                    <button 
                      onClick={() => handleAddFriend(user)} 
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition"
                    >
                      + Tambah
                    </button>
                  )}
                </div>
              );
            })
          ) : hasSearched && !loading ? (
            <p className="text-xs text-center text-slate-400 py-4">Pengguna tidak ditemukan.</p>
          ) : (
            <p className="text-xs text-center text-slate-500 py-4">Ketik username dan tekan tombol Cari.</p>
          )}
        </div>
      </div>
    </div>
  );
}