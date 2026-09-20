import React, { useState, useEffect } from 'react';
import { Sparkles, PhoneOff } from 'lucide-react';
import { onAuthStateChanged } from "firebase/auth";
import { 
  doc, 
  getDoc, 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp, 
  getDocs 
} from "firebase/firestore";
import { auth, db } from './config/firebase';

import AuthModal from './components/auth/AuthModal';
import Sidebar from './components/chat/Sidebar';
import ChatArea from './components/chat/ChatArea';
import AddFriendModal from './components/friends/AddFriendModal';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState('chats');
  const [activeChat, setActiveChat] = useState({ id: 'global-community', name: 'Komunitas Aether', isChannel: true });
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const [showAddFriend, setShowAddFriend] = useState(false);
  const [showCall, setShowCall] = useState(null);
  const [friendsList, setFriendsList] = useState([]);

  // 1. Listen Auth State & Realtime User Profile Firestore Listener
  useEffect(() => {
    let unsubscribeFirestore = () => {};

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);

      if (user) {
        // Sync Realtime Profil Firestore
        const userDocRef = doc(db, "users", user.uid);
        unsubscribeFirestore = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            setUserProfile(docSnap.data());
          } else {
            // Profil standar jika dokumen Firestore belum ada
            setUserProfile({
              uid: user.uid,
              email: user.email,
              displayName: user.displayName || user.email.split('@')[0],
              username: user.email.split('@')[0].toLowerCase(),
              usernameLower: user.email.split('@')[0].toLowerCase(),
              photoURL: user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.email.split('@')[0]}`,
              friends: []
            });
          }
        });
      } else {
        setUserProfile(null);
        setFriendsList([]);
      }

      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeFirestore();
    };
  }, []);

  // 2. Fetch Messages secara Realtime
  useEffect(() => {
    if (!activeChat || !currentUser) return;

    let q;
    if (activeChat.isChannel) {
      q = query(collection(db, "channels", activeChat.id, "messages"), orderBy("timestamp", "asc"));
    } else {
      const chatId = [currentUser.uid, activeChat.uid].sort().join('_');
      q = query(collection(db, "chats", chatId, "messages"), orderBy("timestamp", "asc"));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
      setMessages(msgs);
    }, (err) => {
      console.error("Error loading messages:", err);
    });

    return () => unsubscribe();
  }, [activeChat, currentUser]);

  // 3. Fetch Friends List
  useEffect(() => {
    if (!currentUser || !userProfile?.friends || userProfile.friends.length === 0) {
      setFriendsList([]);
      return;
    }

    const fetchFriends = async () => {
      try {
        const q = query(collection(db, "users"), where("uid", "in", userProfile.friends.slice(0, 10)));
        const querySnapshot = await getDocs(q);
        setFriendsList(querySnapshot.docs.map(docSnap => docSnap.data()));
      } catch (err) {
        console.error("Error fetching friends:", err);
      }
    };

    fetchFriends();
  }, [userProfile?.friends, currentUser]);

  // 4. Handle Send Message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat || !currentUser) return;

    const senderUsername = userProfile?.username || currentUser.email.split('@')[0];
    const messageData = {
      senderId: currentUser.uid,
      senderName: userProfile?.displayName || currentUser.displayName || senderUsername,
      senderUsername: senderUsername,
      senderPhoto: userProfile?.photoURL || currentUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${senderUsername}`,
      text: newMessage.trim(),
      timestamp: serverTimestamp()
    };

    const textToSend = newMessage;
    setNewMessage('');

    try {
      if (activeChat.isChannel) {
        await addDoc(collection(db, "channels", activeChat.id, "messages"), messageData);
      } else {
        const chatId = [currentUser.uid, activeChat.uid].sort().join('_');
        await addDoc(collection(db, "chats", chatId, "messages"), messageData);
      }
    } catch (err) {
      console.error("Error sending message:", err);
      setNewMessage(textToSend);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <Sparkles className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
        <h2 className="text-xl font-bold tracking-wider">Mempersiapkan AetherChat...</h2>
      </div>
    );
  }

  if (!currentUser) {
    return <AuthModal setUserProfile={setUserProfile} />;
  }

  return (
    <div className="h-screen flex overflow-hidden font-sans bg-slate-950 text-slate-100">
      <Sidebar 
        userProfile={userProfile}
        currentUser={currentUser}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeChat={activeChat}
        setActiveChat={setActiveChat}
        friendsList={friendsList}
        setShowAddFriend={setShowAddFriend}
      />

      <ChatArea 
        activeChat={activeChat}
        currentUser={currentUser}
        messages={messages}
        newMessage={newMessage}
        setNewMessage={setNewMessage}
        handleSendMessage={handleSendMessage}
        setShowCall={setShowCall}
      />

      {showAddFriend && (
        <AddFriendModal 
          setShowAddFriend={setShowAddFriend}
          currentUser={currentUser}
          userProfile={userProfile}
          setUserProfile={setUserProfile}
        />
      )}

      {showCall && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-50 flex items-center justify-center p-4">
          <div className="text-center space-y-6">
            <img 
              src={activeChat?.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${activeChat?.username || 'user'}`} 
              alt={activeChat?.displayName} 
              className="w-24 h-24 rounded-full object-cover border-4 border-indigo-500/50 mx-auto animate-pulse bg-slate-800" 
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${activeChat?.username || 'user'}`;
              }}
            />
            <div>
              <h3 className="text-2xl font-bold">{activeChat?.displayName || 'Pengguna'}</h3>
              <p className="text-sm text-indigo-400 mt-1">Memanggil via {showCall === 'video' ? 'Video Call' : 'Panggilan Suara'}...</p>
            </div>
            <button onClick={() => setShowCall(null)} className="p-4 bg-red-600 hover:bg-red-500 text-white rounded-full shadow-lg shadow-red-600/30 transition">
              <PhoneOff className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}