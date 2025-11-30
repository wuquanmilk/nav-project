import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  signInAnonymously,
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
} from 'lucide-react';

// Firebase 配置
const firebaseConfig = {
  apiKey: "AIzaSyAlkYbLP4jW1P-XRJtCvC6id8GlIxxY8m4",
  authDomain: "wangzhandaohang.firebaseapp.com",
  projectId: "wangzhandaohang",
  storageBucket: "wangzhandaohang.firebasestorage.app",
  messagingSenderId: "169263636408",
  appId: "1:169263636408:web:ee3608652b2872a539b94d",
};

const appId = firebaseConfig.appId;
const ADMIN_UID = "6UiUdmPna4RJb2hNBoXhx3XCTFN2";

// 默认数据
const DEFAULT_LINKS = {
  "开发工具": [
    { title: "GitHub", url: "https://github.com", description: "代码托管平台" },
    { title: "Vercel", url: "https://vercel.com", description: "项目部署" },
    { title: "Netlify", url: "https://netlify.com", description: "静态网站托管" },
    { title: "CodePen", url: "https://codepen.io", description: "在线代码编辑" },
  ],
  "设计资源": [
    { title: "Figma", url: "https://figma.com", description: "界面设计工具" },
    { title: "Dribbble", url: "https://dribbble.com", description: "设计师社区" },
    { title: "Unsplash", url: "https://unsplash.com", description: "免费图片资源" },
    { title: "Iconfont", url: "https://iconfont.cn", description: "图标资源" },
  ],
  "AI 工具": [
    { title: "ChatGPT", url: "https://chat.openai.com", description: "AI 对话" },
    { title: "Midjourney", url: "https://midjourney.com", description: "AI 绘画" },
    { title: "Claude", url: "https://claude.ai", description: "AI 助手" },
    { title: "Notion AI", url: "https://notion.com", description: "智能笔记" },
  ],
  "日常工具": [
    { title: "Google", url: "https://google.com", description: "搜索" },
    { title: "Gmail", url: "https://gmail.com", description: "邮箱" },
    { title: "Drive", url: "https://drive.google.com", description: "云存储" },
    { title: "Calendar", url: "https://calendar.google.com", description: "日历" },
  ],
};

// 搜索栏组件（优化版）
const SearchBar = ({ searchTerm, onSearchChange, onClear }) => (
  <div className="w-full max-w-2xl mx-auto mb-12 px-4">
    <div className="relative">
      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
      <input
        type="text"
        placeholder="搜索网站、工具或分类..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        autoFocus
        className="w-full pl-12 pr-12 py-4 text-lg bg-white dark:bg-gray-800 
                   border border-gray-300 dark:border-gray-600 rounded-full
                   focus:outline-none focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 
                   focus:border-transparent shadow-sm text-gray-900 dark:text-white"
      />
      {searchTerm && (
        <button
          onClick={onClear}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>
      )}
    </div>
  </div>
);

// 链接卡片组件（优化版）
const LinkCard = ({ link }) => (
  <a
    href={link.url}
    target="_blank"
    rel="noopener noreferrer"
    className="group bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 
              hover:border-blue-300 hover:shadow-lg transform hover:-translate-y-1 
              transition-all duration-300 flex items-start space-x-4"
  >
    {/* 图标徽章 */}
    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 
                    rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-md">
      {link.title.charAt(0).toUpperCase()}
    </div>

    {/* 文字内容 */}
    <div className="flex-1 min-w-0">
      <h3 className="text-base font-medium text-gray-900 dark:text-gray-100 group-hover:text-blue-600 truncate">
        {link.title}
      </h3>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
        {link.description}
      </p>
      <div className="flex items-center mt-2 text-xs text-gray-400 dark:text-gray-500">
        <ExternalLink className="w-3 h-3 mr-1 opacity-70" />
        <span className="truncate">
          {link.url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}
        </span>
      </div>
    </div>
  </a>
);

// 分类区域组件（优化版）
const CategorySection = ({ category, links }) => (
  <section className="mb-10">
    <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-5 border-l-4 border-blue-500 pl-3">
      {category}
    </h2>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
      {links.map(link => (
        <LinkCard key={link.id} link={link} />
      ))}
    </div>
  </section>
);

// 公共导航组件
const PublicNav = ({ navData, searchTerm }) => {
  const filteredData = useMemo(() => {
    if (!searchTerm) return navData;

    const lowerSearch = searchTerm.toLowerCase();
    const result = {};

    Object.entries(navData).forEach(([category, links]) => {
      const filteredLinks = links.filter(link =>
        link.title.toLowerCase().includes(lowerSearch) ||
        link.description.toLowerCase().includes(lowerSearch) ||
        link.url.toLowerCase().includes(lowerSearch) ||
        category.toLowerCase().includes(lowerSearch)
      );

      if (filteredLinks.length > 0) {
        result[category] = filteredLinks;
      }
    });

    return result;
  }, [navData, searchTerm]);

  const displayData = searchTerm ? filteredData : navData;

  if (Object.keys(displayData).length === 0) {
    return (
      <div className="text-center py-20 text-gray-600 dark:text-gray-400">
        <div className="text-6xl mb-4">🔍</div>
        <h3 className="text-xl font-semibold mb-2">没有找到相关结果</h3>
        <p>尝试使用不同的关键词搜索</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4">
      {Object.entries(displayData).map(([category, links]) => (
        <CategorySection key={category} category={category} links={links} />
      ))}
    </div>
  );
};

// 登录组件
const LoginForm = ({ onLogin, onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await onLogin(email, password);
      onClose();
    } catch (err) {
      setError('登录失败，请检查邮箱和密码');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 w-full max-w-md shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">管理员登录</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">邮箱</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg 
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg 
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
              required
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm bg-red-50 dark:bg-red-900/30 p-3 rounded-lg">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium flex items-center justify-center"
          >
            {loading ? <Loader className="w-5 h-5 animate-spin" /> : '登录'}
          </button>
        </form>
      </div>
    </div>
  );
};

// 管理面板组件（保持不变，仅样式微调）
const AdminPanel = ({ navData, onAddLink, onEditLink, onDeleteLink, onLoadDefaultData }) => {
  const [editingLink, setEditingLink] = useState(null);
  const [newLink, setNewLink] = useState({ category: '', title: '', url: '', description: '' });
  const [showForm, setShowForm] = useState(false);

  const allLinks = useMemo(
    () => Object.values(navData).flat().sort((a, b) => a.category.localeCompare(b.category)),
    [navData]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    const linkData = editingLink || newLink;

    if (editingLink) {
      await onEditLink(editingLink.id, linkData);
    } else {
      await onAddLink(linkData);
    }

    setEditingLink(null);
    setNewLink({ category: '', title: '', url: '', description: '' });
    setShowForm(false);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 mb-8">
        <div className="flex flex-wrap justify-between items-center mb-6 gap-3">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">导航管理</h1>
          <div className="flex gap-3">
            <button
              onClick={onLoadDefaultData}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              加载默认数据
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              添加链接
            </button>
          </div>
        </div>

        {(showForm || editingLink) && (
          <form onSubmit={handleSubmit} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              {editingLink ? '编辑链接' : '新增链接'}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">分类</label>
                <input
                  type="text"
                  value={editingLink?.category || newLink.category}
                  onChange={(e) =>
                    editingLink
                      ? setEditingLink({ ...editingLink, category: e.target.value })
                      : setNewLink({ ...newLink, category: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                  placeholder="例如：开发工具"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">标题</label>
                <input
                  type="text"
                  value={editingLink?.title || newLink.title}
                  onChange={(e) =>
                    editingLink
                      ? setEditingLink({ ...editingLink, title: e.target.value })
                      : setNewLink({ ...newLink, title: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                  placeholder="网站名称"
                  required
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">URL</label>
              <input
                type="url"
                value={editingLink?.url || newLink.url}
                onChange={(e) =>
                  editingLink
                    ? setEditingLink({ ...editingLink, url: e.target.value })
                    : setNewLink({ ...newLink, url: e.target.value })
                }
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                placeholder="https://example.com"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">描述</label>
              <textarea
                value={editingLink?.description || newLink.description}
                onChange={(e) =>
                  editingLink
                    ? setEditingLink({ ...editingLink, description: e.target.value })
                    : setNewLink({ ...newLink, description: e.target.value })
                }
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                placeholder="简短描述"
                rows="2"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Save className="w-4 h-4 mr-2" />
                {editingLink ? '更新' : '添加'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingLink(null);
                  setNewLink({ category: '', title: '', url: '', description: '' });
                  setShowForm(false);
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                取消
              </button>
            </div>
          </form>
        )}

        <div className="space-y-3">
          {allLinks.map(link => (
            <div
              key={link.id}
              className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 
                        rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center space-x-4 flex-1 min-w-0">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-lg 
                                flex items-center justify-center font-semibold text-sm">
                  {link.title.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium text-gray-900 dark:text-white truncate">{link.title}</h4>
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 
                                    text-xs rounded-full">{link.category}</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{link.description}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 truncate">{link.url}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2 ml-4">
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                  title="访问"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button
                  onClick={() => setEditingLink(link)}
                  className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                  title="编辑"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDeleteLink(link.id)}
                  className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                  title="删除"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// 主应用组件
const App = () => {
  const [navData, setNavData] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [auth, setAuth] = useState(null);
  const [db, setDb] = useState(null);
  const [loading, setLoading] = useState(true);

  // Firebase 初始化
  useEffect(() => {
    const app = initializeApp(firebaseConfig);
    const authInstance = getAuth(app);
    const dbInstance = getFirestore(app);

    setAuth(authInstance);
    setDb(dbInstance);

    const unsubscribe = onAuthStateChanged(authInstance, (user) => {
      setIsAdmin(user?.uid === ADMIN_UID);
      setLoading(false);
    });

    // 匿名登录获取读取权限
    if (!authInstance.currentUser) {
      signInAnonymously(authInstance).catch(console.warn);
    }

    return unsubscribe;
  }, []);

  // 获取数据
  useEffect(() => {
    if (!db) return;

    const collectionRef = collection(db, 'artifacts', appId, 'public', 'data', 'navigation_links');

    return onSnapshot(collectionRef, (snapshot) => {
      const links = {};
      snapshot.forEach((doc) => {
        const data = { id: doc.id, ...doc.data() };
        const category = data.category || '未分类';
        if (!links[category]) links[category] = [];
        links[category].push(data);
      });

      Object.keys(links).forEach(category => {
        links[category].sort((a, b) => a.title.localeCompare(b.title));
      });

      setNavData(links);
    });
  }, [db]);

  const handleLogin = async (email, password) => {
    if (!auth) throw new Error('认证系统未初始化');
    await signInWithEmailAndPassword(auth, email, password);
  };

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
      await signInAnonymously(auth);
    }
  };

  const handleAddLink = async (linkData) => {
    if (!db || !isAdmin) return;
    const collectionRef = collection(db, 'artifacts', appId, 'public', 'data', 'navigation_links');
    await addDoc(collectionRef, {
      ...linkData,
      createdAt: new Date(),
      createdBy: auth.currentUser.uid,
    });
  };

  const handleEditLink = async (id, linkData) => {
    if (!db || !isAdmin) return;
    const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'navigation_links', id);
    await updateDoc(docRef, {
      ...linkData,
      updatedAt: new Date(),
      updatedBy: auth.currentUser.uid,
    });
  };

  const handleDeleteLink = async (id) => {
    if (!db || !isAdmin || !window.confirm('确定要删除这个链接吗？')) return;
    const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'navigation_links', id);
    await deleteDoc(docRef);
  };

  const handleLoadDefaultData = async () => {
    if (!db || !isAdmin) return;
    if (!window.confirm('这将添加默认数据，确定继续吗？')) return;

    const batch = writeBatch(db);
    const collectionRef = collection(db, 'artifacts', appId, 'public', 'data', 'navigation_links');

    Object.entries(DEFAULT_LINKS).forEach(([category, links]) => {
      links.forEach(link => {
        const docRef = doc(collectionRef);
        batch.set(docRef, {
          ...link,
          category,
          createdAt: new Date(),
          createdBy: auth.currentUser.uid,
        });
      });
    });

    await batch.commit();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600 dark:text-gray-400">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 font-sans ${darkMode ? 'dark' : ''}`}>
      {/* 导航栏 */}
      <nav className={`sticky top-0 z-40 backdrop-blur-lg border-b ${
        darkMode ? 'bg-gray-900/80 border-gray-700' : 'bg-white/80 border-gray-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                🚀
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                极速导航
              </h1>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2 rounded-lg transition-colors ${
                  darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                }`}
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              {isAdmin ? (
                <>
                  <button
                    onClick={() => setShowLogin(false)}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Home className="w-4 h-4" />
                    <span>返回首页</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>退出</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowLogin(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  <span>管理员登录</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* 主内容 */}
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-12">
        {/* 标题 */}
        <div className="text-center mt-12 mb-8 px-4">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            极速导航
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
            快速访问高效实用的工具与资源
          </p>
        </div>

        {/* 搜索栏 */}
        <SearchBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onClear={() => setSearchTerm('')}
        />

        {/* 导航内容 */}
        <div className="max-w-7xl mx-auto px-4">
          {isAdmin ? (
            <AdminPanel
              navData={navData}
              onAddLink={handleAddLink}
              onEditLink={handleEditLink}
              onDeleteLink={handleDeleteLink}
              onLoadDefaultData={handleLoadDefaultData}
            />
          ) : (
            <PublicNav navData={navData} searchTerm={searchTerm} />
          )}
        </div>

        {/* 底部版权 */}
        <footer className="text-center text-gray-500 dark:text-gray-500 text-sm mt-16 px-4">
          © {new Date().getFullYear()} 极速导航 - 精选高效工具 ·{' '}
          <button
            onClick={() => setShowLogin(true)}
            className="text-blue-600 hover:underline focus:outline-none"
          >
            管理员登录
          </button>
        </footer>
      </main>

      {/* 登录模态框 */}
      {showLogin && (
        <LoginForm
          onLogin={handleLogin}
          onClose={() => setShowLogin(false)}
        />
      )}
    </div>
  );
};

export default App;
