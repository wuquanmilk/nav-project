import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword // ⭐️ 新增：导入注册函数
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
import { 
  ExternalLink, Moon, Sun, LogIn, X, Github, Mail, Globe, Search, User,
  Cloud, Database, Bot, Play, Camera, Network, Server, ShoppingCart, Wand, Monitor, Wrench, Code
} from 'lucide-react'; 

// 🔹 配置你的管理员 UID
const ADMIN_USER_ID = '6UiUdmPna4RJb2hNBoXhx3XCTFN2'; // 替换为您的管理员 UID
const APP_ID = 'default-app-id';

// ⭐️ 谷歌图标 Base64 SVG 编码 (用于国际版稳定性修复，防止动态加载失败) ⭐️
const GOOGLE_BASE64_ICON = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0OCA0OCI+PHBhdGggZmlsbD0iI0VBNDMzNSIgZD0iTTI0IDQ4YzYuNDggMCAxMS45My0yLjQ4IDE1LjgzLTcuMDhMMzQuMjIgMzYuM2MtMi44MSAxLjg5LTYuMjIgMy05LjkzIDMtMTIuODggMC0yMy41LTEwLjQyLTIzLjUtMjMuNDggMC01LjM2IDEuNzYtMTAuMyA0Ljc0LTE0LjM1TDkuNjggMi45OEM0LjAyIDcuNzEgMCAxNS40MyAwIDI0LjUyIDAgMzcuNDggMTAuNzQgNDggMjQgNDh6Ii8+PHBhdGogZmlsbD0iIzQyODVGNCIgZD0iTTQ2Ljk4IDI0LjU1Yz羞思T1.NTctLjE1LTMuMDktLjM4LTQuNTVIMjR2OS4wMmgxMi45NGMtMC41OCAyLjk2LTIuMjYgNS40OC00Ljc4IDcuMThsNy43MzYgNi4xOTY0LjUxLTQuMTggNy4wOS0xMC4zNiA3LjA5LTE3LjY1eiIvPjxwYXRoZmlsbD0iI0ZCQkMwNSIgZD0iTTEwLjUzIDI4LjU5Yy0wLjQ4LTEuNDUtLjc2LTIuOTktLjc2LTQuNTlzMC4yNy0zLjE0Ljc2LTQuNTlsLTcuOTgtNi4xOUMuOTIgMTYuNDYgMCAyMC4xMiAwIDI0YzAgMy44OC45MiA3LjU0IDIuNTYgMTAuNzhsNy45Ny02LjE5eiIvPjxwYXRoIGZpbGw9IiMzNEE4NTMiIGQ9Ik0xMC41MyAxNi4yNEM3LjI4IDE5LjAzIDQuODcgMjMuMDMgNC44NyAyNC45OWMwLjAwMSAzgcyLS42NiA3LjQ2LTkuNTVsLTcuOTgtNi4xOUM2LjUyIDcuNjcgMTQuNjMgMy42NCAyNCAzLjY0YzIuOTkgMCA1Ljc4LjU1IDguNDQgMS41NGwtNS43OCAzLjI0Yy0xLjUzLS43MS0zLjIzLS45OS00Ljk3LS45OS01LjM2IDAtMTAuMzMgMi40Ni0xMy42NiA2LjE1eiIvPjwvc3ZnPg==';
// =========================================================================
// 核心数据定义：外部搜索引擎列表
// =========================================================================

// 国际版搜索引擎
const FULL_EXTERNAL_ENGINES = [
    { name: 'Google', url: 'https://www.google.com/search?q=', icon: GOOGLE_BASE64_ICON },
    { name: 'Bing', url: 'https://www.bing.com/search?q=', icon: 'https://www.bing.com/favicon.ico' },
    { name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=', icon: 'https://duckduckgo.com/favicon.ico' },
    { name: 'GitHub', url: 'https://github.com/search?q=', icon: 'https://github.com/favicon.ico' },
    { name: 'Stack Overflow', url: 'https://stackoverflow.com/search?q=', icon: 'https://cdn.sstatic.net/Sites/stackoverflow/Img/favicon.ico' },
];

// 国内版搜索引擎
const DOMESTIC_EXTERNAL_ENGINES = [
    { name: '百度', url: 'https://www.baidu.com/s?wd=', icon: 'https://www.baidu.com/favicon.ico' },
    { name: 'Bing (国内)', url: 'https://cn.bing.com/search?q=', icon: 'https://cn.bing.com/favicon.ico' },
    { name: '搜狗', url: 'https://www.sogou.com/web?query=', icon: 'https://www.sogou.com/favicon.ico' },
];

// =========================================================================
// 核心数据定义：默认导航数据
// =========================================================================

// 国际版默认导航数据
const FULL_NAV_DATA = [
    {
        id: 'cat-1',
        category: '常用开发',
        order: 0,
        links: [
            { name: 'HuggingFace', url: 'https://huggingface.co/', description: 'AI/ML 模型共享与协作社区', icon: 'Bot' },
            { name: 'GitHub', url: 'https://github.com/', description: '全球最大的代码托管平台', icon: 'Code' },
            { name: 'Stack Overflow', url: 'https://stackoverflow.com/', description: '开发者问答社区', icon: 'Wrench' },
        ],
    },
    {
        id: 'cat-2',
        category: 'AI 工具',
        order: 1,
        links: [
            { name: 'ChatGPT', url: 'https://chat.openai.com/', description: 'OpenAI 语言模型', icon: 'Cloud' },
            { name: 'Google Gemini', url: 'https://gemini.google.com/', description: '谷歌 AI 助手', icon: 'Database' },
        ],
    },
];

// 国内版默认导航数据
const DOMESTIC_NAV_DATA = [
    {
        id: 'cat-1',
        category: '常用工具',
        order: 0,
        links: [
            { name: '百度', url: 'https://www.baidu.com/', description: '国内常用搜索引擎', icon: 'Search' },
            { name: '淘宝', url: 'https://www.taobao.com/', description: '电商购物平台', icon: 'ShoppingCart' },
        ],
    },
];
// =========================================================================
// 核心切换开关：国内版 / 国际版 (保持不变)
// =========================================================================

const IS_DOMESTIC_VERSION = false; 
// ... (FULL_EXTERNAL_ENGINES, FULL_NAV_DATA, DOMESTIC_EXTERNAL_ENGINES, DOMESTIC_NAV_DATA 保持不变) ...

// 核心数据选择逻辑 (保持不变)
const APP_TITLE = IS_DOMESTIC_VERSION ? '极速导航网 (国内版)' : '极速导航网 (国际版)';
const EXTERNAL_ENGINES = IS_DOMESTIC_VERSION ? DOMESTIC_EXTERNAL_ENGINES : FULL_EXTERNAL_ENGINES;
const DEFAULT_NAV_DATA = IS_DOMESTIC_VERSION ? DOMESTIC_NAV_DATA : FULL_NAV_DATA;


// =========================================================================
// ⬇️ 辅助组件 (LinkIcon, SearchLayout, LinkCard, PublicNav, LinkForm 保持不变) ⬇️
// =========================================================================

// ... (此处省略 LinkIcon, SearchLayout, LinkCard, PublicNav, LinkForm 等辅助组件的代码，与您文件中的保持一致) ...


// 🔹 注册弹窗 (RegisterModal)  <- 新增组件
const RegisterModal = ({ onClose, onRegister, error, onSwitchToLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const handleSubmit = (e) => { e.preventDefault(); onRegister(email, password); };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md p-8 relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"><X className="w-6 h-6"/></button>
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100 flex items-center"><User className="w-6 h-6 mr-3 text-green-500"/>新用户注册</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="email" placeholder="邮箱" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" required/>
          <input type="password" placeholder="密码 (至少6位)" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" required/>
          {error && <div className="text-sm p-3 bg-red-100 text-red-700 rounded-lg">{error}</div>}
          <button type="submit" className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg">注册</button>
        </form>
        <div className="mt-4 text-center">
            <button onClick={onSwitchToLogin} className="text-sm text-blue-500 hover:underline">
                已有账号？去登录
            </button>
        </div>
      </div>
    </div>
  );
};

// 🔹 登录弹窗 (LoginModal) (已修改，增加切换到注册按钮)
const LoginModal = ({ onClose, onLogin, error, onSwitchToRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const handleSubmit = (e) => { e.preventDefault(); onLogin(email, password); };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md p-8 relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"><X className="w-6 h-6"/></button>
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100 flex items-center"><LogIn className="w-6 h-6 mr-3 text-blue-500"/>用户登录</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="email" placeholder="邮箱" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" required/>
          <input type="password" placeholder="密码" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" required/>
          {error && <div className="text-sm p-3 bg-red-100 text-red-700 rounded-lg">{error}</div>}
          <button type="submit" className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg">登录</button>
          {/* ⭐️ 新增：切换到注册按钮 ⭐️ */}
          <div className="mt-4 text-center">
              <button onClick={onSwitchToRegister} className="text-sm text-blue-500 hover:underline">
                  没有账号？去注册
              </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// 🔹 管理面板 (AdminPanel) (已修改，适应多用户路径)
const AdminPanel = ({ db, navData, fetchData, userId, isAdmin }) => {
    // ⭐️ 核心修改：根据用户身份确定操作路径 ⭐️
    const collectionPath = isAdmin 
        ? `artifacts/${APP_ID}/public/data/navData` // 管理员操作公共数据
        : `users/${userId}/data/navData`;         // 普通用户操作私有数据
        
    const navCollection = collection(db, collectionPath);
    
    // ... (handleAddCategory, startEdit, saveEdit, handleDelete 函数保持不变，但它们现在会使用上面定义的 navCollection)
    const handleAddCategory = async () => {
        if (!newCategory.category) return alert('请输入分类名称');
        // ... (保持不变) ...
    };
    // ... (其他函数省略以保持简洁，但它们都自动使用了 navCollection)

    // ... (AdminPanel 内部逻辑保持不变) ...
    // 请确保您的 AdminPanel 中也使用了正确的 saveEdit, handleDelete 逻辑，这里只展示关键的路径获取。
    const [newCategory, setNewCategory] = useState({ category: '', order: 0, links: [] });
    const [editId, setEditId] = useState(null);
    const [editData, setEditData] = useState({});

    const startEdit = (item) => { 
      const linksWithIcon = item.links ? item.links.map(link => ({...link, icon: link.icon || '' })) : [];
      setEditId(item.id); 
      setEditData({...item, links: linksWithIcon}); 
    };
    const saveEdit = async () => { 
      const linksWithIcon = editData.links.map(link => ({...link, icon: link.icon || '' }));
      await updateDoc(doc(db, collectionPath, editId), {...editData, links: linksWithIcon}); // 使用 collectionPath
      setEditId(null); 
      fetchData(); 
    };
    const handleDelete = async (id) => { 
      if(window.confirm(`确认删除分类: ${navData.find(d => d.id === id)?.category} 吗?`)) {
          await deleteDoc(doc(db, collectionPath, id)); // 使用 collectionPath
          fetchData();
      }
    };
    
    return (
        <div className="mt-6 p-4 border rounded bg-gray-50 dark:bg-gray-800">
            <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">
                {isAdmin ? '管理员面板 (公共数据)' : '我的面板 (私有数据)'}
            </h3>
            <div className="p-4 mb-4 bg-white dark:bg-gray-700 rounded-lg shadow">
                <h4 className="font-semibold mb-2 text-gray-800 dark:text-gray-100">新增分类</h4>
                <div className="flex flex-col gap-3">
                    <input placeholder="分类名" className="border p-2 rounded w-full dark:bg-gray-600 dark:border-gray-500" value={newCategory.category} onChange={e => setNewCategory({...newCategory, category:e.target.value})}/>
                    <div className="flex items-center space-x-2">
                        <span className="text-gray-600 dark:text-gray-300">排序:</span>
                        <input type="number" placeholder="0" className="border p-2 rounded w-20 dark:bg-gray-600 dark:border-gray-500" value={newCategory.order} onChange={e => setNewCategory({...newCategory, order:Number(e.target.value)})}/>
                    </div>
                    <LinkForm links={newCategory.links} setLinks={(links)=>setNewCategory({...newCategory, links})}/>
                    <button onClick={handleAddCategory} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 self-start">新增分类</button>
                </div>
            </div>
            
            <h4 className="font-semibold mb-2 text-gray-800 dark:text-white">现有分类</h4>
            {navData.map(item=>(
              <div key={item.id} className="border p-3 mb-3 rounded bg-white dark:bg-gray-700 shadow-sm">
                {editId === item.id ? (
                  // 编辑状态
                  <>
                    <input className="border p-1 mb-2 rounded w-full dark:bg-gray-600 dark:border-gray-500" value={editData.category} onChange={e=>setEditData({...editData, category:e.target.value})}/>
                    <div className="flex items-center space-x-2 mb-2">
                        <span className="text-gray-600 dark:text-gray-300">排序:</span>
                        <input type="number" className="border p-1 rounded w-20 dark:bg-gray-600 dark:border-gray-500" value={editData.order} onChange={e=>setEditData({...editData, order:Number(e.target.value)})}/>
                    </div>
                    <LinkForm links={editData.links} setLinks={(links)=>setEditData({...editData, links})}/>
                    <div className="flex space-x-2 mt-3">
                      <button onClick={saveEdit} className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600">保存</button>
                      <button onClick={()=>setEditId(null)} className="bg-gray-400 text-white px-3 py-1 rounded hover:bg-gray-500">取消</button>
                    </div>
                  </>
                ) : (
                  // 显示状态
                  <>
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-bold text-gray-800 dark:text-gray-100">{item.category} (排序: {item.order})</h4>
                      <div className="flex space-x-2">
                        <button onClick={()=>startEdit(item)} className="bg-yellow-500 text-white text-sm px-3 py-1 rounded hover:bg-yellow-600">编辑</button>
                        <button onClick={()=>handleDelete(item.id)} className="bg-red-500 text-white text-sm px-3 py-1 rounded hover:bg-red-600">删除</button>
                      </div>
                    </div>
                    <ul className="ml-4 space-y-0.5 text-sm text-gray-600 dark:text-gray-300">
                      {item.links?.map((l,idx)=><li key={idx} className="truncate">{l.name} - <span className="text-blue-500">{l.url}</span></li>)}
                    </ul>
                  </>
                )}
              </div>
            ))}
        </div>
    );
};


// 🔹 首页组件 (HomePage) (核心逻辑修改)
const HomePage = () => { 
    // ... (现有状态保持不变，新增 userId 和 showRegisterModal)
    const [theme, setTheme] = useState('light');
    const [navData, setNavData] = useState(DEFAULT_NAV_DATA); 
    const [searchTerm, setSearchTerm] = useState('');
    const [user, setUser] = useState(null);
    const [userId, setUserId] = useState(null); // ⭐️ 新增：存储真实 UID 或 'anonymous'
    const [isAdmin, setIsAdmin] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showRegisterModal, setShowRegisterModal] = useState(false); // ⭐️ 新增：注册弹窗状态
    const [loginError, setLoginError] = useState('');
    const [currentPage, setCurrentPage] = useState('home'); 

    // Firebase App 初始化 
    const firebaseConfig = {
      // ❗❗❗ 请在这里填写您真实的 Firebase 配置 ❗❗❗
      apiKey: "YOUR_API_KEY", 
      authDomain: "YOUR_AUTH_DOMAIN", 
      projectId: "YOUR_PROJECT_ID", 
      storageBucket: "YOUR_STORAGE_BUCKET",
      messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
      appId: "YOUR_APP_ID",
      // ❗❗❗ ❗❗❗ ❗❗❗ ❗❗❗ ❗❗❗ ❗❗❗
    };

    const app = useMemo(() => {
        try {
            return initializeApp(firebaseConfig);
        } catch (e) {
            console.error("Firebase already initialized or config error:", e);
            return null;
        }
    }, []);

    const db = app ? getFirestore(app) : null;
    const auth = app ? getAuth(app) : null;

    useEffect(() => {
        // 主题设置逻辑 (保持不变)
        const localTheme = localStorage.getItem('theme');
        // ... (省略主题逻辑) ...
    }, []);

    // 认证状态监听 (已修改)
    useEffect(() => {
        if (!auth) return;
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                // ⭐️ 核心逻辑：区分匿名用户和注册用户 ⭐️
                if (currentUser.isAnonymous) {
                    setUserId('anonymous'); // 游客使用 'anonymous' 标记
                } else {
                    setUserId(currentUser.uid); // 注册用户使用真实 UID
                }
                // 检查是否为管理员 UID
                setIsAdmin(currentUser.uid === ADMIN_USER_ID);
            } else {
                // 如果用户未登录，自动执行匿名登录，作为默认游客身份
                signInAnonymously(auth).catch(console.error);
                setUserId(null); // 在登录完成前保持 null
                setIsAdmin(false);
            }
        });
        return () => unsubscribe();
    }, [auth]);

    // Firestore 数据获取 (已修改：实现数据隔离)
    const fetchData = () => {
        // 确保 db 和 userId 状态被设置
        if (!db || !userId) {
            return () => {};
        }

        let collectionPath;
        let isPublicData = false;

        if (userId === 'anonymous' || isAdmin) {
            // 游客和管理员都读取公共数据
            collectionPath = `artifacts/${APP_ID}/public/data/navData`;
            isPublicData = true;
        } else {
            // 普通注册用户：读取自己的私有数据
            collectionPath = `users/${userId}/data/navData`;
        }

        const navCollection = collection(db, collectionPath);

        const unsubscribe = onSnapshot(navCollection, (snapshot) => {
            let data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            if (data.length === 0 && !isPublicData) {
                // 注册用户第一次登录，私有数据为空，使用默认硬编码数据作为起点
                console.log("User private data empty, using default hardcoded data.");
                data = DEFAULT_NAV_DATA.map(cat => ({...cat, id: cat.category.replace(/\s/g, '-') })); // 确保有临时ID
            } else if (data.length === 0 && isPublicData) {
                 // 公共数据为空，使用默认硬编码数据作为回退
                data = DEFAULT_NAV_DATA;
            }

            // 排序并更新状态
            setNavData(data.sort((a, b) => a.order - b.order));

        }, (error) => {
            console.error("Error fetching Firestore data, using default data:", error);
            // Firebase 错误时，使用默认硬编码数据作为最终回退
            setNavData(DEFAULT_NAV_DATA.sort((a, b) => a.order - b.order));
        });
        return () => unsubscribe();
    };

    useEffect(() => {
        const cleanup = fetchData();
        return cleanup;
    }, [db, userId, isAdmin]); // 依赖项现在包括 userId 和 isAdmin

    // 注册处理函数 (新增)
    const handleRegister = async (email, password) => {
        setLoginError('');
        try {
          // 1. 注册新用户
          await createUserWithEmailAndPassword(auth, email, password);
          // 2. 注册成功后，onAuthStateChanged 会触发更新 userId
          setShowRegisterModal(false); 
          setShowLoginModal(false);
        } catch(e){ 
            setLoginError(`注册失败: ${e.message}`); 
        }
    };

    const handleLogin = async (email, password) => {
        setLoginError('');
        try {
            await signInWithEmailAndPassword(auth, email, password);
            setShowLoginModal(false);
            setShowRegisterModal(false);
        } catch (error) {
            console.error("Login failed:", error);
            setLoginError('登录失败：邮箱或密码错误，或权限不足。');
        }
    };

    const handleToggleTheme = () => {
        // ... (主题切换逻辑保持不变) ...
    };

    const filteredNavData = useMemo(() => {
        // ... (过滤逻辑保持不变) ...
    }, [navData, searchTerm]);


    return (
        <div className={`min-h-screen ${theme === 'dark' ? 'dark' : ''}`}>
            <div className="bg-gray-100 dark:bg-gray-900 transition-colors duration-300 min-h-screen pt-4">
              <div className="container mx-auto px-4 max-w-7xl">
        
                {/* 头部导航栏 */}
                <header className="flex justify-between items-center py-4 mb-8">
                    <h1 
                        className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 cursor-pointer" 
                        onClick={() => setCurrentPage('home')}
                    >
                        {APP_TITLE}
                    </h1>
                    <div className="flex items-center space-x-3">
                        {/* 主页按钮 (保持不变) */}
                        <button 
                            onClick={() => setCurrentPage('home')} 
                            className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-blue-500 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                            title="主页"
                        >
                            <Globe className="w-5 h-5"/>
                        </button>

                        {/* 主题切换按钮 (保持不变) */}
                        <button 
                            onClick={handleToggleTheme} 
                            className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                            title="切换主题"
                        >
                            {theme === 'light' ? <Moon className="w-5 h-5"/> : <Sun className="w-5 h-5"/>}
                        </button>

                        {/* ⭐️ 核心认证按钮逻辑 (已修改) ⭐️ */}
                        {userId && userId !== 'anonymous' ? (
                            // 已登录用户 (普通客户或管理员)
                            <button 
                                onClick={() => signOut(auth)} 
                                className="p-2 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
                                title={isAdmin ? `退出管理 (${user?.email})` : `退出登录 (${user?.email})`}
                            >
                                <User className="w-5 h-5"/> 
                            </button>
                        ) : (
                            // 游客 (匿名用户) 或未完成初始化
                            <div className="flex space-x-2">
                                <button 
                                    onClick={() => setShowLoginModal(true)} 
                                    className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                                    title="客户/管理员登录"
                                >
                                    <LogIn className="w-5 h-5"/> 
                                </button>
                                <button 
                                    onClick={() => setShowRegisterModal(true)} 
                                    className="p-2 rounded-full bg-green-500 text-white hover:bg-green-600 transition-colors"
                                    title="新用户注册"
                                >
                                    <User className="w-5 h-5"/> 
                                </button>
                            </div>
                        )}
                    </div>
                </header>
                
                {/* 搜索区域 */}
                <SearchLayout searchTerm={searchTerm} setSearchTerm={setSearchTerm}/>
                
                {/* 核心内容渲染 */}
                {(userId && userId !== 'anonymous') ? (
                    // ⭐️ 注册用户或管理员登录后，显示 AdminPanel 供其修改自己的数据 ⭐️
                    <AdminPanel 
                        db={db} 
                        navData={navData} 
                        fetchData={fetchData}
                        userId={userId} // 传递 userId
                        isAdmin={isAdmin} // 传递 isAdmin
                    />
                ) : (
                    // 游客或匿名用户，显示公共导航
                    currentPage === 'home' ? (
                        <PublicNav navData={filteredNavData} searchTerm={searchTerm} />
                    ) : currentPage === 'about' ? (
                        <AboutPage />
                    ) : currentPage === 'disclaimer' ? (
                        <DisclaimerPage />
                    ) : (
                        <PublicNav navData={filteredNavData} searchTerm={searchTerm} />
                    )
                )}
              </div>
            </div>
            
            <Footer setCurrentPage={setCurrentPage} appTitle={APP_TITLE} />
            
            {/* 登录/注册弹窗渲染 (已修改) */}
            {showLoginModal && (
                <LoginModal 
                    onClose={() => setShowLoginModal(false)} 
                    onLogin={handleLogin} 
                    error={loginError}
                    onSwitchToRegister={() => { setShowLoginModal(false); setShowRegisterModal(true); }} // 切换到注册
                />
            )}
            {showRegisterModal && (
                <RegisterModal 
                    onClose={() => setShowRegisterModal(false)} 
                    onRegister={handleRegister} 
                    error={loginError}
                    onSwitchToLogin={() => { setShowRegisterModal(false); setShowLoginModal(true); }} // 切换到登录
                />
            )}
        </div>
    );
};

// ... (Footer, AboutPage, DisclaimerPage 保持不变) ...

// 默认导出主应用组件
export default HomePage;