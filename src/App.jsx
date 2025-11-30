import React, { useState, useEffect, useMemo } from 'react';
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
}
 from 'firebase/firestore';
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
  Info
} from 'lucide-react';

// =========================================================================
// 全局配置与工具函数
// =========================================================================

// Firebase 配置：通过全局变量获取原始配置字符串
const rawFirebaseConfig =
  typeof __firebase_config !== 'undefined' ? __firebase_config : null;

// 应用 ID：用于 Firestore 路径
const appId =
  typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

/**
 * 默认导航数据
 * 这是在用户首次加载时或重置时用于填充数据库的示例数据结构
 */
const defaultNavData = [
  {
    id: 'default-ai-tools',
    category: '🚀 AI & 效率工具',
    links: [
      {
        id: '1',
        name: 'Gemini',
        url: 'https://gemini.google.com/',
        description: 'Google 新一代 AI 助理',
      },
      {
        id: '2',
        name: 'ChatGPT',
        url: 'https://chat.openai.com/',
        description: 'OpenAI 语言模型',
      },
      {
        id: '3',
        name: 'Midjourney',
        url: 'https://www.midjourney.com/',
        description: 'AI 艺术创作工具',
      },
    ],
  },
  {
    id: 'default-dev-tools',
    category: '💻 开发与设计',
    links: [
      {
        id: '4',
        name: 'GitHub',
        url: 'https://github.com/',
        description: '全球最大的代码托管平台',
      },
      {
        id: '5',
        name: 'Tailwind CSS',
        url: 'https://tailwindcss.com/',
        description: '原子化 CSS 框架',
      },
      {
        id: '6',
        name: 'Dribbble',
        url: 'https://dribbble.com/',
        description: '设计师作品分享社区',
      },
    ],
  },
];

// =========================================================================
// 调试组件 - 帮助您定位问题 (管理员可见)
// =========================================================================
const DebugBar = ({ userId, isAdmin, adminUid }) => {
  if (process.env.NODE_ENV === 'production' && isAdmin) return null; // 生产环境如果是管理员则隐藏

  return (
    <div
      style={{
        backgroundColor: '#fff3cd',
        color: '#856404',
        padding: '10px',
        border: '1px solid #ffeeba',
        marginBottom: '20px',
        borderRadius: '8px',
        fontSize: '12px',
        wordBreak: 'break-all',
      }}
    >
      <p>
        <strong>调试信息 (仅管理员/本地可见):</strong>
      </p>
      <p>
        **App ID:** {appId}
      </p>
      <p>
        **当前 User ID:** {userId || 'N/A (未登录)'}
      </p>
      <p>
        **管理员 ID:** {adminUid || 'N/A (未配置)'}
      </p>
      <p>
        **是否管理员:** {isAdmin ? '是' : '否'}
      </p>
    </div>
  );
};

// =========================================================================
// 核心组件：登录表单
// =========================================================================
const LoginModal = ({ onClose, onLogin, error, isLoading }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(email, password);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 transition-opacity duration-300">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-3xl p-6 w-full max-w-md transform scale-100 transition-transform duration-300">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            管理员登录
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        {error && (
          <div className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 p-3 rounded-lg mb-4 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              邮箱
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              密码
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 px-4 rounded-lg text-white font-semibold transition duration-200 shadow-md ${
              isLoading
                ? 'bg-blue-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/50'
            }`}
          >
            {isLoading ? (
              <Loader className="w-5 h-5 inline-block animate-spin mr-2" />
            ) : (
              '登录'
            )}
          </button>
        </form>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 text-center">
            **注意:** 在此环境中，通常使用预配置的管理员 ID 登录。
        </p>
      </div>
    </div>
  );
};

// =========================================================================
// 核心组件：公共导航视图 (PublicNav)
// =========================================================================
const PublicNav = ({ navData, searchTerm }) => {
  const filteredData = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return navData;

    return navData
      .map((section) => {
        const filteredLinks = section.links.filter(
          (link) =>
            link.name.toLowerCase().includes(term) ||
            link.description?.toLowerCase().includes(term)
        );
        return filteredLinks.length > 0
          ? { ...section, links: filteredLinks }
          : null;
      })
      .filter(Boolean);
  }, [navData, searchTerm]);

  if (filteredData.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500 dark:text-gray-400">
        <Search className="w-12 h-12 mx-auto mb-4" />
        <p className="text-xl font-semibold">
          未找到与 "{searchTerm}" 相关的导航项
        </p>
        <p className="mt-2">请尝试其他搜索关键词。</p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {filteredData.map((section) => (
        <div key={section.id}>
          <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-6 border-l-4 border-blue-500 pl-3">
            {section.category}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {section.links.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group p-5 bg-gray-50 dark:bg-gray-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-transparent hover:border-blue-500 transform hover:-translate-y-1 block"
              >
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {link.name}
                  </h3>
                  <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-500 ml-2" />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                  {link.description || '无描述'}
                </p>
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

// =========================================================================
// 核心组件：搜索栏 (SearchBar)
// =========================================================================
const SearchBar = ({ searchTerm, onSearchChange, onClear }) => (
  <div className="max-w-3xl mx-auto px-4 mb-16">
    <div className="relative">
      <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
      <input
        type="text"
        placeholder="搜索导航、工具或描述..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-full py-4 pl-12 pr-12 text-lg border border-gray-300 dark:border-gray-600 rounded-full shadow-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition duration-300"
      />
      {searchTerm && (
        <button
          onClick={onClear}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 bg-gray-200 dark:bg-gray-600 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500 transition"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  </div>
);

// =========================================================================
// 核心组件：管理员面板 (AdminPanel)
// =========================================================================

// 子组件：添加/编辑链接模态框
const LinkModal = ({ isOpen, onClose, linkToEdit, section, onSave }) => {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    if (linkToEdit) {
      setName(linkToEdit.name);
      setUrl(linkToEdit.url);
      setDescription(linkToEdit.description || '');
      setCategory(section.category);
    } else {
      // For adding new link
      setName('');
      setUrl('');
      setDescription('');
      setCategory(section ? section.category : '');
    }
  }, [linkToEdit, section]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !url || !category) return;

    onSave({
      id: linkToEdit?.id, // undefined for new link
      name,
      url,
      description,
      category,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 transition-opacity duration-300">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-3xl p-6 w-full max-w-lg transform scale-100 transition-transform duration-300">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {linkToEdit ? '编辑导航链接' : '新增导航链接'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              名称
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              URL (网址)
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              描述
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows="2"
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              分类 (例如: 🚀 AI & 效率工具)
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              required
            />
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 mr-2 rounded-lg bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-500 transition"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition flex items-center"
            >
              <Save className="w-4 h-4 mr-2" />
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


// 主管理员面板组件
const AdminPanel = ({ navData, onLoadDefaultData, onDeleteLink, onEditLink, onAddLink }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [linkToEdit, setLinkToEdit] = useState(null);
  const [sectionToEdit, setSectionToEdit] = useState(null); // 用于新增/编辑时的分类信息
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [linkToDelete, setLinkToDelete] = useState(null);
  const [isDefaultLoading, setIsDefaultLoading] = useState(false);

  const handleOpenAddModal = (section) => {
    setLinkToEdit(null);
    setSectionToEdit(section);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (section, link) => {
    setLinkToEdit(link);
    setSectionToEdit(section);
    setIsModalOpen(true);
  };

  const handleOpenDeleteConfirm = (section, link) => {
    setLinkToDelete({ sectionId: section.id, linkId: link.id });
    setIsConfirmModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (linkToDelete) {
      // 删除链接
      await onDeleteLink(linkToDelete.sectionId, linkToDelete.linkId);
      setLinkToDelete(null);
      setIsConfirmModalOpen(false);
    }
  };

  const handleLoadDefault = async () => {
    // ⚠️ 替代 window.confirm()，使用自定义模态框或简单逻辑
    if (window.confirm('警告: 这将覆盖所有现有数据并加载默认数据。确定继续吗？')) {
        setIsDefaultLoading(true);
        try {
            await onLoadDefaultData();
        } catch(e) {
            console.error('加载默认数据失败:', e);
            // ⚠️ 替代 alert()，使用自定义消息显示错误
            console.error('加载默认数据失败，请检查控制台错误信息。'); 
        } finally {
            setIsDefaultLoading(false);
        }
    }
  }

  const handleLinkSave = async ({ id, name, url, description, category }) => {
    if (id) {
        // 编辑现有链接
        await onEditLink(id, name, url, description, category);
    } else {
        // 添加新链接
        await onAddLink(name, url, description, category);
    }
  };


  return (
    <div className="space-y-12">
      <div className="flex justify-end gap-4 border-b pb-4 border-gray-200 dark:border-gray-700">
        <button
          onClick={() => handleOpenAddModal(null)}
          className="flex items-center px-4 py-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition shadow-lg"
        >
          <Plus className="w-5 h-5 mr-2" />
          新增链接
        </button>
        <button
          onClick={handleLoadDefault}
          disabled={isDefaultLoading}
          className="flex items-center px-4 py-2 rounded-lg bg-yellow-600 text-white font-semibold hover:bg-yellow-700 transition shadow-lg disabled:bg-yellow-400"
        >
          {isDefaultLoading ? <Loader className="w-5 h-5 animate-spin mr-2" /> : <Download className="w-5 h-5 mr-2" />}
          加载默认数据
        </button>
      </div>
      
      {navData.map((section) => (
        <div key={section.id} className="p-6 bg-gray-50 dark:bg-gray-700 rounded-xl shadow-lg border border-gray-100 dark:border-gray-600">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {section.category}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {section.links.map((link) => (
              <div
                key={link.id}
                className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-600 flex justify-between items-center transition-all duration-200 hover:shadow-lg"
              >
                <div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white truncate">
                    {link.name}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {link.url}
                  </p>
                </div>
                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={() => handleOpenEditModal(section, link)}
                    className="p-1 text-blue-500 hover:text-blue-700 dark:hover:text-blue-400 transition"
                    title="编辑"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleOpenDeleteConfirm(section, link)}
                    className="p-1 text-red-500 hover:text-red-700 dark:hover:text-red-400 transition"
                    title="删除"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
      
      {/* 链接编辑/添加模态框 */}
      <LinkModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        linkToEdit={linkToEdit}
        section={sectionToEdit}
        onSave={handleLinkSave}
      />

      {/* 删除确认模态框 */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 transition-opacity duration-300">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-3xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold text-red-600 dark:text-red-400 mb-4">
                确认删除
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
                您确定要删除此链接吗？此操作无法撤销。
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsConfirmModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-500 transition"
              >
                取消
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


// =========================================================================
// 主应用组件 (App)
// =========================================================================
const App = () => {
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false); // 认证就绪状态
  const [isAdmin, setIsAdmin] = useState(false);
  const [navData, setNavData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showLogin, setShowLogin] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [dataError, setDataError] = useState(null);
  const [isDark, setIsDark] = useState(false);
  // 新增配置错误状态
  const [configError, setConfigError] = useState(null);

  // 1. 解析并验证 Firebase 配置 (使用 useMemo 确保只运行一次)
  const firebaseConfig = useMemo(() => {
    if (!rawFirebaseConfig) {
        setConfigError('系统错误：配置缺失。无法加载 Firebase 数据库配置。请联系应用管理员解决配置问题。');
        return null;
    }
    try {
      const config = JSON.parse(rawFirebaseConfig);
      // 验证配置对象是否有效
      if (!config || typeof config !== 'object' || !config.apiKey) {
        throw new Error('配置对象缺失或不包含 apiKey');
      }
      return config;
    } catch (e) {
      console.error('Firebase Config 解析失败:', e);
      setConfigError('系统错误：配置缺失。无法加载 Firebase 数据库配置。请联系应用管理员解决配置问题。');
      return null;
    }
  }, []);

  // 管理员 UID（当前环境用户的 ID）
  const adminUid = useMemo(
    () =>
      typeof __user_id !== 'undefined' && __user_id !== 'anonymous'
        ? __user_id
        : null,
    [],
  );

  // -----------------------------------------------------------------------
  // 2. Firebase 初始化与认证
  // -----------------------------------------------------------------------
  useEffect(() => {
    // 检查是否有配置错误，如果有，则停止初始化
    if (configError || !firebaseConfig) return;
    
    // 1. 初始化 Firebase 服务
    const app = initializeApp(firebaseConfig);
    const authInstance = getAuth(app);
    const dbInstance = getFirestore(app);

    setDb(dbInstance);
    setAuth(authInstance);

    let unsubscribeAuth = () => {};

    const initAuth = async () => {
      try {
        // 2. 执行初始登录尝试 (Custom Token 或 Anonymous)
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(authInstance, __initial_auth_token);
        } else {
          await signInAnonymously(authInstance);
        }
      } catch (error) {
        // 如果匿名登录或自定义 token 登录失败，记录错误
        console.error('Initial Firebase Auth Failed:', error);
      } finally {
        // 3. 设置 Auth 状态监听器
        unsubscribeAuth = onAuthStateChanged(authInstance, (user) => {
          if (user) {
            setUserId(user.uid);
            // 确保 adminUid 已经计算出来
            setIsAdmin(user.uid === adminUid);
          } else {
            setUserId(null);
            setIsAdmin(false);
          }
        });
        
        // 4. 标记认证为就绪，确保所有 DB 操作都在此之后执行
        setIsAuthReady(true);
      }
    };

    initAuth();

    return () => {
      // 清理 Auth 监听器
      if (unsubscribeAuth) {
        unsubscribeAuth();
      }
    };
  }, [adminUid, configError, firebaseConfig]); // 依赖 configError 和 firebaseConfig

  // -----------------------------------------------------------------------
  // 3. 监听导航数据变化
  // -----------------------------------------------------------------------
  useEffect(() => {
    // 确保 DB 实例和认证都已就绪
    if (!db || !isAuthReady || configError) return; 

    const navDataPath = `artifacts/${appId}/public/data/navData`;
    const q = collection(db, navDataPath);

    setDataError(null); // 清除之前的数据错误

    console.log(`Setting up snapshot for: ${navDataPath} after auth ready.`);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setNavData(data);
      console.log('Navigation data updated.');
    }, (error) => {
      // 记录权限错误
      console.error('Error fetching navigation data:', error);
      setDataError(error.message);
    });

    return () => unsubscribe(); // 清理监听器
  }, [db, isAuthReady, configError]); // 依赖 db, isAuthReady, configError

  // -----------------------------------------------------------------------
  // 4. 深色模式管理
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // -----------------------------------------------------------------------
  // 5. 认证函数 (登录/登出)
  // -----------------------------------------------------------------------
  const handleLogin = async (email, password) => {
    if (!auth) return;
    setLoginError('');
    setIsLoginLoading(true);

    try {
      await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );
      // 登录成功后，onAuthStateChanged 会处理 isAdmin 和 userId 的更新
      setShowLogin(false);
    } catch (error) {
      console.error('Login failed:', error);
      setLoginError('登录失败：邮箱或密码错误，或用户不存在。');
    } finally {
      setIsLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      // 登出后重新匿名登录以保持连接，并更新状态
      await signInAnonymously(auth); 
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // -----------------------------------------------------------------------
  // 6. 导航数据管理函数 (Admin Only)
  // -----------------------------------------------------------------------
  const handleLoadDefaultData = async () => {
    if (!db || !isAdmin) return;

    const batch = writeBatch(db);
    const navDataPath = `artifacts/${appId}/public/data/navData`;

    // 1. 清空现有数据
    const existingDocs = await getDocs(collection(db, navDataPath));
    existingDocs.forEach(docSnapshot => {
      batch.delete(docSnapshot.ref);
    });

    // 2. 写入默认数据
    defaultNavData.forEach((section) => {
      // 使用 setDoc 确保文档 ID 保持一致
      batch.set(doc(db, navDataPath, section.id), {
        category: section.category,
        links: section.links, // 嵌套数组/对象直接存储在 Firestore Document 中
      });
    });

    await batch.commit();
    console.log('Default data loaded successfully.');
  };

  const findLinkAndSection = (linkId) => {
    for (const section of navData) {
      const linkIndex = section.links.findIndex(link => link.id === linkId);
      if (linkIndex !== -1) {
        return { section, linkIndex };
      }
    }
    return null;
  };

  const handleUpdateSectionLinks = async (sectionId, newLinks) => {
    if (!db || !isAdmin) return;
    const docRef = doc(db, `artifacts/${appId}/public/data/navData`, sectionId);
    await updateDoc(docRef, { links: newLinks });
  };
  
  const handleAddLink = async (name, url, description, category) => {
    if (!db || !isAdmin) return;

    const newLink = {
        id: crypto.randomUUID(),
        name,
        url,
        description,
    };

    const targetSection = navData.find(s => s.category === category);

    if (targetSection) {
        // 分类已存在：更新文档中的 links 数组
        await handleUpdateSectionLinks(targetSection.id, [...targetSection.links, newLink]);
    } else {
        // 分类不存在：创建新文档
        const navDataPath = `artifacts/${appId}/public/data/navData`;
        await addDoc(collection(db, navDataPath), {
            category: category,
            links: [newLink],
        });
    }
  };

  const handleEditLink = async (linkId, name, url, description, newCategory) => {
    if (!db || !isAdmin) return;

    // 找到原链接所在的 section
    const found = findLinkAndSection(linkId);
    if (!found) return;

    const { section: oldSection, linkIndex } = found;

    const updatedLink = {
        id: linkId,
        name,
        url,
        description,
    };

    if (oldSection.category === newCategory) {
        // 仅修改链接内容 (在原分类内)
        const newLinks = [...oldSection.links];
        newLinks[linkIndex] = updatedLink;
        await handleUpdateSectionLinks(oldSection.id, newLinks);
    } else {
        // 更改了分类
        // 1. 从原分类中删除链接
        const oldLinks = oldSection.links.filter(link => link.id !== linkId);
        await handleUpdateSectionLinks(oldSection.id, oldLinks);

        // 如果原分类现在为空，则删除整个文档
        if (oldLinks.length === 0) {
          await deleteDoc(doc(db, `artifacts/${appId}/public/data/navData`, oldSection.id));
        }

        // 2. 将链接添加到新分类
        const newSection = navData.find(s => s.category === newCategory);
        if (newSection) {
            // 新分类已存在：更新其 links 数组
            await handleUpdateSectionLinks(newSection.id, [...newSection.links, updatedLink]);
        } else {
            // 新分类不存在：创建新文档
            const navDataPath = `artifacts/${appId}/public/data/navData`;
            await addDoc(collection(db, navDataPath), {
                category: newCategory,
                links: [updatedLink],
            });
        }
    }
  };

  const handleDeleteLink = async (sectionId, linkId) => {
    if (!db || !isAdmin) return;

    const section = navData.find(s => s.id === sectionId);
    if (!section) return;

    const newLinks = section.links.filter(link => link.id !== linkId);
    
    if (newLinks.length > 0) {
        // 仍有链接：更新 links 数组
        await handleUpdateSectionLinks(sectionId, newLinks);
    } else {
        // 链接为空：删除整个文档
        await deleteDoc(doc(db, `artifacts/${appId}/public/data/navData`, sectionId));
    }
  };


  // =========================================================================
  // 7. 渲染逻辑
  // =========================================================================

  // 优先渲染配置错误
  if (configError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 p-8">
        <AlertTriangle className="w-16 h-16 mb-6" />
        <h1 className="text-3xl font-bold mb-4">系统错误：配置缺失</h1>
        <p className="text-center text-xl max-w-lg">
          {configError.split('：')[1] || configError}
        </p>
        <p className="mt-8 text-sm text-red-500 dark:text-red-400">
          **请注意**：要修复此问题，应用管理员需要在环境配置中提供有效的 Firebase JSON 配置。
        </p>
      </div>
    );
  }

  // 渲染认证加载状态
  if (!isAuthReady) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300">
        <Loader className="w-12 h-12 animate-spin text-blue-600" />
        <p className="mt-4 text-xl font-semibold">正在初始化应用...</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      <div className="pt-8 pb-16 transition-colors duration-300">
        
        {/* 调试信息栏 (仅在特定条件下显示) */}
        {db && <DebugBar userId={userId} isAdmin={isAdmin} adminUid={adminUid} />}

        {/* 顶部标题和描述 */}
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight inline-block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            极速导航
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
            快速访问高效实用的工具与资源
          </p>
        </div>

        {/* 头部控制栏：包含深色模式切换和登录/退出按钮 */}
        <header className="flex justify-between items-center max-w-7xl mx-auto px-4 mb-10">
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">极速导航</h1>
            <div className="flex gap-4 items-center">
                <button 
                  onClick={() => setIsDark(!isDark)} 
                  className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white hover:shadow-md transition"
                >
                    {isDark ? <Sun className="w-5 h-5"/> : <Moon className="w-5 h-5"/>}
                </button>
                {isAdmin ? (
                    <button 
                      onClick={handleLogout} 
                      className="text-red-600 dark:text-red-400 font-bold border border-red-500 px-3 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900 transition"
                    >
                      <LogOut className="w-4 h-4 inline-block mr-1" /> 退出管理
                    </button>
                ) : (
                    <button 
                      onClick={() => setShowLogin(true)} 
                      className="text-blue-600 dark:text-blue-400 font-bold border border-blue-500 px-3 py-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900 transition"
                    >
                        <LogIn className="w-4 h-4 inline-block mr-1" /> 管理员登录
                    </button>
                )}
            </div>
        </header>

        {/* 搜索栏 */}
        <SearchBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onClear={() => setSearchTerm('')}
        />

        {/* 数据加载/错误状态提示 */}
        {dataError && (
          <div className="max-w-7xl mx-auto px-4 mb-8">
             <div className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 p-4 rounded-xl flex items-center shadow-lg">
                <AlertTriangle className="w-6 h-6 mr-3 flex-shrink-0" />
                <div className="flex-1">
                    <p className="font-bold">数据加载错误：</p>
                    <p className="text-sm">
                        {dataError.includes('permission') 
                            ? '权限不足，请确保您的 Firestore 安全规则允许匿名/已认证用户读取此公共集合，或稍后重试。' 
                            : dataError}
                    </p>
                </div>
                {!isAdmin && (
                    <button 
                        onClick={() => setShowLogin(true)} 
                        className="ml-4 flex-shrink-0 text-red-600 hover:underline dark:text-red-400"
                    >
                        尝试管理员登录
                    </button>
                )}
            </div>
          </div>
        )}

        {/* 导航内容 - 外部居中容器 */}
        <div className="max-w-7xl mx-auto px-4">
          {/* 新增美观的背景卡片效果容器 */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-6 md:p-10 border border-gray-100 dark:border-gray-700">
            {navData.length === 0 && !dataError ? (
                <div className="text-center py-16 text-gray-500 dark:text-gray-400">
                  <Info className="w-12 h-12 mx-auto mb-4" />
                  <p className="text-xl font-semibold">导航数据为空</p>
                  {isAdmin && <p className="mt-2">请使用“加载默认数据”按钮或“新增链接”来添加内容。</p>}
                  {!isAdmin && <p className="mt-2">请稍候，或联系管理员添加内容。</p>}
                </div>
            ) : isAdmin ? (
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

        {/* 登录模态框 */}
        {showLogin && (
          <LoginModal
            onClose={() => {
              setShowLogin(false);
              setLoginError('');
            }}
            onLogin={handleLogin}
            error={loginError}
            isLoading={isLoginLoading}
          />
        )}

        {/* 底部版权 */}
        <footer className="text-center text-gray-500 dark:text-gray-500 text-sm mt-16 px-4">
          © {new Date().getFullYear()} 极速导航 - 精选高效工具 ·{' '}
          <button
            onClick={() => setShowLogin(true)}
            className="text-blue-600 hover:underline focus:outline-none dark:text-blue-400"
          >
            管理员登录
          </button>
        </footer>
      </div>
    </div>
  );
};

export default App;