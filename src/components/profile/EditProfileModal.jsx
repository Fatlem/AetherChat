import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { db } from '../../config/firebase';

export default function EditProfileModal({ setShowEditProfile, currentUser, userProfile }) {
  const [displayName, setDisplayName] = useState(userProfile?.displayName || '');
  const [photoURL, setPhotoURL] = useState(userProfile?.photoURL || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!displayName.trim() || !currentUser) return;
    setSaving(true);

    try {
      // 1. Update Auth Profile
      await updateProfile(currentUser, {
        displayName: displayName.trim(),
        photoURL: photoURL
      });

      // 2. Update Firestore Doc
      await updateDoc(doc(db, "users", currentUser.uid), {
        displayName: displayName.trim(),
        photoURL: photoURL
      });

      setShowEditProfile(false);
    } catch (err) {
      console.error("Gagal mengupdate profil:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl relative">
        <button 
          onClick={() => setShowEditProfile(false)}
          className="absolute right-4 top-4 text-slate-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-bold text-white mb-4">Edit Profil Anda</h3>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="text-center">
            <img 
              src={photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${userProfile?.username}`} 
              alt="Preview" 
              className="w-20 h-20 rounded-full mx-auto object-cover border-2 border-indigo-500 bg-slate-800 mb-2"
            />
          </div>

          <div>
            <label className="block text-[10px] font-semibold uppercase text-slate-400 mb-1">Nama Tampilan</label>
            <input 
              type="text" 
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          <div>
            <label className="block text-[10px] font-semibold uppercase text-slate-400 mb-1">URL Foto Profil</label>
            <input 
              type="text" 
              value={photoURL}
              onChange={(e) => setPhotoURL(e.target.value)}
              placeholder="https://..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          <button 
            type="submit"
            disabled={saving}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
          >
            {saving ? 'Memproses...' : 'Simpan Perubahan'}
          </button>
        </form>
      </div>
    </div>
  );
}