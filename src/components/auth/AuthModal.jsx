import React, { useState, useRef } from 'react';
import { Sparkles, Upload } from 'lucide-react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile 
} from "firebase/auth";
import { doc, setDoc, getDocs, collection, query, where, serverTimestamp } from "firebase/firestore";
import { auth, db } from '../../config/firebase';

const DEFAULT_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80'
];

export default function AuthModal({ setUserProfile }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(DEFAULT_AVATARS[0]);
  const [authError, setAuthError] = useState('');
  const avatarFileInputRef = useRef(null);

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');

    try {
      if (isRegister) {
        if (!username || !displayName) {
          setAuthError('Semua kolom wajib diisi!');
          return;
        }

        const usernameQuery = query(collection(db, "users"), where("username", "==", username.toLowerCase().trim()));
        const usernameSnap = await getDocs(usernameQuery);
        if (!usernameSnap.empty) {
          setAuthError('Username sudah digunakan oleh orang lain!');
          return;
        }

        const res = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(res.user, { displayName, photoURL: selectedAvatar });

        const userData = {
          uid: res.user.uid,
          email: email.toLowerCase(),
          displayName,
          username: username.toLowerCase().trim(),
          photoURL: selectedAvatar,
          friends: [],
          createdAt: serverTimestamp()
        };

        await setDoc(doc(db, "users", res.user.uid), userData);
        setUserProfile(userData);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      setAuthError(err.message.includes('auth/invalid-credential') ? 'Email atau kata sandi salah.' : err.message);
    }
  };

  const handleAvatarFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("Ukuran file maksimal 2MB!");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setSelectedAvatar(reader.result);
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/30 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600/30 rounded-full blur-3xl"></div>

      <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 mb-4 shadow-lg shadow-indigo-500/30">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            AetherChat
          </h1>
          <p className="text-slate-400 text-sm mt-1">Platform Obrolan Modern & Estetik</p>
        </div>

        <div className="flex bg-slate-800/60 p-1 rounded-xl mb-6">
          <button
            onClick={() => setIsRegister(false)}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${!isRegister ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
          >
            Masuk
          </button>
          <button
            onClick={() => setIsRegister(true)}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${isRegister ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
          >
            Daftar Akun
          </button>
        </div>

        {authError && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center">
            {authError}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          {isRegister && (
            <>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Alex Rivers"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Username Unik</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: alex_rivers"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-2">Pilih Foto Profil</label>
                <div className="flex items-center gap-3 mb-3">
                  <img src={selectedAvatar} alt="Selected" className="w-14 h-14 rounded-full object-cover border-2 border-indigo-500" />
                  <input type="file" ref={avatarFileInputRef} onChange={handleAvatarFileUpload} accept="image/*" className="hidden" />
                  <button
                    type="button"
                    onClick={() => avatarFileInputRef.current.click()}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-medium text-slate-300 flex items-center gap-1.5 transition"
                  >
                    <Upload className="w-3.5 h-3.5" /> Upload Sendiri
                  </button>
                </div>
                <div className="grid grid-cols-6 gap-2">
                  {DEFAULT_AVATARS.map((avatar, idx) => (
                    <img
                      key={idx}
                      src={avatar}
                      alt={`Avatar ${idx}`}
                      onClick={() => setSelectedAvatar(avatar)}
                      className={`w-10 h-10 rounded-full object-cover cursor-pointer border-2 transition hover:scale-105 ${selectedAvatar === avatar ? 'border-indigo-500 ring-2 ring-indigo-500/30' : 'border-transparent opacity-60 hover:opacity-100'}`}
                    />
                  ))}
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Email</label>
            <input
              type="email"
              required
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Kata Sandi</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/25 transition mt-2"
          >
            {isRegister ? 'Buat Akun Sekarang' : 'Masuk ke Aplikasi'}
          </button>
        </form>
      </div>
    </div>
  );
}