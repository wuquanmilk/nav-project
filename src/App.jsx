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
// 导入需要的图标
import { ExternalLink, Moon, Sun, User, X, Github, Mail, Globe, Search } from 'lucide-react'; 

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
                <p className="text-gray-500 dark:text-gray-400 mt-2">
                    请在搜索框内选择搜索引擎并按 **Enter** 键进行全网搜索。
                </p>
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

// 🔹 关于本站页面组件
const AboutPage = () => (
    <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg max-w-4xl mx-auto space-y-6 min-h-[60vh]">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white border-b pb-4 mb-4">关于第一象限 极速导航网</h2>
        <div className="space-y-4 text-gray-700 dark:text-gray-300">
            <h3 className="text-xl font-semibold text-blue-600 dark:text-blue-400">【站点功能】</h3>
            <p>
                本站致力于提供一个**简洁、快速、纯粹**的网址导航服务。我们精心筛选了常用、高效和高质量的网站链接，并将它们按类别清晰展示，旨在成为您日常网络冲浪的起点站。
            </p>
            <h3 className="text-xl font-semibold text-blue-600 dark:text-blue-400">【创设初衷：拒绝广告】</h3>
            <p>
                在信息爆炸的时代，许多导航网站充斥着干扰性的广告和推广内容，严重影响了用户体验和访问速度。**第一象限** 创建本站的初衷正是为了提供一个**零广告、零干扰**的净土。我们承诺，本站将永久保持简洁干净，只专注于网址导航这一核心功能。
            </p>
            <h3 className="text-xl font-semibold text-blue-600 dark:text-blue-400">【作者】</h3>
            <p>
                由 <span className="font-bold text-purple-600 dark:text-purple-400">第一象限</span> 独立设计与开发。
                <br/> 
                联系邮箱: 
                <a 
                    href="mailto:115382613@qq.com" 
                    className="text-blue-500 dark:text-blue-400 hover:underline ml-1"
                >
                    115382613@qq.com
                </a>
            </p>
        </div>
    </div>
);

// 🔹 免责声明页面组件
const DisclaimerPage = () => (
    <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg max-w-4xl mx-auto space-y-6 min-h-[60vh]">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white border-b pb-4 mb-4">免责声明</h2>
        <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
            <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400">1. 内容准确性</h3>
            <p>
                本网站（第一象限 极速导航网）所提供的所有链接信息均来源于互联网公开信息或用户提交。本站会尽力确保信息的准确性和时效性，但不对信息的完整性、准确性、时效性或可靠性作任何形式的明示或暗示的担保。
            </p>
            <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400">2. 外部链接责任</h3>
            <p>
                本站提供的所有外部网站链接（包括但不限于导航网站、资源链接等）仅为方便用户访问而设置。本站对任何链接到的第三方网站的内容、政策、产品或服务不承担任何法律责任。用户点击并访问外部链接时，即表示自行承担由此产生的一切风险。
            </p>
            <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400">3. 法律法规遵守</h3>
            <p>
                用户在使用本站服务时，须承诺遵守当地所有适用的法律法规。任何用户利用本站从事违反法律法规的行为，均与本站无关，本站不承担任何法律责任。
            </p>
            <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400">4. 服务中断与修改</h3>
            <p>
                本站保留随时修改、暂停或永久终止提供本网站全部或部分服务的权利，恕不另行通知。因系统维护、网络故障、技术升级等原因导致的服务中断，本站不承担任何责任。
            </p>
            <p className="pt-4 italic text-xs text-gray-500 dark:text-gray-400">
                使用本网站即表示您已阅读、理解并同意本声明的所有内容。
            </p>
        </div>
    </div>
);


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

// 🔹 登录弹窗 
const LoginModal = ({ onClose, onLogin, error }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const handleSubmit = (e) => { e.preventDefault(); onLogin(email, password); };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md p-8 relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"><X className="w-6 h-6"/></button>
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100 flex items-center"><User className="w-6 h-6 mr-3 text-blue-500"/>管理员登录</h2>
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

// 🔹 页脚组件
const Footer = ({ setCurrentPage }) => {
  const currentYear = new Date().getFullYear();
  
  // 自定义常用链接
  const footerLinks = [
    { name: '关于本站', action: () => setCurrentPage('about') },
    { name: '免责声明', action: () => setCurrentPage('disclaimer') },
  ];

  return (
    <footer className="mt-20 py-8 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 bg-opacity-50 dark:bg-opacity-50 backdrop-blur-sm">
      <div className="container mx-auto px-4 text-center">
        {/* 居中内容容器 */}
        <div className="flex flex-col items-center space-y-4"> 
          
          {/* 左侧：版权信息 - 居中 */}
          <div className="text-center">
            <h3 
              className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 cursor-pointer inline-block" 
              onClick={() => setCurrentPage('home')}
            >
              第一象限
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              © {currentYear} 极速导航网. 保留所有权利.
            </p>
          </div>

          {/* 右侧：常用按钮链接和图标 - 居中 */}
          <div className="flex flex-wrap justify-center gap-6">
            {footerLinks.map((link, idx) => (
              <a 
                key={idx}
                href={link.url || '#'} 
                onClick={link.action || null}
                target={link.url ? (link.url.startsWith('http') || link.url.startsWith('mailto') ? "_blank" : "_self") : "_self"}
                rel={link.url ? "noopener noreferrer" : undefined}
                className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 cursor-pointer"
              >
                {link.name}
              </a>
            ))}
            {/* 图标链接示例 */}
            <div className="flex items-center space-x-4 pl-4 border-l border-gray-300 dark:border-gray-700 ml-2">
              {/* GitHub */}
              <a href="https://github.com/wuquanmilk" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors" title="Github">
                <Github className="w-5 h-5" />
              </a>
              {/* Google 链接 */}
              <a href="https://www.google.com/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-red-500 transition-colors" title="Google Search">
                <Globe className="w-5 h-5" /> 
              </a>
              {/* YouTube 链接 */}
              <a href="https://www.youtube.com/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-red-600 transition-colors" title="YouTube">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-youtube">
                    <path d="M2.5 17c-2 0-2-2-2-4v-6c0-2 2-4 4-4h14c2 0 4 2 4 4v6c0 2-2 4-4 4h-14z"/><path d="m10 10 5 2-5 2z"/>
                </svg>
              </a>
              {/* Mail (QQ邮箱) */}
              <a href="https://mail.qq.com/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-500 transition-colors" title="QQ邮箱">
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
  
  // 🔥 新增状态：搜索引擎选择
  const [selectedEngine, setSelectedEngine] = useState('google'); 
  
  // 🔥 更新常量：搜索引擎配置 (添加 Emoji 符号辅助区分)
  const SEARCH_ENGINES = useMemo(() => ({ 
      google: { name: 'Google 🌈', url: 'https://www.google.com/search?q=' }, // 🌈 代表多色
      baidu: { name: '百度 🇨🇳', url: 'https://www.baidu.com/s?wd=' },    // 🇨🇳 代表中国
      bing: { name: 'Bing 🟦', url: 'https://www.bing.com/search?q=' },     // 🟦 代表蓝色/方块
  }), []);


  // 页面状态管理
  const [currentPage, setCurrentPage] = useState('home'); 
  // 搜索框状态
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
  
  // 🔥 更新：处理外部搜索引擎跳转的函数
  const handleExternalSearch = (e) => {
      e.preventDefault(); // 阻止表单默认提交，防止页面刷新
      if (searchTerm.trim()) {
          const query = encodeURIComponent(searchTerm.trim());
          const engineKey = selectedEngine.split(' ')[0].toLowerCase(); // 从 "Google 🌈" 中获取 "google"
          const engine = SEARCH_ENGINES[engineKey];
          
          if (engine) {
              window.open(`${engine.url}${query}`, '_blank');
          }
      }
  };

  // 根据搜索词过滤导航数据
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
        
        {/* 1. Header (按钮区域 - 靠右对齐) */}
        <header className="flex justify-end items-center mb-4">
          <div className="flex gap-4">
            {/* 白天/黑夜切换按钮 */}
            <button 
              onClick={()=>setIsDark(!isDark)} 
              className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              title={isDark ? "切换到白天模式" : "切换到黑夜模式"}
            >
              {isDark?<Sun className="w-5 h-5"/>:<Moon className="w-5 h-5"/>}
            </button>
            
            {/* 管理员登录入口 (人头像图标，中性颜色) */}
            {!isAdmin && (
                <button 
                    onClick={() => setShowLogin(true)} 
                    className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    title="管理员登录"
                >
                    <User className="w-5 h-5"/>
                </button>
            )}
            
            {/* 管理员退出入口 (人头像图标，红色表示退出) */}
            {isAdmin && (
                <button 
                    onClick={() => signOut(auth)} 
                    className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-red-500 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    title="退出管理"
                >
                    <User className="w-5 h-5"/>
                </button>
            )}
          </div>
        </header>
        
        {/* 2. Centered Title Block (居中标题) */}
        <div className="mb-12 text-center">
            <h1 
                className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 cursor-pointer inline-block"
                onClick={() => setCurrentPage('home')}
            >
                极速导航网
            </h1>
        </div>
        
        {/* 🔥 站内搜索框 (垂直堆叠布局，选择器在上，搜索框在下) */}
        {!isAdmin && currentPage === 'home' && (
            <div className="mb-8 max-w-2xl mx-auto"> 
                
                {/* 搜索引擎选择器 - 放在上面并居中 */}
                <div className="mb-3 flex justify-center"> 
                    <select
                        value={selectedEngine}
                        onChange={(e) => setSelectedEngine(e.target.value)}
                        className="py-3 px-4 border-2 border-blue-300 dark:border-gray-600 rounded-full focus:ring-4 focus:ring-blue-500/50 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all shadow-md text-base cursor-pointer min-w-[8rem]"
                    >
                        {/* 循环渲染选项 */}
                        {Object.entries(SEARCH_ENGINES).map(([key, engine]) => (
                            <option key={key} value={key}>{engine.name}</option>
                        ))}
                    </select>
                </div>
                
                {/* 搜索输入框 (表单) - 占满宽度 */}
                <form onSubmit={handleExternalSearch} className="relative"> 
                    <input 
                        type="text" 
                        placeholder={`搜索链接或按 Enter 搜索 ${SEARCH_ENGINES[selectedEngine].name}...`} 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full py-3 pl-12 pr-4 text-lg border-2 border-blue-300 dark:border-gray-600 rounded-full focus:ring-4 focus:ring-blue-500/50 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all shadow-md"
                    />
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-blue-500 dark:text-blue-400"/>
                    {searchTerm && (
                        <button 
                            type="button" 
                            onClick={() => setSearchTerm('')} 
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 rounded-full text-gray-500 hover:text-gray-700 dark:hover:text-white"
                            title="清空搜索"
                        >
                            <X className="w-5 h-5"/>
                        </button>
                    )}
                </form>
            </div>
        )}
        
        {/* 核心内容渲染 */}
        {isAdmin ? (
            <AdminPanel db={db} navData={navData} fetchData={fetchData} />
        ) : (
            currentPage === 'home' ? (
                <PublicNav navData={filteredNavData} searchTerm={searchTerm} />
            ) : currentPage === 'about' ? (
                <AboutPage />
            ) : currentPage === 'disclaimer' ? (
                <DisclaimerPage />
            ) : (
                <PublicNav navData={filteredNavData} searchTerm={searchTerm} /> // 默认返回 Home
            )
        )}
      </div>
      
      {/* 传递 setCurrentPage 函数到 Footer */}
      <Footer setCurrentPage={setCurrentPage} />
    </div>
  )
}