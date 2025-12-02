import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
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
// 导入 Search 图标
import { ExternalLink, Moon, Sun, LogIn, X, Github, Mail, Globe, Search } from 'lucide-react'; 

// 🔹 配置你的管理员 UID
const ADMIN_USER_ID = '6UiUdmPna4RJb2hNBoXhx3XCTFN2';
const APP_ID = 'default-app-id';

// 🔹 调试栏隐藏
const DebugBar = () => null;

// 🔹 链接卡片
const LinkCard = ({ link }) => {
  const faviconUrl = useMemo(() => {
    try {
      const urlObj = new URL(link.icon || link.url);
      return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=64`;
    } catch {
      return 'https://placehold.co/40x40/ccc/000?text=L';
    }
  }, [link.icon, link.url]);

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg flex flex-col h-full border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow duration-300">
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

// 🔹 公共主页
const PublicNav = ({ navData, searchTerm }) => {
    if (navData.length === 0 && searchTerm) {
        return (
            <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
                <Search className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-xl font-medium text-gray-600 dark:text-gray-300">
                    没有找到与 "{searchTerm}" 相关的链接。
                </p>
                <p className="text-gray-500 dark:text-gray-400 mt-2">请尝试其他关键词。</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 min-h-[60vh]">
            {navData.map(cat => (
                // 仅当分类下有链接时才渲染该分类
                cat.links && cat.links.length > 0 && (
                    <div key={cat.id || cat.category} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm">
                        <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white border-l-4 border-blue-500 pl-3">{cat.category}</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {cat.links.map(link => <LinkCard key={link.id} link={link} />)}
                        </div>
                    </div>
                )
            ))}
        </div>
    );
};

// 🔹 链接表单 (不变)
const LinkForm = ({ links, setLinks }) => {
  const handleChange = (index, field, value) => {
    const newLinks = [...links];
    newLinks[index][field] = value;
    setLinks(newLinks);
  };
  const addLink = () => setLinks([...links, { name: '', url: '', description: '' }]);
  const removeLink = (index) => setLinks(links.filter((_, i) => i !== index));

  return (
    <div className="space-y-2">
      {links.map((l, idx) => (
        <div key={idx} className="flex space-x-2">
          <input placeholder="名称" value={l.name} onChange={e => handleChange(idx, 'name', e.target.value)} className="border p-1 rounded w-24"/>
          <input placeholder="链接" value={l.url} onChange={e => handleChange(idx, 'url', e.target.value)} className="border p-1 rounded w-48"/>
          <input placeholder="描述" value={l.description} onChange={e => handleChange(idx, 'description', e.target.value)} className="border p-1 rounded flex-1"/>
          <button onClick={() => removeLink(idx)} className="bg-red-500 text-white px-2 rounded">删除</button>
        </div>
      ))}
      <button onClick={addLink} className="bg-blue-500 text-white px-3 py-1 rounded mt-1">新增链接</button>
    </div>
  )
}

// 🔹 登录弹窗 (不变)
const LoginModal = ({ onClose, onLogin, error }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const handleSubmit = (e) => { e.preventDefault(); onLogin(email, password); };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md p-8 relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"><X className="w-6 h-6"/></button>
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100 flex items-center"><LogIn className="w-6 h-6 mr-3 text-blue-500"/>管理员登录</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="email" placeholder="邮箱" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" required/>
          <input type="password" placeholder="密码" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" required/>
          {error && <div className="text-sm p-3 bg-red-100 text-red-700 rounded-lg">{error}</div>}
          <button type="submit" className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg">登录</button>
        </form>
      </div>
    </div>
  );
};

// 🔹 管理面板 (不变)
const AdminPanel = ({ db, navData, fetchData }) => {
  const [newCategory, setNewCategory] = useState({ category: '', order: 0, links: [] });
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});
  const navCollection = collection(db, `artifacts/${APP_ID}/public/data/navData`);

  const handleAddCategory = async () => {
    if (!newCategory.category) return alert('请输入分类名称');
    await addDoc(navCollection, newCategory);
    setNewCategory({ category: '', order: 0, links: [] });
    fetchData();
  };
  const startEdit = (item) => { setEditId(item.id); setEditData({...item}); };
  const saveEdit = async () => { await updateDoc(doc(db, `artifacts/${APP_ID}/public/data/navData`, editId), editData); setEditId(null); fetchData(); };
  const handleDelete = async (id) => { await deleteDoc(doc(db, `artifacts/${APP_ID}/public/data/navData`, id)); fetchData(); };

  return (
    <div className="mt-6 p-4 border rounded bg-gray-50 dark:bg-gray-800">
      <h3 className="text-xl font-bold mb-2">管理员面板 (完整 CRUD)</h3>
      <div className="flex flex-col md:flex-row gap-2 mb-4">
        <input placeholder="分类名" className="border p-2 rounded flex-1" value={newCategory.category} onChange={e => setNewCategory({...newCategory, category:e.target.value})}/>
        <input type="number" placeholder="排序" className="border p-2 rounded w-24" value={newCategory.order} onChange={e => setNewCategory({...newCategory, order:Number(e.target.value)})}/>
        <LinkForm links={newCategory.links} setLinks={(links)=>setNewCategory({...newCategory, links})}/>
        <button onClick={handleAddCategory} className="bg-blue-500 text-white px-4 rounded">新增分类</button>
      </div>
      {navData.map(item=>(
        <div key={item.id} className="border p-2 mb-2 rounded bg-white dark:bg-gray-700">
          {editId === item.id ? (
            <>
              <input className="border p-1 mb-1 rounded w-full" value={editData.category} onChange={e=>setEditData({...editData, category:e.target.value})}/>
              <input type="number" className="border p-1 mb-1 rounded w-24" value={editData.order} onChange={e=>setEditData({...editData, order:Number(e.target.value)})}/>
              <LinkForm links={editData.links} setLinks={(links)=>setEditData({...editData, links})}/>
              <div className="flex space-x-2 mt-1">
                <button onClick={saveEdit} className="bg-green-500 text-white px-2 rounded">保存</button>
                <button onClick={()=>setEditId(null)} className="bg-gray-400 text-white px-2 rounded">取消</button>
              </div>
            </>
          ) : (
            <>
              <div className="flex justify-between items-center">
                <h4>{item.category} (排序: {item.order})</h4>
                <div className="flex space-x-1">
                  <button onClick={()=>startEdit(item)} className="bg-yellow-400 text-white px-2 rounded">编辑</button>
                  <button onClick={()=>handleDelete(item.id)} className="bg-red-500 text-white px-2 rounded">删除</button>
                </div>
              </div>
              <ul className="ml-4">{item.links?.map((l,idx)=><li key={idx}>{l.name} - {l.url}</li>)}</ul>
            </>
          )}
        </div>
      ))}
    </div>
  );
};

// 🔹 新增：页脚组件 (不变)
const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  // 自定义常用链接
  const footerLinks = [
    { name: '关于本站', url: '#' },
    { name: '提交收录', url: '#' },
    { name: '免责声明', url: '#' },
    { name: '反馈建议', url: 'mailto:contact@example.com' },
  ];

  return (
    <footer className="mt-20 py-8 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 bg-opacity-50 dark:bg-opacity-50 backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          {/* 左侧：版权信息 */}
          <div className="text-center md:text-left">
            <h3 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
              第一象限
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              © {currentYear} 极速导航网. 保留所有权利.
            </p>
          </div>

          {/* 右侧：常用按钮链接 */}
          <div className="flex flex-wrap justify-center gap-6">
            {footerLinks.map((link, idx) => (
              <a 
                key={idx}
                href={link.url}
                target={link.url.startsWith('http') ? "_blank" : "_self"}
                rel="noopener noreferrer"
                className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
              >
                {link.name}
              </a>
            ))}
            {/* 图标链接示例 */}
            <div className="flex items-center space-x-4 pl-4 border-l border-gray-300 dark:border-gray-700 ml-2">
              <a href="#" className="text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors" title="Github">
                <Github className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-blue-500 transition-colors" title="Email">
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

// 🔹 主应用 (App 组件)
export default function App() {
  const [firebaseApp, setFirebaseApp] = useState(null);
  const [auth, setAuth] = useState(null);
  const [db, setDb] = useState(null);
  const [userId, setUserId] = useState(null);
  const [navData, setNavData] = useState([]);
  const [isDark, setIsDark] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [loginError, setLoginError] = useState('');
  
  // 🔥 新增：搜索框状态
  const [searchTerm, setSearchTerm] = useState(''); 

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
    const unsub = onSnapshot(navCol, snapshot=>{
      const data = snapshot.docs.map(d=>({id:d.id,...d.data()}));
      data.sort((a,b)=>(a.order||0)-(b.order||0));
      setNavData(data);
    });
    return unsub;
  },[db]);

  const fetchData = async ()=>{
    if(!db) return;
    const navCol = collection(db, `artifacts/${APP_ID}/public/data/navData`);
    const snapshot = await getDocs(navCol);
    const data = snapshot.docs.map(d=>({id:d.id,...d.data()}));
    data.sort((a,b)=>(a.order||0)-(b.order||0));
    setNavData(data);
  };

  const handleLogin = async (email,password)=>{
    try {
      await signInWithEmailAndPassword(auth,email,password);
      setShowLogin(false); setLoginError('');
    } catch(e){ setLoginError(e.message); }
  };
  
  // 🔥 新增：根据搜索词过滤导航数据
  const filteredNavData = useMemo(() => {
    if (!searchTerm) {
      return navData; // 搜索词为空，返回全部数据
    }

    const lowerCaseSearchTerm = searchTerm.toLowerCase();

    // 过滤分类列表
    return navData
      .map(category => {
        // 过滤每个分类下的链接
        const filteredLinks = category.links.filter(link => {
          const name = link.name?.toLowerCase() || '';
          const description = link.description?.toLowerCase() || '';
          const url = link.url?.toLowerCase() || '';

          // 匹配链接名称、描述或 URL
          return name.includes(lowerCaseSearchTerm) || 
                 description.includes(lowerCaseSearchTerm) ||
                 url.includes(lowerCaseSearchTerm);
        });

        // 返回一个新的分类对象，只包含匹配的链接
        return {
          ...category,
          links: filteredLinks,
        };
      })
      // 过滤掉链接列表为空的分类
      .filter(category => category.links.length > 0);
  }, [navData, searchTerm]);


  return (
    <div className={`flex flex-col min-h-screen ${isDark?'dark bg-gray-900 text-white':'bg-gray-50 text-gray-900'}`}>
      <DebugBar />
      {showLogin && <LoginModal onClose={()=>setShowLogin(false)} onLogin={handleLogin} error={loginError} />}
      <div className="container mx-auto px-4 py-8 flex-grow">
        <header className="flex justify-between items-center mb-12">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                              第一象限 极速导航网
          </h1>
          <div className="flex gap-4">
            <button onClick={()=>setIsDark(!isDark)} className="p-2 rounded-full bg-gray-200 dark:bg-gray-700">{isDark?<Sun className="w-5 h-5"/>:<Moon className="w-5 h-5"/>}</button>
            {!isAdmin && <button onClick={()=>setShowLogin(true)} className="text-blue-500 font-bold border px-3 py-1 rounded hover:bg-blue-50">管理员登录</button>}
            {isAdmin && <button onClick={()=>signOut(auth)} className="text-red-500">退出管理</button>}
          </div>
        </header>
        
        {/* 🔥 新增：站内搜索框 */}
        {!isAdmin && (
            <div className="mb-8 relative max-w-2xl mx-auto">
                <input 
                    type="text" 
                    placeholder="搜索链接名称、描述或网址..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full py-3 pl-12 pr-4 text-lg border-2 border-blue-300 dark:border-gray-600 rounded-full focus:ring-4 focus:ring-blue-500/50 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all shadow-md"
                />
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-blue-500 dark:text-blue-400"/>
                {searchTerm && (
                    <button 
                        onClick={() => setSearchTerm('')} 
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 rounded-full text-gray-500 hover:text-gray-700 dark:hover:text-white"
                        title="清空搜索"
                    >
                        <X className="w-5 h-5"/>
                    </button>
                )}
            </div>
        )}
        
        {/* 🔥 修改：向 PublicNav 传递过滤后的数据和搜索词 */}
        {isAdmin ? <AdminPanel db={db} navData={navData} fetchData={fetchData} /> : <PublicNav navData={filteredNavData} searchTerm={searchTerm} />}
      </div>
      
      <Footer />
    </div>
  )
}