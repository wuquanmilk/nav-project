import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  signInAnonymously,
  signOut,
  signInWithEmailAndPassword
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  onSnapshot,
  doc,
  addDoc,
  deleteDoc,
  updateDoc,
  getDocs
} from 'firebase/firestore';
import { ExternalLink, Moon, Sun, LogIn, X } from 'lucide-react';

// 🔹 配置管理员 UID 和 APP_ID
const ADMIN_USER_ID = '6UiUdmPna4RJb2hNBoXhx3XCTFN2';
const APP_ID = 'default-app-id';

// 🔹 调试栏
const DebugBar = ({ userId, isAdmin }) => (
  <div style={{
    backgroundColor: '#fff3cd',
    color: '#856404',
    padding: '10px',
    fontSize: '12px',
    fontFamily: 'monospace',
    wordBreak: 'break-all',
  }}>
    <strong>🔧 调试信息:</strong><br/>
    当前用户 UID: <strong>{userId || '未登录'}</strong><br/>
    当前权限: <strong>{isAdmin ? '✅ 管理员' : '❌ 访客'}</strong>
  </div>
);

// 🔹 链接卡片
const LinkCard = ({ link }) => {
  const faviconUrl = useMemo(() => {
    try { return `https://www.google.com/s2/favicons?domain=${new URL(link.icon||link.url).hostname}&sz=64`; } 
    catch { return 'https://placehold.co/40x40/ccc/000?text=L'; }
  }, [link.icon, link.url]);

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-transform flex flex-col h-full border border-gray-100 dark:border-gray-700">
      <a href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-4 flex-grow">
        <div className="flex-shrink-0 w-10 h-10 rounded-lg overflow-hidden border bg-gray-50 dark:bg-gray-700 flex items-center justify-center">
          <img src={faviconUrl} alt={link.name} className="w-full h-full object-cover" />
        </div>
        <div className="min-w-0 flex-grow">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">{link.name}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5">{link.description}</p>
        </div>
        <ExternalLink className="w-4 h-4 text-gray-400 dark:text-gray-500" />
      </a>
    </div>
  );
};

// 🔹 公共主页 + 搜索过滤
const PublicNav = ({ navData, searchTerm }) => {
  const filteredData = navData
    .map(cat => ({
      ...cat,
      links: cat.links.filter(l => 
        l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }))
    .filter(cat => cat.links.length > 0);

  return (
    <div className="space-y-8">
      {filteredData.map(cat => (
        <div key={cat.id || cat.category} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm">
          <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white border-l-4 border-blue-500 pl-3">{cat.category}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {cat.links.map(link => <LinkCard key={link.id} link={link} />)}
          </div>
        </div>
      ))}
    </div>
  );
};

// 🔹 搜索栏
const SearchBar = ({ searchTerm, onSearchChange }) => (
  <div className="relative max-w-2xl mx-auto mb-8">
    <input
      type="text"
      value={searchTerm}
      onChange={e => onSearchChange(e.target.value)}
      placeholder="搜索..."
      className="w-full p-4 pl-12 rounded-full border shadow-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
    />
    {searchTerm && <button onClick={() => onSearchChange('')} className="absolute right-4 top-4 text-gray-400"><X className="w-5 h-5"/></button>}
  </div>
);

// 🔹 登录弹窗
const LoginModal = ({ onClose, onLogin, error }) => {
  const [email,setEmail] = useState('');
  const [password,setPassword] = useState('');
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md p-8 relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"><X className="w-6 h-6"/></button>
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100 flex items-center"><LogIn className="w-6 h-6 mr-3 text-blue-500"/>管理员登录</h2>
        <form onSubmit={e=>{e.preventDefault(); onLogin(email,password)}} className="space-y-4">
          <input type="email" placeholder="邮箱" value={email} onChange={e=>setEmail(e.target.value)} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" required/>
          <input type="password" placeholder="密码" value={password} onChange={e=>setPassword(e.target.value)} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" required/>
          {error && <div className="text-sm p-3 bg-red-100 text-red-700 rounded-lg">{error}</div>}
          <button type="submit" className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg">登录</button>
        </form>
      </div>
    </div>
  );
};

// 🔹 主应用
export default function App() {
  const [firebaseApp, setFirebaseApp] = useState(null);
  const [auth,setAuth]=useState(null);
  const [db,setDb]=useState(null);
  const [userId,setUserId]=useState(null);
  const [navData,setNavData]=useState([]);
  const [isDark,setIsDark]=useState(false);
  const [showLogin,setShowLogin]=useState(false);
  const [loginError,setLoginError]=useState('');
  const [searchTerm,setSearchTerm]=useState('');

  useEffect(()=>{
    const firebaseConfig = {
      apiKey: "AIzaSyAlkYbLP4jW1P-XRJtCvC6id8GlIxxY8m4",
      authDomain: "wangzhandaohang.firebaseapp.com",
      projectId: "wangzhandaohang",
      storageBucket: "wangzhandaohang.firebasestorage.app",
      messagingSenderId: "169263636408",
      appId: "1:169263636408:web:ee3608652b2872a539b94d",
    };
    const app = initializeApp(firebaseConfig);
    const _auth = getAuth(app);
    const _db = getFirestore(app);
    setFirebaseApp(app); setAuth(_auth); setDb(_db);

    const unsub = onAuthStateChanged(_auth, user=>{
      if(user) setUserId(user.uid);
      else { signInAnonymously(_auth).catch(console.error); setUserId('anonymous'); }
    });
    return unsub;
  },[]);

  const isAdmin = userId === ADMIN_USER_ID;

  useEffect(()=>{
    if(!db) return;
    const navCol = collection(db, `artifacts/${APP_ID}/public/data/navData`);
    const unsub = onSnapshot(navCol,snapshot=>{
      const data = snapshot.docs.map(d=>({id:d.id,...d.data()}));
      data.sort((a,b)=>(a.order||0)-(b.order||0));
      setNavData(data);
    });
    return unsub;
  },[db]);

  const handleLogin = async (email,password)=>{
    try{
      await signInWithEmailAndPassword(auth,email,password);
      setShowLogin(false);
      setLoginError('');
    }catch(e){ setLoginError(e.message); }
  };

  return (
    <div className={`min-h-screen ${isDark?'dark bg-gray-900 text-white':'bg-gray-50 text-gray-900'}`}>
      <DebugBar userId={userId} isAdmin={isAdmin}/>
      {showLogin && <LoginModal onClose={()=>setShowLogin(false)} onLogin={handleLogin} error={loginError}/>}

      <div className="container mx-auto px-4 py-8">
        <header className="flex justify-between items-center mb-12">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">极速导航</h1>
          <div className="flex gap-4">
            <button onClick={()=>setIsDark(!isDark)} className="p-2 rounded-full bg-gray-200 dark:bg-gray-700">{isDark?<Sun className="w-5 h-5"/>:<Moon className="w-5 h-5"/>}</button>
            {!isAdmin && <button onClick={()=>setShowLogin(true)} className="text-blue-500 font-bold border px-3 py-1 rounded hover:bg-blue-50">管理员登录</button>}
            {isAdmin && <button onClick={()=>signOut(auth)} className="text-red-500">退出管理</button>}
          </div>
        </header>

        <SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm}/>
        <PublicNav navData={navData} searchTerm={searchTerm}/>
      </div>
    </div>
  )
}
