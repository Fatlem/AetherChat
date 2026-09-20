import React, { useState } from 'react';
import { Search, UserPlus, X, Check } from 'lucide-react';
import { collection, query, where, getDocs, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../../config/firebase';

export default function AddFriendModal({ setShowAddFriend, currentUser, userProfile }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [searched, setSearched] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setLoading(true);
    setSearched(true);
    setSearchResult(null);
    setRequestSent(false);

    try {
      const cleanTerm = searchTerm.toLowerCase().trim();
      const q = query(
        collection(db, "users"), 
        where("usernameLower", "==", cleanTerm)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const foundUser = querySnapshot.docs[0].data();
        if (foundUser.uid !== currentUser.uid) {
          setSearchResult(foundUser);
        }
      }
    } catch (err) {
      console.error("Error searching user:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async () => {
    if (!searchResult || !currentUser) return;

    try {
      const targetDocRef = doc(db, "users", searchResult.uid);
      await updateDoc(targetDocRef, {
        friendRequests: arrayUnion(currentUser.uid)
      });
      setRequestSent(true);
    } catch (err) {
      console.error("Error sending friend request:", err);
    }
  };

  const isAlreadyFriend = userProfile?.friends?.includes(searchResult?.uid);

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
        <button 
          onClick={() => setShowAddFriend(false)}
          className="absolute right-4 top-4 text-slate-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-indigo-400" /> Cari & Tambah Teman
        </h3>

        <form onSubmit={handleSearch} className="flex gap-2 mb-6">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input 
              type="text" 
              placeholder="Masukkan username teman (contoh: fatlem)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition"
            />
          </div>
          <button 
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white rounded-xl text-xs font-semibold transition"
          >
            {loading ? 'Mencari...' : 'Cari'}
          </button>
        </form>

        {searched && (
          <div>
            {searchResult ? (
              <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
                <div className="flex items-center gap-3">
                  <img 
                    src={searchResult.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${searchResult.username}`} 
                    alt={searchResult.displayName}
                    className="w-10 h-10 rounded-full object-cover bg-slate-800" 
                  />
                  <div>
                    <h4 className="font-bold text-xs text-white">{searchResult.displayName}</h4>
                    <p className="text-[10px] text-indigo-400">@{searchResult.username}</p>
                  </div>
                </div>

                {isAlreadyFriend ? (
                  <span className="text-[10px] text-emerald-400 font-semibold px-2 py-1 bg-emerald-500/10 rounded-lg">
                    Sudah Teman
                  </span>
                ) : (
                  <button 
                    onClick={handleSendFriendRequest}
                    disabled={requestSent}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1"
                  >
                    {requestSent ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" /> Terkirim
                      </>
                    ) : (
                      'Kirim Request'
                    )}
                  </button>
                )}
              </div>
            ) : (
              <p className="text-center text-slate-500 text-xs py-4">Pengguna tidak ditemukan.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}