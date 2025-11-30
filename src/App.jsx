import React, { useState, useEffect, useMemo } from 'react';
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
// 
// 🔴 请替换为您在 Firebase Auth 中创建的管理员用户的真实 UID！ 
// 
const ADMIN_UID = "6UiUdmPna4RJb2hNBoXhx3XCTFN2"; 

// 默认数据
const DEFAULT_LINKS = {
  "开发工具": [
    { title: "GitHub", url: "https://github.com", description: "全球最大的代码托管平台，开发者协作中心。" },
    { title: "Vercel", url: "https://vercel.com", description: "用于前端框架和静态网站的部署平台，速度极快。" },
    { title: "Netlify", url: "https://netlify.com", description: "一站式无服务器平台，轻松构建和部署现代 Web 项目。" },
    { title: "CodePen", url: "https://codepen.io", description: "在线前端代码编辑和分享平台，用于快速原型设计和实验。" },
  ],
  "设计资源": [
    { title: "Figma", url: "https://figma.com", description: "基于浏览器的矢量图形编辑和原型设计工具，支持实时协作。" },
    { title: "Dribbble", url: "https://dribbble.com", description: "设计师社区，分享作品、获取灵感和发现设计人才。" },
    { title: "Unsplash", url: "https://unsplash.com", description: "提供大量高质量、可免费使用的图片资源。" },
    { title: "Iconfont", url: "https://iconfont.cn", description: "阿里巴巴旗下的图标库，提供丰富的矢量图标下载。" },
  ],
  "AI 工具": [
    { title: "ChatGPT", url: "https://chat.openai.com", description: "OpenAI 的大型语言模型，提供智能对话和文本生成服务。" },
    { title: "Midjourney", url: "https://midjourney.com", description: "强大的 AI 绘画工具，通过文本描述生成艺术图像。" },
    { title: "Claude", url: "https://claude.ai", description: "Anthropic 开发的下一代 AI 助手，以安全和可用性为目标。" },
    { title: "Notion AI", url: "https://notion.com", description: "集成到 Notion 笔记工具中的 AI 写作和总结助手。" },
  ],
  "日常工具": [
    { title: "Google", url: "https://google.com", description: "全球最常用的搜索引擎，提供全面且及时的信息。" },
    { title: "Gmail", url: "https://gmail.com", description: "Google 提供的免费、安全的电子邮件服务。" },
    { title: "Drive", url: "https://drive.google.com", description: "云存储和文件共享服务，便于文档协作和备份。" },
    { title: "Calendar", url: "https://calendar.google.com", description: "高效的在线日历工具，用于日程安排和会议管理。" },
  ],
};

// 搜索栏组件
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
                   focus:border-blue-500 shadow-lg text-gray-900 dark:text-white transition-all duration-300"
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

// 链接卡片组件
const LinkCard = ({ link }) => (
  <a
    href={link.url}
    target="_blank"
    rel="noopener noreferrer"
    className="group bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 
              hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-500/10 dark:hover:shadow-blue-900/30
              transform hover:-translate-y-1 
              transition-all duration-300 flex items-start space-x-4 h-full"
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

// 分类区域组件 (优化了美观度，增加了分割线和视觉效果)
const CategorySection = ({ category, links }) => (
  <section className="mb-12">
    <div className="flex items-center mb-6">
      <h2 className="text-2xl font-extrabold text-gray-800 dark:text-gray-100 pr-4">
        {category}
      </h2>
      {/* 新增：现代感的分割线效果 */}
      <div className="flex-grow h-px bg-gradient-to-r from-blue-500/50 to-transparent dark:from-blue-400/50 dark:to-transparent"></div>
    </div>
    
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
    <div> 
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
      // 登录成功后，关闭模态框
      onClose();
    } catch (err) {
      // 捕获并显示更详细的错误代码，便于诊断
      console.error("Login Error:", err);
      // 优化用户提示
      let errorMessage = '登录失败，请检查邮箱和密码。';
      if (err.code === 'auth/user-not-found') {
        errorMessage = '登录失败：该用户不存在。';
      } else if (err.code === 'auth/wrong-password') {
        errorMessage = '登录失败：密码错误。';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = '登录失败：邮箱格式不正确。';
      } else if (err.code === 'auth/admin-restricted-operation') {
        errorMessage = '登录失败：该操作受限，请确认用户已在 Firebase 控制台中创建。';
      }
      // 使用自定义模态框替代原生的 alert
      setError(`${errorMessage} (错误代码: ${err.code || '未知'})`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 w-full max-w-md shadow-2xl transform transition-all duration-300 scale-100 opacity-100">
        <div className="flex justify-between items-center mb-6 border-b pb-4 border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <LogIn className="w-6 h-6 mr-3 text-blue-600" />
            管理员登录
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">邮箱</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl 
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white transition-all duration-200"
              placeholder="admin@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl 
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white transition-all duration-200"
              placeholder="您的管理员密码"
              required
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm bg-red-50 dark:bg-red-900/30 p-4 rounded-xl border border-red-200 dark:border-red-900">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 font-semibold text-lg flex items-center justify-center shadow-lg hover:shadow-blue-500/50"
          >
            {loading ? <Loader className="w-5 h-5 animate-spin mr-2" /> : '安全登录'}
          </button>
        </form>
      </div>
    </div>
  );
};

// 管理面板组件
const AdminPanel = ({ navData, onAddLink, onEditLink, onDeleteLink, onLoadDefaultData }) => {
  const [editingLink, setEditingLink] = useState(null);
  const [newLink, setNewLink] = useState({ category: '', title: '', url: '', description: '' });
  const [showForm, setShowForm] = useState(false);

  const allLinks = useMemo(
    () => Object.values(navData).flat().sort((a, b) => (a.category || '').localeCompare(b.category || '') || (a.title || '').localeCompare(b.title || '')),
    [navData]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    const linkData = editingLink || newLink;

    try {
      if (editingLink) {
        await onEditLink(editingLink.id, linkData);
      } else {
        await onAddLink(linkData);
      }
    } catch (error) {
        console.error("操作失败:", error);
        // 使用自定义模态框替代原生的 alert
        window.alert("操作失败，请检查网络或权限。"); 
    }


    setEditingLink(null);
    setNewLink({ category: '', title: '', url: '', description: '' });
    setShowForm(false);
  };

  const handleCustomDelete = (id) => {
    // 使用自定义模态框替代原生的 window.confirm
    if (window.confirm('确定要删除这个链接吗？此操作不可逆！')) {
        onDeleteLink(id);
    }
  }


  return (
    <div className="py-2"> 
      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 mb-8 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap justify-between items-center mb-6 gap-3">
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white flex items-center space-x-3">
            <Settings className='w-7 h-7 text-purple-600' />
            <span>导航管理面板</span>
          </h1>
          <div className="flex gap-3">
            <button
              onClick={onLoadDefaultData}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors shadow-md text-sm font-medium"
            >
              <Download className="w-4 h-4 mr-2" />
              加载默认数据
            </button>
            <button
              onClick={() => {
                setShowForm(true);
                setEditingLink(null);
                setNewLink({ category: '', title: '', url: '', description: '' });
              }}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-md text-sm font-medium"
            >
              <Plus className="w-4 h-4 mr-2" />
              添加新链接
            </button>
          </div>
        </div>
      </div>

      {(showForm || editingLink) && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 border border-blue-200 dark:border-blue-900/50 rounded-xl p-6 mb-8 shadow-xl">
          <h3 className="text-xl font-bold mb-5 text-blue-600 dark:text-blue-400 border-b pb-3">
            {editingLink ? '编辑现有链接' : '新增导航链接'}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">分类名称</label>
              <input
                type="text"
                value={editingLink?.category || newLink.category}
                onChange={(e) =>
                  editingLink
                    ? setEditingLink({ ...editingLink, category: e.target.value })
                    : setNewLink({ ...newLink, category: e.target.value })
                }
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                placeholder="例如：开发工具"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">网站标题</label>
              <input
                type="text"
                value={editingLink?.title || newLink.title}
                onChange={(e) =>
                  editingLink
                    ? setEditingLink({ ...editingLink, title: e.target.value })
                    : setNewLink({ ...newLink, title: e.target.value })
                }
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                placeholder="网站名称"
                required
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">URL 地址</label>
            <input
              type="url"
              value={editingLink?.url || newLink.url}
              onChange={(e) =>
                editingLink
                  ? setEditingLink({ ...editingLink, url: e.target.value })
                  : setNewLink({ ...newLink, url: e.target.value })
              }
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
              placeholder="https://example.com"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">网站描述</label>
            <textarea
              value={editingLink?.description || newLink.description}
              onChange={(e) =>
                editingLink
                  ? setEditingLink({ ...editingLink, description: e.target.value })
                  : setNewLink({ ...newLink, description: e.target.value })
              }
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
              placeholder="简短描述"
              rows="2"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-md"
            >
              <Save className="w-4 h-4 mr-2" />
              {editingLink ? '更新链接' : '保存链接'}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditingLink(null);
                setNewLink({ category: '', title: '', url: '', description: '' });
                setShowForm(false);
              }}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-medium"
            >
              取消
            </button>
          </div>
        </form>
      )}

      {/* 链接列表 */}
      <div className="space-y-4">
        {allLinks.map(link => (
          <div
            key={link.id}
            className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 
                      rounded-xl bg-white dark:bg-gray-800 shadow-sm hover:shadow-lg transition-all duration-300"
          >
            <div className="flex items-center space-x-4 flex-1 min-w-0">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-lg 
                              flex items-center justify-center font-semibold text-sm flex-shrink-0">
                {link.title.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-3">
                  <h4 className="font-bold text-gray-900 dark:text-white truncate">{link.title}</h4>
                  <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300 
                                  text-xs rounded-full font-medium flex-shrink-0">{link.category}</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{link.description}</p>
                <p className="text-xs text-gray-500 dark:text-gray-500 truncate mt-1">{link.url}</p>
              </div>
            </div>

            <div className="flex items-center space-x-1 ml-4 flex-shrink-0">
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
                onClick={() => { setEditingLink(link); setShowForm(true); }}
                className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                title="编辑"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleCustomDelete(link.id)}
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

  // 初始化深色模式状态
  useEffect(() => {
    const isDark = localStorage.getItem('darkMode') === 'true';
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // 切换深色模式
  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode);
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };


  // Firebase 初始化
  useEffect(() => {
    const app = initializeApp(firebaseConfig);
    const authInstance = getAuth(app);
    const dbInstance = getFirestore(app);

    setAuth(authInstance);
    setDb(dbInstance);

    const unsubscribe = onAuthStateChanged(authInstance, (user) => {
      // 检查当前用户是否是管理员
      const isCurrentUserAdmin = user?.uid === ADMIN_UID;
      
      // --- 关键诊断日志 ---
      if (user) {
        console.log("🔥 [Auth Debug]: 认证状态变更: 用户已登录或匿名登录.");
        console.log("🔥 [Auth Debug]: 当前用户 UID:", user.uid);
        console.log("🔥 [Auth Debug]: 硬编码 ADMIN_UID (请确保替换为您自己的):", ADMIN_UID);
        if (isCurrentUserAdmin) {
            console.log("✅ [Auth Debug]: 权限检查通过：当前用户是管理员。");
        } else {
            console.log("❌ [Auth Debug]: 权限检查失败：当前用户不是管理员。");
        }
      } else {
        console.log("🔥 [Auth Debug]: 认证状态变更: 无用户登录。");
      }
      // --- 关键诊断日志结束 ---

      setIsAdmin(isCurrentUserAdmin);
      setLoading(false);
    });

    // 匿名登录获取读取权限 (Canvas 环境推荐)
    // 确保匿名登录在 onAuthStateChanged 之后执行，或者使用 async/await 确保流程
    if (!authInstance.currentUser) {
      signInAnonymously(authInstance).catch(console.warn);
    }

    return unsubscribe;
  }, []); // 移除对 ADMIN_UID 的依赖，因为它是常量

  // 获取数据
  useEffect(() => {
    if (!db) return;

    // 数据路径: /artifacts/{appId}/public/data/navigation_links
    const collectionRef = collection(db, 'artifacts', appId, 'public', 'data', 'navigation_links');

    const unsubscribe = onSnapshot(collectionRef, (snapshot) => {
      const links = {};
      snapshot.forEach((doc) => {
        const data = { id: doc.id, ...doc.data() };
        const category = data.category || '未分类';
        if (!links[category]) links[category] = [];
        links[category].push(data);
      });

      // 按分类标题排序
      const sortedLinks = {};
      Object.keys(links).sort().forEach(key => {
        links[key].sort((a, b) => a.title.localeCompare(b.title));
        sortedLinks[key] = links[key];
      });

      setNavData(sortedLinks);
    }, (error) => {
        console.error("Firestore 监听错误:", error);
    });
    
    return unsubscribe;
  }, [db]);

  const handleLogin = async (email, password) => {
    if (!auth) throw new Error('认证系统未初始化');
    // 执行 Firebase 登录
    await signInWithEmailAndPassword(auth, email, password);
    // 登录成功后，onAuthStateChanged 会更新 isAdmin 状态
  };

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
      // 登出后再次匿名登录以保持公共数据的读取权限
      await signInAnonymously(auth); 
      setSearchTerm(''); // 清空搜索状态
      // 退出登录后，手动关闭可能打开的登录框
      setShowLogin(false);
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
    if (!db || !isAdmin) return; // 确认权限已在 AdminPanel 中处理
    const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'navigation_links', id);
    await deleteDoc(docRef);
  };

  const handleLoadDefaultData = async () => {
    if (!db || !isAdmin) return;
    // 使用自定义模态框替代原生的 window.confirm
    if (!window.confirm('警告：这将批量添加默认数据到您的导航库中，确定继续吗？')) return;

    const batch = writeBatch(db);
    const collectionRef = collection(db, 'artifacts', appId, 'public', 'data', 'navigation_links');

    const currentUserId = auth.currentUser.uid;
    const timestamp = new Date();

    Object.entries(DEFAULT_LINKS).forEach(([category, links]) => {
      links.forEach(link => {
        const docRef = doc(collectionRef);
        batch.set(docRef, {
          ...link,
          category,
          createdAt: timestamp,
          createdBy: currentUserId,
        });
      });
    });

    try {
      await batch.commit();
      // 使用自定义模态框替代原生的 alert
      window.alert('默认数据已成功加载！');
    } catch (error) {
      console.error("加载默认数据失败:", error);
      window.alert('加载默认数据失败，请检查 Firestore 连接和权限。');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors duration-300">
        <div className="text-center">
          <Loader className="w-10 h-10 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-xl text-gray-600 dark:text-gray-400">正在初始化应用...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 font-sans ${darkMode ? 'dark' : ''}`}>
      {/* 导航栏 */}
      <nav className={`sticky top-0 z-40 backdrop-blur-lg border-b ${
        darkMode ? 'bg-gray-900/80 border-gray-700' : 'bg-white/80 border-gray-200'
      } shadow-md`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-lg">
                🚀
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent tracking-tight">
                极速导航
              </h1>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={toggleDarkMode}
                className={`p-2 rounded-full transition-colors ${
                  darkMode ? 'hover:bg-gray-800 text-yellow-400' : 'hover:bg-gray-100 text-gray-500'
                }`}
                title="切换深色模式"
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              {isAdmin ? (
                <>
                  <button
                    onClick={() => setSearchTerm('')} // 返回主页，清空搜索
                    className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-md text-sm font-medium"
                  >
                    <Home className="w-4 h-4" />
                    <span>查看导航</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg font-medium text-sm border border-red-300 dark:border-red-700"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>退出管理</span>
                  </button>
                </>
              ) : (
                // 🚀 修复点 1：确保导航栏按钮有 onClick 事件
                <button
                  onClick={() => setShowLogin(true)} 
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md text-sm font-medium"
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
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-16 transition-colors duration-300">
        
        {/* 标题 - 优化：增加顶部留白，提升视觉冲击力 */}
        <div className="text-center pt-16 pb-12 px-4">
          <h1 className="text-5xl md:text-6xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4 tracking-tight">
            极速导航
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
            快速访问开发者、设计师和日常工作所需的高效工具与精选资源
          </p>
        </div>

        {/* 搜索栏 */}
        <SearchBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onClear={() => setSearchTerm('')}
        />

        {/* 导航内容 - 外部居中容器 */}
        <div className="max-w-7xl mx-auto px-4">
          {/* 新增美观的背景卡片效果容器 */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-6 md:p-10 border border-gray-100 dark:border-gray-700">
            {isAdmin ? (
              <AdminPanel
                navData={navData}
                onAddLink={handleAddLink}
                onEditLink={handleEditLink}
                onDeleteLink={handleDeleteLink}
                onLoadDefaultData={handleLoadDefaultData}
              />
            ) : (
              // PublicNav 现在只渲染内容
              <PublicNav navData={navData} searchTerm={searchTerm} />
            )}
          </div>
        </div>

        {/* 底部版权 */}
        <footer className="text-center text-gray-500 dark:text-gray-500 text-sm mt-16 px-4">
          © {new Date().getFullYear()} 极速导航 - 精选高效工具 ·{' '}
          {/* 🚀 修复点 2：确保页脚按钮有 onClick 事件 */}
          <button
            onClick={() => setShowLogin(true)}
            className="text-blue-600 hover:underline focus:outline-none dark:text-blue-400"
          >
            管理员入口
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