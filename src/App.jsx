import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  signInAnonymously,
  signInWithCustomToken,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  onSnapshot,
  doc,
  addDoc,
  deleteDoc,
  updateDoc,
  writeBatch,
  getDocs,
  setDoc,
  query,
} from 'firebase/firestore';
import {
  Search,
  Settings,
  LogIn,
  LogOut,
  Plus,
  Edit3,
  Trash2,
  ExternalLink,
  X,
  Save,
  Download,
  Loader,
  Moon,
  Sun,
  Home,
  AlertTriangle,
  Info,
  Layers,
} from 'lucide-react';

// =========================================================================
// MOCK DEFAULT DATA (模拟导航站数据)
// =========================================================================
const MOCK_DEFAULT_DATA = [
  {
    category: 'AI 智能工具',
    order: 10,
    links: [
      { name: 'ChatGPT', url: 'https://openai.com/chatgpt', description: '强大的语言模型', icon: 'https://openai.com/' },
      { name: 'Gemini', url: 'https://gemini.google.com/', description: 'Google 的下一代 AI 模型', icon: 'https://google.com/' },
      { name: 'Midjourney', url: 'https://www.midjourney.com/', description: 'AI 艺术创作工具', icon: 'https://www.midjourney.com/' },
      { name: 'Claude', url: 'https://claude.ai/', description: 'Anthropic 的高性能模型', icon: 'https://claude.ai/' },
    ],
  },
  {
    category: '前端开发资源',
    order: 20,
    links: [
      { name: 'GitHub', url: 'https://github.com/', description: '代码托管与协作平台', icon: 'https://github.com/' },
      { name: 'MDN Web Docs', url: 'https://developer.mozilla.org/', description: 'Web 技术权威文档', icon: 'https://developer.mozilla.org/' },
      { name: 'React 官方', url: 'https://react.dev/', description: '构建用户界面的 JavaScript 库', icon: 'https://react.dev/' },
      { name: 'Tailwind CSS', url: 'https://tailwindcss.com/', description: '实用工具优先的 CSS 框架', icon: 'https://tailwindcss.com/' },
      { name: 'Vite', url: 'https://vitejs.dev/', description: '下一代前端工具链', icon: 'https://vitejs.dev/' },
    ],
  },
  {
    category: '设计与素材',
    order: 30,
    links: [
      { name: 'Figma', url: 'https://www.figma.com/', description: '在线协作式设计工具', icon: 'https://www.figma.com/' },
      { name: 'Unsplash', url: 'https://unsplash.com/', description: '免费高清图库', icon: 'https://unsplash.com/' },
      { name: 'Iconify', url: 'https://iconify.design/', description: '数千个图标集成的平台', icon: 'https://iconify.design/' },
    ],
  },
  {
    category: '效率工具',
    order: 40,
    links: [
      { name: 'Google 搜索', url: 'https://www.google.com/', description: '全球最流行的搜索引擎', icon: 'https://www.google.com/' },
      { name: 'DeepL 翻译', url: 'https://www.deepl.com/translator', description: '高精度 AI 翻译', icon: 'https://www.deepl.com/' },
      { name: 'Notion', url: 'https://www.notion.so/', description: '笔记、项目和知识库一体化平台', icon: 'https://www.notion.so/' },
    ],
  },
];


// =========================================================================
// 调试组件 (保持不变)
// =========================================================================
const DebugBar = ({ userId, isAdmin, adminUidConfigured }) => {
  if (process.env.NODE_ENV === 'production' && isAdmin) return null;

  return (
    <div className="bg-yellow-100 text-yellow-800 p-2 text-xs font-mono break-all z-50 relative">
      <strong>🔧 调试信息 (仅供排查):</strong>
      <br/>
      当前用户 UID: <strong className="text-red-600">{userId || '未登录'}</strong>
      <br/>
      代码中配置的 ADMIN_UID: <strong>{adminUidConfigured}</strong>
      <br/>
      当前权限状态: <strong>{isAdmin ? '✅ 管理员' : '❌ 访客'}</strong>
      <br/>
      <span className="text-red-600">如果不匹配，请复制"当前用户 UID"，替换代码中的 ADMIN_USER_ID。</span>
    </div>
  );
};

// =========================================================================
// LinkCard (链接卡片组件)
// =========================================================================

const LinkCard = ({ link, onEdit, onDelete, isAdmin }) => {
  const faviconUrl = useMemo(() => {
    try {
      const urlObj = new URL(link.icon || link.url);
      return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=64`;
    } catch (e) {
      return 'https://placehold.co/40x40/ccc/000?text=L';
    }
  }, [link.icon, link.url]);

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] flex flex-col h-full border border-gray-100 dark:border-gray-700">
      <a href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-4 flex-grow group">
        <div className="flex-shrink-0 w-10 h-10 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 flex items-center justify-center">
          <img
            src={faviconUrl}
            alt={`${link.name} icon`}
            className="w-full h-full object-cover"
            onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/40x40/ccc/000?text=L'; }}
          />
        </div>
        <div className="min-w-0 flex-grow">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">
            {link.name}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5">
            {link.description}
          </p>
        </div>
        <ExternalLink className="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-blue-500 transition-colors flex-shrink-0" />
      </a>

      {isAdmin && (
        <div className="flex justify-end space-x-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
          <button
            onClick={(e) => { e.preventDefault(); onEdit(link); }}
            className="p-1.5 rounded-full text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors"
            title="编辑链接"
          >
            <Edit3 className="w-5 h-5" />
          </button>
          <button
            onClick={(e) => { e.preventDefault(); onDelete(link); }}
            className="p-1.5 rounded-full text-red-500 hover:bg-red-100 dark:hover:bg-red-900 transition-colors"
            title="删除链接"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};

// =========================================================================
// Modals (模态框)
// =========================================================================

const ModalWrapper = ({ children, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[9999] p-4 backdrop-blur-sm">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md p-8 relative transform transition-all duration-300 scale-100">
            <button 
                onClick={onClose} 
                className="absolute top-4 right-4 p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
                <X className="w-6 h-6" />
            </button>
            {children}
        </div>
    </div>
);

const LoginModal = ({ onClose, onLogin, error }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(email, password);
  };

  return (
    <ModalWrapper onClose={onClose}>
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100 flex items-center">
            <LogIn className="w-6 h-6 mr-3 text-blue-500" />
            管理员登录
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">邮箱</label>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                />
            </div>
            <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">密码</label>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                />
            </div>
            {error && (
                <div className="text-sm p-3 bg-red-100 text-red-700 rounded-lg">
                    {error}
                </div>
            )}
            <button type="submit" className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors">
                登录
            </button>
        </form>
    </ModalWrapper>
  );
};

const LinkEditModal = ({ onClose, onSave, initialLink = {}, categories = [] }) => {
    const [link, setLink] = useState({
        name: '', url: '', description: '', icon: '', categoryId: categories[0]?.id || '', ...initialLink
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setLink(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(link);
    };

    const isEditing = !!initialLink.id;

    return (
        <ModalWrapper onClose={onClose}>
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100 flex items-center">
                <Edit3 className="w-6 h-6 mr-3 text-blue-500" />
                {isEditing ? '编辑链接' : '新增链接'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <input type="hidden" name="id" value={link.id || ''} />
                
                {categories.length > 0 && (
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">所属分类</label>
                        <select
                            name="categoryId"
                            value={link.categoryId}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            required
                        >
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.category}</option>
                            ))}
                        </select>
                    </div>
                )}
                
                {['name', 'url', 'description', 'icon'].map((field) => (
                    <div key={field}>
                        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                            {field === 'name' && '名称*'}
                            {field === 'url' && '链接 (URL)*'}
                            {field === 'description' && '描述'}
                            {field === 'icon' && '图标 (留空自动生成)'}
                        </label>
                        <input
                            type="text"
                            name={field}
                            value={link[field]}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            required={field === 'name' || field === 'url'}
                        />
                    </div>
                ))}
                
                <button type="submit" className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center">
                    <Save className="w-5 h-5 mr-2" />
                    {isEditing ? '保存修改' : '立即添加'}
                </button>
            </form>
        </ModalWrapper>
    );
};

const CategoryEditModal = ({ onClose, onSave, initialCategory = {} }) => {
    const [category, setCategory] = useState({
        category: '', order: '', ...initialCategory
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setCategory(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(category);
    };

    const isEditing = !!initialCategory.id;

    return (
        <ModalWrapper onClose={onClose}>
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100 flex items-center">
                <Layers className="w-6 h-6 mr-3 text-blue-500" />
                {isEditing ? '编辑分类' : '新增分类'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <input type="hidden" name="id" value={category.id || ''} />
                
                {['category', 'order'].map((field) => (
                    <div key={field}>
                        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                            {field === 'category' && '分类名称*'}
                            {field === 'order' && '排序值 (数字)*'}
                        </label>
                        <input
                            type={field === 'order' ? 'number' : 'text'}
                            name={field}
                            value={category[field]}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            required
                        />
                    </div>
                ))}
                
                <button type="submit" className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center">
                    <Save className="w-5 h-5 mr-2" />
                    {isEditing ? '保存分类' : '新增分类'}
                </button>
            </form>
        </ModalWrapper>
    );
};


// =========================================================================
// PublicNav & SearchBar (展示组件)
// =========================================================================
const SearchBar = ({ searchTerm, onSearchChange, onClear }) => (
    <div className="relative max-w-2xl mx-auto mb-12">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
        <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="搜索链接名称或描述..."
            className="w-full p-4 pl-12 rounded-full border shadow-lg focus:ring-4 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white transition-all duration-200"
        />
        {searchTerm && (
            <button onClick={onClear} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1.5 rounded-full">
                <X className="w-5 h-5"/>
            </button>
        )}
    </div>
);

const PublicNav = ({ navData, searchTerm }) => {
    // 过滤逻辑
    const filteredNavData = useMemo(() => {
        if (!searchTerm) return navData;
        const lowerCaseSearch = searchTerm.toLowerCase();

        return navData.map(cat => ({
            ...cat,
            links: cat.links.filter(link => 
                link.name.toLowerCase().includes(lowerCaseSearch) ||
                link.description.toLowerCase().includes(lowerCaseSearch) ||
                cat.category.toLowerCase().includes(lowerCaseSearch)
            )
        })).filter(cat => cat.links.length > 0);
    }, [navData, searchTerm]);

    if (filteredNavData.length === 0 && searchTerm) {
        return (
             <div className="text-center py-16 text-gray-500 dark:text-gray-400">
                <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
                <p className="text-xl font-semibold">未找到匹配 "{searchTerm}" 的结果</p>
                <p>请尝试其他关键词或检查拼写。</p>
            </div>
        )
    }

    return (
        <div className="space-y-10">
            {filteredNavData.map(cat => (
                <section key={cat.id || cat.category} id={`cat-${cat.id}`} className="p-6">
                    <h2 className="text-3xl font-extrabold mb-6 text-gray-800 dark:text-white border-l-4 border-blue-500 pl-4 transition-colors duration-300">
                        {cat.category}
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                        {cat.links?.map((link, index) => 
                             // 传递 isadmin={false}
                            <LinkCard key={link.id || index} link={link} isAdmin={false} />
                        )}
                    </div>
                </section>
            ))}
        </div>
    );
};


// =========================================================================
// AdminPanel (管理面板)
// =========================================================================

const AdminPanel = ({ 
    navData, 
    onLoadDefaultData, 
    onEditLink, 
    onDeleteLink, 
    onAddLink,
    onAddCategory,
    onEditCategory,
    onDeleteCategory
}) => {
     // 过滤掉没有链接的分类，方便管理
    const filteredNavData = navData.filter(cat => cat.links && cat.links.length > 0);

    return (
        <div className="space-y-12">
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-blue-50 dark:bg-gray-700 rounded-xl shadow-md">
                <h2 className="text-2xl font-bold text-blue-800 dark:text-blue-200">导航管理中心</h2>
                <div className="flex gap-3">
                    <button 
                        onClick={onAddCategory}
                        className="flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors text-sm shadow-md"
                        title="新增一个空分类"
                    >
                        <Layers className="w-4 h-4 mr-2" />
                        新增分类
                    </button>
                    <button 
                        onClick={() => onAddLink({})} // 传递空对象以新增链接
                        className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors text-sm shadow-md"
                        title="新增一个链接"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        新增链接
                    </button>
                     <button 
                        onClick={onLoadDefaultData} 
                        className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors text-sm shadow-md"
                        title="清空当前数据并加载内置模板"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        加载默认数据
                    </button>
                </div>
            </div>

            {navData.length === 0 ? (
                <div className="text-center py-20 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-xl shadow-inner">
                    <Info className="w-12 h-12 mx-auto mb-4 text-blue-500" />
                    <p className="text-xl font-semibold mb-3">当前没有数据</p>
                    <p>请点击上方的 **加载默认数据** 或 **新增分类/链接** 来开始创建您的导航站。</p>
                </div>
            ) : (
                <div className="space-y-8">
                    {navData.map(cat => (
                        <div key={cat.id} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl border border-blue-100 dark:border-blue-900">
                            <div className="flex items-center justify-between mb-6 pb-3 border-b border-gray-100 dark:border-gray-700">
                                <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white">
                                    {cat.category} 
                                    <span className="ml-3 text-sm font-normal text-gray-500 dark:text-gray-400"> (排序: {cat.order || 0})</span>
                                </h3>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => onEditCategory(cat)}
                                        className="p-2 rounded-full text-purple-500 hover:bg-purple-100 dark:hover:bg-purple-900 transition-colors"
                                        title="编辑分类名称/排序"
                                    >
                                        <Edit3 className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => onDeleteCategory(cat)}
                                        className="p-2 rounded-full text-red-500 hover:bg-red-100 dark:hover:bg-red-900 transition-colors"
                                        title="删除分类及下所有链接"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                {cat.links?.map((link, index) => (
                                    <LinkCard 
                                        key={link.id || index} // 使用link.id作为唯一key
                                        link={{...link, categoryId: cat.id}} // 传递分类ID用于编辑保存
                                        isAdmin={true} 
                                        onEdit={onEditLink}
                                        onDelete={onDeleteLink}
                                    />
                                ))}
                            </div>
                            
                            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-center">
                                <button 
                                    onClick={() => onAddLink({ categoryId: cat.id })} 
                                    className="flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors text-sm"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    添加到 "{cat.category}"
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};


// =========================================================================
// 主应用组件
// =========================================================================
const App = () => {
  // 🔴🔴🔴 请在这里替换您的真实 UID 🔴🔴🔴
  const ADMIN_USER_ID = '6UiUdmPna4RJb2hNBoXhx3XCTFN2'; 

  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [userId, setUserId] = useState(null);
  const [navData, setNavData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDark, setIsDark] = useState(false);

  // Modals State
  const [showLogin, setShowLogin] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [editingLink, setEditingLink] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);

  // 初始化
  useEffect(() => {
    // 强制使用匿名登录或自定义令牌登录
    const firebaseConfigStr = typeof __firebase_config !== 'undefined' ? __firebase_config : '{}';
    const firebaseConfig = firebaseConfigStr !== '{}' ? JSON.parse(firebaseConfigStr) : {};
    
    if (Object.keys(firebaseConfig).length === 0) {
        console.error("Firebase configuration is missing or empty.");
        return;
    }

    const app = initializeApp(firebaseConfig);
    const _auth = getAuth(app);
    const _db = getFirestore(app);
    setAuth(_auth);
    setDb(_db);

    const initialAuth = async () => {
        const token = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
        try {
            if (token) {
                await signInWithCustomToken(_auth, token);
            } else {
                await signInAnonymously(_auth);
            }
        } catch (e) {
            console.error("Auth initialization failed:", e);
        }
    };

    initialAuth();

    const unsubscribe = onAuthStateChanged(_auth, (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId('anonymous');
      }
    });
    return unsubscribe;
  }, []);

  const isAdmin = userId === ADMIN_USER_ID;
  const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
  const dataCollectionPath = `artifacts/${appId}/public/data/navData`;
  const categories = navData.map(c => ({ id: c.id, category: c.category }));


  // 数据监听
  useEffect(() => {
    if (!db || !userId) return; // 等待数据库和用户ID就绪
    
    const q = query(collection(db, dataCollectionPath));
    
    const unsub = onSnapshot(q, (snapshot) => {
       const data = snapshot.docs.map(d => ({id: d.id, ...d.data()}));
       // 客户端排序
       data.sort((a, b) => (a.order || 0) - (b.order || 0));
       setNavData(data);
    }, (error) => {
        console.error("Firestore data snapshot failed:", error);
    });
    return unsub;
  }, [db, userId, dataCollectionPath]);


  // =========================================================================
  // AUTH 认证逻辑
  // =========================================================================
  const handleLogin = async (email, password) => {
    setLoginError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setShowLogin(false);
    } catch (e) {
      setLoginError(e.message);
    }
  };

  const handleLogout = async () => {
      await signOut(auth);
      // 触发匿名登录，确保页面依然可用
      await signInAnonymously(auth);
  };


  // =========================================================================
  // CRUD 链接 (Link) 逻辑
  // =========================================================================

  // 1. 新增或编辑链接的保存逻辑
  const handleSaveLink = async (linkData) => {
      if (!db || !isAdmin) return;
      const { id, categoryId, ...data } = linkData;
      
      if (!categoryId) {
          alert("请先创建分类再添加链接。");
          return;
      }

      try {
          // 获取目标分类文档引用
          const catRef = doc(db, dataCollectionPath, categoryId);
          const currentCat = navData.find(c => c.id === categoryId);

          if (!currentCat) {
              console.error("Category not found for ID:", categoryId);
              return;
          }

          const currentLinks = currentCat.links || [];

          if (id) {
              // 编辑逻辑：找到并替换链接
              const updatedLinks = currentLinks.map(l => l.id === id ? { id, ...data } : l);
              await updateDoc(catRef, { links: updatedLinks });
          } else {
              // 新增逻辑：添加新链接
              const newLink = { ...data, id: Date.now().toString() + Math.random().toString(36).substring(2) };
              const updatedLinks = [...currentLinks, newLink];
              await updateDoc(catRef, { links: updatedLinks });
          }

          setEditingLink(null); // 关闭模态框
          alert(id ? '链接更新成功!' : '链接添加成功!');

      } catch (e) {
          console.error("Error saving link:", e);
          alert("保存链接失败，请查看控制台。");
      }
  };


  // 2. 删除链接
  const handleDeleteLink = async (link) => {
      if (!db || !isAdmin || !window.confirm(`确定要删除链接: ${link.name} 吗?`)) return;

      const { id, categoryId } = link;
      
      try {
          const catRef = doc(db, dataCollectionPath, categoryId);
          const currentCat = navData.find(c => c.id === categoryId);

          if (!currentCat) return;

          const updatedLinks = (currentCat.links || []).filter(l => l.id !== id);
          await updateDoc(catRef, { links: updatedLinks });

          alert('链接删除成功!');
      } catch (e) {
          console.error("Error deleting link:", e);
          alert("删除链接失败，请查看控制台。");
      }
  };

  // 3. 打开新增链接模态框 (预设分类ID)
  const handleAddLink = useCallback((initialData = {}) => {
      setEditingLink(initialData); // initialData可能包含 { categoryId: '...' }
  }, []);

  // 4. 打开编辑链接模态框
  const handleEditLink = useCallback((link) => {
      setEditingLink(link);
  }, []);


  // =========================================================================
  // CRUD 分类 (Category) 逻辑
  // =========================================================================

  // 1. 新增或编辑分类的保存逻辑
  const handleSaveCategory = async (catData) => {
      if (!db || !isAdmin) return;
      const { id, ...data } = catData;

      const payload = { 
          category: data.category, 
          order: parseInt(data.order, 10) || 0,
          // 确保编辑时保留原有 links 数组，新增时默认为空数组
          links: id ? (navData.find(c => c.id === id)?.links || []) : [], 
      };

      try {
          if (id) {
              // 编辑
              await updateDoc(doc(db, dataCollectionPath, id), payload);
          } else {
              // 新增
              await addDoc(collection(db, dataCollectionPath), payload);
          }
          setEditingCategory(null); // 关闭模态框
          alert(id ? '分类更新成功!' : '分类添加成功!');
      } catch (e) {
          console.error("Error saving category:", e);
          alert("保存分类失败，请查看控制台。");
      }
  };

  // 2. 删除分类
  const handleDeleteCategory = async (category) => {
      if (!db || !isAdmin || !window.confirm(`确定要删除分类: ${category.category} 吗? 这将同时删除该分类下的所有链接!`)) return;

      try {
          await deleteDoc(doc(db, dataCollectionPath, category.id));
          alert(`分类 "${category.category}" 删除成功!`);
      } catch (e) {
          console.error("Error deleting category:", e);
          alert("删除分类失败，请查看控制台。");
      }
  };

  // 3. 打开新增分类模态框
  const handleAddCategory = useCallback(() => {
      setEditingCategory({}); // 传递空对象以新增
  }, []);

  // 4. 打开编辑分类模态框
  const handleEditCategory = useCallback((category) => {
      setEditingCategory(category);
  }, []);


  // =========================================================================
  // 批量加载默认数据逻辑 (修复并增强)
  // =========================================================================
  const handleLoadDefaultData = async () => {
      if(!db || !isAdmin) return;

      if (!window.confirm("这将清空当前所有导航数据，并加载默认模板。确认继续吗?")) return;

      try {
        const batch = writeBatch(db);
        const colRef = collection(db, dataCollectionPath);

        // 1. 清空现有数据
        const snapshot = await getDocs(colRef);
        snapshot.docs.forEach((d) => {
            batch.delete(d.ref);
        });

        // 2. 写入默认数据
        MOCK_DEFAULT_DATA.forEach(item => {
            // 给每个链接生成一个唯一ID
            const linksWithIds = (item.links || []).map(link => ({
                ...link,
                id: Date.now().toString() + Math.random().toString(36).substring(2),
            }));
            
            // 使用 setDoc 和一个新的文档ID来创建文档
            const newDocRef = doc(colRef);
            batch.set(newDocRef, { ...item, links: linksWithIds });
        });

        await batch.commit();
        alert('默认数据已成功加载!');

      } catch(e) {
          console.error("加载默认数据失败:", e);
          alert("加载默认数据失败，请查看控制台。");
      }
  };


  return (
    <div className={`min-h-screen ${isDark ? 'dark bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* 🔴 调试栏：这是解决问题的关键，请看页面顶部 */}
      <DebugBar userId={userId} isAdmin={isAdmin} adminUidConfigured={ADMIN_USER_ID} />

      {/* 模态框 */}
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} onLogin={handleLogin} error={loginError} />}
      {editingLink && <LinkEditModal 
          onClose={() => setEditingLink(null)} 
          onSave={handleSaveLink} 
          initialLink={editingLink} 
          categories={categories}
      />}
      {editingCategory && <CategoryEditModal
          onClose={() => setEditingCategory(null)}
          onSave={handleSaveCategory}
          initialCategory={editingCategory}
      />}


      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <header className="flex flex-col sm:flex-row justify-between items-center mb-12">
            <h1 className="text-4xl md:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 mb-4 sm:mb-0">
                极速导航
            </h1>
            <div className="flex gap-4 items-center">
                <button 
                    onClick={() => setIsDark(!isDark)} 
                    className="p-3 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:ring-2 ring-blue-500 transition-all shadow-md"
                    title={isDark ? '切换到亮色模式' : '切换到暗色模式'}
                >
                    {isDark ? <Sun className="w-5 h-5"/> : <Moon className="w-5 h-5"/>}
                </button>
                {isAdmin ? (
                    <button 
                        onClick={handleLogout} 
                        className="flex items-center px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors shadow-md"
                    >
                        <LogOut className="w-5 h-5 mr-2" />
                        退出管理
                    </button>
                ) : (
                    <button 
                        onClick={() => setShowLogin(true)} 
                        className="flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors shadow-md"
                    >
                        <LogIn className="w-5 h-5 mr-2" />
                        管理员登录
                    </button>
                )}
            </div>
        </header>

        <SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} onClear={() => setSearchTerm('')} />

        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-6 md:p-10 border border-gray-100 dark:border-gray-700">
            {isAdmin ? (
                <AdminPanel 
                    navData={navData} 
                    onLoadDefaultData={handleLoadDefaultData}
                    onEditLink={handleEditLink}
                    onDeleteLink={handleDeleteLink}
                    onAddLink={handleAddLink}
                    onAddCategory={handleAddCategory}
                    onEditCategory={handleEditCategory}
                    onDeleteCategory={handleDeleteCategory}
                />
            ) : (
                <PublicNav navData={navData} searchTerm={searchTerm} />
            )}
        </div>
      </div>
       <footer className="text-center text-gray-500 dark:text-gray-500 text-sm mt-16 pb-8 px-4">
          © {new Date().getFullYear()} 极速导航 - 精选高效工具
          <span className="ml-2">|</span>
          <button
            onClick={() => setShowLogin(true)}
            className="text-blue-600 hover:underline focus:outline-none dark:text-blue-400 ml-2"
          >
            管理员入口
          </button>
        </footer>
    </div>
  );
};

export default App;