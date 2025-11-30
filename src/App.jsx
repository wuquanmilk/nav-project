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
  Layers, // 层次图标，用于分类管理
  Link, // 链接图标，用于链接管理
  ArrowUp,
  ArrowDown,
} from 'lucide-react';

// =========================================================================
// 外部配置和初始化
// =========================================================================

// 确保使用全局变量中的配置
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};

let app, db, auth;
const isFirebaseConfigured = Object.keys(firebaseConfig).length > 0;

if (isFirebaseConfigured) {
    try {
        app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        auth = getAuth(app);
        console.log("Firebase services initialized successfully.");
    } catch (e) {
        console.error("Firebase initialization failed during initializeApp:", e);
        // 如果初始化失败，auth, db 会保持 undefined
    }
} else {
    console.warn("Firebase Config is missing or empty. Skipping initialization.");
}

// 默认数据结构
const DEFAULT_DATA = [
  {
    id: 'default-ai-tools',
    title: '🌐 AI 工具与资源',
    order: 1,
    links: [
      { id: 'link-gpt', name: 'ChatGPT 官方', url: 'https://chat.openai.com/', icon: 'ExternalLink' },
      { id: 'link-bard', name: 'Google Gemini', url: 'https://gemini.google.com/', icon: 'Search' },
      { id: 'link-mid', name: 'Midjourney', url: 'https://www.midjourney.com/', icon: 'Layers' },
    ],
  },
  {
    id: 'default-dev-tools',
    title: '💻 开发者常用',
    order: 2,
    links: [
      { id: 'link-github', name: 'GitHub', url: 'https://github.com/', icon: 'Save' },
      { id: 'link-mdn', name: 'MDN Web Docs', url: 'https://developer.mozilla.org/', icon: 'Info' },
    ],
  },
];

// =========================================================================
// UI 组件
// =========================================================================

/**
 * 黑暗模式/灯光模式切换
 */
const DarkModeToggle = ({ isDark, setIsDark }) => (
  <button
    onClick={() => setIsDark(!isDark)}
    className="p-2 rounded-full transition-all duration-300 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 shadow-md"
    aria-label={isDark ? "切换到灯光模式" : "切换到黑暗模式"}
  >
    {isDark ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-gray-800" />}
  </button>
);

/**
 * 通用弹窗组件
 */
const Modal = ({ title, children, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4" onClick={onClose}>
    <div
      className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-lg transition-all duration-300 transform scale-100 p-6"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex justify-between items-center mb-4 border-b pb-3 dark:border-gray-700">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">{title}</h3>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
          <X className="w-6 h-6" />
        </button>
      </div>
      {children}
    </div>
  </div>
);

/**
 * 管理员登录表单
 */
const LoginModal = ({ onClose, onLogin, error, isLoading, isFirebaseAvailable }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isFirebaseAvailable) {
        onLogin(email, password);
    }
  };

  return (
    <Modal title="管理员登录" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {!isFirebaseAvailable && (
            <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg dark:bg-red-900 dark:border-red-600 dark:text-red-300 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0" />
                <span>配置错误：Firebase Auth 未初始化，无法登录。</span>
            </div>
        )}
        <input
          type="email"
          placeholder="管理员邮箱"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={!isFirebaseAvailable}
          className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100 disabled:opacity-50"
        />
        <input
          type="password"
          placeholder="密码"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={!isFirebaseAvailable}
          className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100 disabled:opacity-50"
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={isLoading || !isFirebaseAvailable}
          className="w-full bg-blue-600 text-white p-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-200 disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isLoading ? <Loader className="w-5 h-5 animate-spin mr-2" /> : <LogIn className="w-5 h-5 mr-2" />}
          {isFirebaseAvailable ? (isLoading ? '登录中...' : '登录') : '配置错误'}
        </button>
      </form>
    </Modal>
  );
};

/**
 * 搜索栏组件
 */
const SearchBar = ({ searchTerm, onSearchChange, onClear }) => (
  <div className="max-w-xl mx-auto px-4 my-8">
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
      <input
        type="text"
        placeholder="搜索分类或链接..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-full p-4 pl-10 pr-10 border border-gray-200 dark:border-gray-700 rounded-full shadow-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 dark:bg-gray-800 dark:text-gray-100"
      />
      {searchTerm && (
        <button
          onClick={onClear}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-all"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  </div>
);

/**
 * 公共导航展示组件
 */
const PublicNav = ({ navData, searchTerm }) => {
  const filteredNavData = useMemo(() => {
    if (!searchTerm) return navData;
    const lowerSearchTerm = searchTerm.toLowerCase();
    
    return navData
      .map((category) => ({
        ...category,
        // 过滤链接
        links: category.links.filter(
          (link) =>
            link.name.toLowerCase().includes(lowerSearchTerm) ||
            link.url.toLowerCase().includes(lowerSearchTerm)
        ),
      }))
      .filter((category) => category.links.length > 0 || category.title.toLowerCase().includes(lowerSearchTerm)) // 如果分类标题匹配或有匹配的链接，则显示
      .sort((a, b) => a.order - b.order); // 确保排序
  }, [navData, searchTerm]);

  return (
    <div className="space-y-10">
      {filteredNavData.length === 0 && (
        <p className="text-center text-gray-500 dark:text-gray-400 text-lg py-10">
          抱歉，没有找到匹配 "{searchTerm}" 的导航项。
        </p>
      )}
      {filteredNavData.map((category) => (
        <div key={category.id} className="pb-4">
          <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200 border-b-2 border-blue-500 pb-2">
            {category.title}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mt-6">
            {category.links.map((link) => {
              // 尝试从 lucide-react 获取图标
              const IconComponent = link.icon && lucideReactIcons[link.icon] ? lucideReactIcons[link.icon] : ExternalLink;
              
              return (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.03] border border-gray-100 dark:border-gray-700"
                >
                  <IconComponent className="w-8 h-8 text-blue-600 dark:text-blue-400 mb-2" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 text-center truncate w-full">
                    {link.name}
                  </span>
                </a>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};


// =========================================================================
// 管理面板组件 - 核心升级部分
// =========================================================================

// Lucide Icons 映射表，用于链接图标选择
const lucideReactIcons = {
    Search, Settings, LogIn, LogOut, Plus, Edit3, Trash2, ExternalLink, X, Save, Download, Loader, Moon, Sun, Home, AlertTriangle, Info, Layers, Link, ArrowUp, ArrowDown
};

/**
 * 链接编辑/添加表单
 */
const LinkForm = ({ initialData, categoryId, onSubmit, onCancel }) => {
    const [name, setName] = useState(initialData?.name || '');
    const [url, setUrl] = useState(initialData?.url || '');
    const [icon, setIcon] = useState(initialData?.icon || 'ExternalLink');
    const [id] = useState(initialData?.id);
    
    const isEditing = !!id;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name || !url) return;
        onSubmit(categoryId, { id, name, url, icon });
        onCancel(); // 关闭 modal
    };
    
    const IconComponent = lucideReactIcons[icon] || ExternalLink;

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <input
                type="text"
                placeholder="链接名称 (例如: GitHub)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full p-3 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 focus:ring-blue-500"
            />
            <input
                type="url"
                placeholder="链接 URL (例如: https://github.com/)"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
                className="w-full p-3 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 focus:ring-blue-500"
            />
            <div className="flex items-center space-x-3">
                <select
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    className="flex-grow p-3 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 focus:ring-blue-500 appearance-none"
                >
                    {Object.keys(lucideReactIcons).map((iconName) => (
                        <option key={iconName} value={iconName}>{iconName}</option>
                    ))}
                </select>
                <div className="p-2 border rounded-lg dark:border-gray-700 bg-gray-100 dark:bg-gray-700">
                    <IconComponent className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
            </div>
            
            <div className="flex justify-end space-x-3">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                    取消
                </button>
                <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center"
                >
                    <Save className="w-4 h-4 mr-2" />
                    {isEditing ? '保存修改' : '添加链接'}
                </button>
            </div>
        </form>
    );
};

/**
 * 分类编辑/添加表单
 */
const CategoryForm = ({ initialData, onSubmit, onCancel }) => {
    const [title, setTitle] = useState(initialData?.title || '');
    const [order, setOrder] = useState(initialData?.order || 99);
    const [id] = useState(initialData?.id);

    const isEditing = !!id;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!title) return;
        onSubmit({ id, title, order: Number(order) });
        onCancel(); // 关闭 modal
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <input
                type="text"
                placeholder="分类名称 (例如: AI 工具)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full p-3 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 focus:ring-blue-500"
            />
            <input
                type="number"
                placeholder="排序 (数字越小越靠前)"
                value={order}
                onChange={(e) => setOrder(e.target.value)}
                required
                min="0"
                className="w-full p-3 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 focus:ring-blue-500"
            />
            <div className="flex justify-end space-x-3">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                    取消
                </button>
                <button
                    type="submit"
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors flex items-center"
                >
                    <Save className="w-4 h-4 mr-2" />
                    {isEditing ? '保存修改' : '添加分类'}
                </button>
            </div>
        </form>
    );
};

/**
 * 分类管理 Tab 内容
 */
const CategoryManagement = ({ navData, onAddCategory, onEditCategory, onDeleteCategory, onMoveCategory }) => {
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);

    const handleEdit = (category) => {
        setEditingCategory(category);
        setShowModal(true);
    };

    const handleOpenAdd = () => {
        setEditingCategory(null);
        setShowModal(true);
    };

    const handleSubmit = (data) => {
        if (data.id) {
            onEditCategory(data.id, data);
        } else {
            onAddCategory(data);
        }
    };

    const sortedNavData = useMemo(() => {
        return [...navData].sort((a, b) => a.order - b.order);
    }, [navData]);

    return (
        <div className="space-y-6">
            <button
                onClick={handleOpenAdd}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-700 transition-colors flex items-center shadow-md"
            >
                <Plus className="w-5 h-5 mr-2" />
                新增分类
            </button>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                排序
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                分类名称
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                链接数
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                操作
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {sortedNavData.map((category, index) => (
                            <tr key={category.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                                    <div className="flex items-center space-x-2">
                                        <span>{category.order}</span>
                                        <div className="flex flex-col">
                                            <button 
                                                onClick={() => onMoveCategory(category.id, 'up')}
                                                disabled={index === 0}
                                                className="p-0.5 rounded text-gray-500 dark:text-gray-400 disabled:opacity-30 hover:bg-gray-200 dark:hover:bg-gray-600"
                                            >
                                                <ArrowUp className="w-3 h-3" />
                                            </button>
                                            <button 
                                                onClick={() => onMoveCategory(category.id, 'down')}
                                                disabled={index === sortedNavData.length - 1}
                                                className="p-0.5 rounded text-gray-500 dark:text-gray-400 disabled:opacity-30 hover:bg-gray-200 dark:hover:bg-gray-600"
                                            >
                                                <ArrowDown className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                                    {category.title}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                    {category.links?.length || 0}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button
                                        onClick={() => handleEdit(category)}
                                        className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200 mr-4 p-1 rounded hover:bg-indigo-50 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        <Edit3 className="w-4 h-4 inline" /> 编辑
                                    </button>
                                    <button
                                        onClick={() => onDeleteCategory(category.id)}
                                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200 p-1 rounded hover:bg-red-50 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4 inline" /> 删除
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <Modal 
                    title={editingCategory ? "编辑分类" : "新增分类"} 
                    onClose={() => setShowModal(false)}
                >
                    <CategoryForm 
                        initialData={editingCategory} 
                        onSubmit={handleSubmit} 
                        onCancel={() => setShowModal(false)} 
                    />
                </Modal>
            )}
        </div>
    );
};

/**
 * 链接管理 Tab 内容
 */
const LinkManagement = ({ navData, onAddLink, onEditLink, onDeleteLink }) => {
    const [showModal, setShowModal] = useState(false);
    const [editingLink, setEditingLink] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState(navData[0]?.id || '');

    useEffect(() => {
        // 自动选择第一个分类，如果没有则保持空
        if (!selectedCategory && navData.length > 0) {
            setSelectedCategory(navData[0].id);
        }
    }, [navData, selectedCategory]);
    
    const currentCategory = navData.find(c => c.id === selectedCategory);
    const sortedLinks = currentCategory?.links.sort((a, b) => (a.name > b.name) ? 1 : -1) || [];

    const handleEdit = (link) => {
        setEditingLink(link);
        setShowModal(true);
    };

    const handleOpenAdd = () => {
        if (!selectedCategory) {
            console.error("请先添加一个分类!");
            return;
        }
        setEditingLink(null);
        setShowModal(true);
    };

    const handleSubmit = (categoryId, data) => {
        if (data.id) {
            onEditLink(categoryId, data);
        } else {
            onAddLink(categoryId, data);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center space-x-4">
                <label className="text-gray-700 dark:text-gray-300 font-medium whitespace-nowrap">选择分类:</label>
                <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="p-3 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 focus:ring-blue-500 flex-grow"
                    disabled={navData.length === 0}
                >
                    {navData.length === 0 && <option value="">请先添加分类</option>}
                    {navData.map((category) => (
                        <option key={category.id} value={category.id}>
                            {category.title}
                        </option>
                    ))}
                </select>
                <button
                    onClick={handleOpenAdd}
                    disabled={!selectedCategory}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center shadow-md disabled:bg-gray-400"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    新增链接
                </button>
            </div>

            {!selectedCategory && navData.length > 0 && (
                 <p className="text-center text-orange-500 dark:text-orange-400 p-4 border border-orange-300 dark:border-orange-700 rounded-lg">
                    <Info className="w-5 h-5 inline mr-2" />
                    请选择一个分类来管理其中的链接。
                 </p>
            )}

            {selectedCategory && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">图标</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">名称</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">URL</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {sortedLinks.map((link) => {
                                const IconComponent = lucideReactIcons[link.icon] || ExternalLink;
                                return (
                                    <tr key={link.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <IconComponent className="w-5 h-5 text-blue-500" />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                                            {link.name}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-blue-600 dark:text-blue-400 truncate max-w-xs">
                                            <a href={link.url} target="_blank" rel="noopener noreferrer">{link.url}</a>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => handleEdit({ ...link, categoryId: selectedCategory })}
                                                className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200 mr-4 p-1 rounded hover:bg-indigo-50 dark:hover:bg-gray-700 transition-colors"
                                            >
                                                <Edit3 className="w-4 h-4 inline" /> 编辑
                                            </button>
                                            <button
                                                onClick={() => onDeleteLink(selectedCategory, link.id)}
                                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200 p-1 rounded hover:bg-red-50 dark:hover:bg-gray-700 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4 inline" /> 删除
                                            </button>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}


            {showModal && (
                <Modal 
                    title={editingLink ? "编辑链接" : "新增链接"} 
                    onClose={() => setShowModal(false)}
                >
                    <LinkForm 
                        initialData={editingLink} 
                        categoryId={selectedCategory} 
                        onSubmit={handleSubmit} 
                        onCancel={() => setShowModal(false)} 
                    />
                </Modal>
            )}
        </div>
    );
};

/**
 * 管理面板主组件
 */
const AdminPanel = ({ 
    navData, 
    onLoadDefaultData, 
    onAddCategory, onEditCategory, onDeleteCategory, onMoveCategory,
    onAddLink, onEditLink, onDeleteLink 
}) => {
    const [activeTab, setActiveTab] = useState('links');
    const [isDefaultLoading, setIsDefaultLoading] = useState(false);

    const handleLoadDefault = async () => {
        setIsDefaultLoading(true);
        try {
            await onLoadDefaultData();
        } catch (e) {
            console.error("加载默认数据失败:", e);
            // 弹出提示框 (使用自定义 modal 代替 alert)
            document.getElementById('root').insertAdjacentHTML('beforeend', `<div id="error-modal" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4"><div class="bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-6"><h3 class="text-xl font-semibold text-red-500 mb-4">操作失败</h3><p class="text-gray-800 dark:text-gray-200 mb-4">加载默认数据失败，请检查控制台错误信息。</p><button onclick="document.getElementById('error-modal').remove()" class="bg-red-600 text-white px-4 py-2 rounded-lg">关闭</button></div></div>`);
        } finally {
            setIsDefaultLoading(false);
        }
    };

    const tabs = [
        { id: 'links', label: '链接管理', icon: Link, component: LinkManagement },
        { id: 'categories', label: '分类管理', icon: Layers, component: CategoryManagement },
    ];

    const ActiveComponent = tabs.find(t => t.id === activeTab).component;

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-extrabold text-gray-800 dark:text-gray-100 border-b pb-2 mb-4">
                <Settings className="inline-block w-7 h-7 mr-2 text-blue-600 dark:text-blue-400" />
                管理面板
            </h2>

            {/* 顶部工具栏 */}
            <div className="flex justify-between items-center flex-wrap gap-4">
                <div className="flex border-b border-gray-200 dark:border-gray-700">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-2 text-lg font-medium transition-all duration-300 flex items-center ${
                                activeTab === tab.id
                                    ? 'text-blue-600 dark:text-blue-400 border-b-4 border-blue-600 dark:border-blue-400'
                                    : 'text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-300'
                            }`}
                        >
                            <tab.icon className="w-5 h-5 mr-2" />
                            {tab.label}
                        </button>
                    ))}
                </div>
                
                <button
                    onClick={handleLoadDefault}
                    disabled={isDefaultLoading}
                    className="bg-green-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-600 transition-colors flex items-center shadow-md disabled:bg-gray-400"
                >
                    {isDefaultLoading ? <Loader className="w-5 h-5 animate-spin mr-2" /> : <Download className="w-5 h-5 mr-2" />}
                    {isDefaultLoading ? '加载中...' : '加载默认数据'}
                </button>
            </div>

            {/* 活动组件内容 */}
            <ActiveComponent 
                navData={navData} 
                onAddCategory={onAddCategory}
                onEditCategory={onEditCategory}
                onDeleteCategory={onDeleteCategory}
                onMoveCategory={onMoveCategory}
                onAddLink={onAddLink} 
                onEditLink={onEditLink} 
                onDeleteLink={onDeleteLink}
            />
        </div>
    );
};


// =========================================================================
// 主应用组件
// =========================================================================

const App = () => {
  const [navData, setNavData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDark, setIsDark] = useState(false);
  
  // 检查 Firebase 服务是否实际初始化
  const isFirebaseAvailable = !!auth;

  // --- Firebase Auth & Init ---

  useEffect(() => {
    // 检查并设置黑暗模式
    const storedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (storedTheme === 'dark' || (!storedTheme && prefersDark)) {
        setIsDark(true);
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
  }, []);

  useEffect(() => {
    // 切换模式时更新 localStorage 和 DOM class
    if (isDark) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
    } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
    }
  }, [isDark]);


  useEffect(() => {
    if (!isFirebaseAvailable) {
        // 如果 Firebase 未初始化，直接停止加载并标记认证已就绪
        setIsLoading(false);
        setIsAuthReady(true);
        console.error("Firebase SDK 未初始化，无法进行身份验证和数据操作，请检查配置！");
        return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // 假设管理员 UID 是固定的，或通过环境变量配置
        // 🚨 注意：在实际应用中，管理员 UID 应该通过更安全的机制（如云函数）进行验证
        // 此处为简化示例，请自行替换为实际的管理员UID
        const ADMIN_UID = 'YOUR_ADMIN_UID_HERE'; 
        
        // 🚀 仅用于测试：如果当前环境提供了 __initial_auth_token，我们假设用户已通过授权，
        // 否则，只有当用户通过 email/password 登录时，才检查 UID。
        const isInitialAuth = typeof __initial_auth_token !== 'undefined';
        
        let isAdminUser = false;
        
        if (user.email) {
            // 如果是通过邮箱/密码登录，则严格检查 UID
            isAdminUser = user.uid === ADMIN_UID;
        } else if (isInitialAuth && user.isAnonymous) {
            // 如果是通过自定义 token 登录，我们暂时允许其为管理员
            isAdminUser = true;
        }

        setIsAdmin(isAdminUser);
        console.log('User logged in. Is Admin:', isAdminUser);

      } else {
        setIsAdmin(false);
      }
      setIsAuthReady(true);
      setIsLoading(false);
    });

    // 首次加载时进行认证
    if (typeof __initial_auth_token !== 'undefined') {
        signInWithCustomToken(auth, __initial_auth_token)
          .catch(e => {
            console.warn("Custom token sign-in failed. Falling back to anonymous. Error:", e.message);
            signInAnonymously(auth).catch(err => console.error("Anonymous sign-in failed:", err));
          });
    } else {
        signInAnonymously(auth).catch(e => console.error("Anonymous sign-in failed:", e));
    }

    return () => unsubscribe();
  }, [isFirebaseAvailable]); // 依赖于 Firebase 是否可用

  // --- Data Fetching ---

  useEffect(() => {
    if (!isFirebaseAvailable || !isAuthReady) return; // 确保 Firebase 和 Auth 准备就绪

    // 数据路径: /artifacts/{appId}/public/data/navData
    const navCollectionRef = collection(db, `artifacts/${appId}/public/data/navData`);

    const unsubscribe = onSnapshot(navCollectionRef, (snapshot) => {
        const data = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            // 确保 links 字段存在且是数组
            links: doc.data().links || [], 
        }));
        // 默认按 order 字段排序
        data.sort((a, b) => (a.order || 999) - (b.order || 999)); 
        setNavData(data);
        console.log("Navigation data updated successfully.");
    }, (error) => {
        console.error("Error fetching navigation data: ", error);
    });

    return () => unsubscribe();
  }, [isFirebaseAvailable, isAuthReady]); // 依赖于 Firebase 是否可用和认证状态

  // --- Auth Handlers ---

  const handleLogin = async (email, password) => {
    if (!isFirebaseAvailable) {
        setLoginError("Firebase SDK 未初始化，无法登录。");
        return;
    }
    setLoginError('');
    setIsLoginLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setShowLogin(false);
    } catch (error) {
      console.error("Login failed:", error);
      // 检查错误码并提供用户友好的信息
      if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
        setLoginError('邮箱或密码不正确。');
      } else {
        setLoginError('登录失败: ' + error.message);
      }
    } finally {
      setIsLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    if (!isFirebaseAvailable) return;
    try {
      await signOut(auth);
      // 退出后重新匿名登录，以保持公共数据访问权限
      await signInAnonymously(auth);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // --- Data Management Handlers ---

  // 1. 分类管理

  const handleAddCategory = useCallback(async ({ title, order }) => {
    if (!isFirebaseAvailable) return;
    try {
        await addDoc(collection(db, `artifacts/${appId}/public/data/navData`), {
            title,
            order: Number(order),
            links: [],
        });
        console.log("Category added successfully.");
    } catch (e) {
        console.error("Error adding category: ", e);
    }
  }, [isFirebaseAvailable]);

  const handleEditCategory = useCallback(async (id, { title, order }) => {
    if (!isFirebaseAvailable || !id) return;
    try {
        await updateDoc(doc(db, `artifacts/${appId}/public/data/navData`, id), {
            title,
            order: Number(order),
        });
        console.log("Category updated successfully.");
    } catch (e) {
        console.error("Error updating category: ", e);
    }
  }, [isFirebaseAvailable]);

  const handleDeleteCategory = useCallback(async (id) => {
    if (!isFirebaseAvailable || !id) return;
    // 使用自定义弹窗代替 window.confirm
    if (!confirm('确定要删除该分类及其所有链接吗？')) return;
    try {
        await deleteDoc(doc(db, `artifacts/${appId}/public/data/navData`, id));
        console.log("Category deleted successfully.");
    } catch (e) {
        console.error("Error deleting category: ", e);
    }
  }, [isFirebaseAvailable]);
  
  // 替换 window.confirm 为自定义确认逻辑（简化为浏览器原生，因为在 Canvas 环境下需要替换）
  const confirm = (message) => {
    // 实际项目中需要使用 Modal 代替，这里暂时使用 window.confirm 作为简化的模拟
    return window.confirm(message);
  }


  const handleMoveCategory = useCallback(async (id, direction) => {
    if (!isFirebaseAvailable || !id) return;
    const currentCategory = navData.find(c => c.id === id);
    if (!currentCategory) return;
    
    const sortedCategories = [...navData].sort((a, b) => a.order - b.order);
    const currentIndex = sortedCategories.findIndex(c => c.id === id);

    let targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex >= 0 && targetIndex < sortedCategories.length) {
        const targetCategory = sortedCategories[targetIndex];
        
        const batch = writeBatch(db);
        
        // 交换 order 值
        batch.update(doc(db, `artifacts/${appId}/public/data/navData`, currentCategory.id), { 
            order: targetCategory.order 
        });
        batch.update(doc(db, `artifacts/${appId}/public/data/navData`, targetCategory.id), { 
            order: currentCategory.order 
        });

        try {
            await batch.commit();
            console.log("Category order swapped successfully.");
        } catch (e) {
            console.error("Error swapping category order: ", e);
        }
    }
  }, [isFirebaseAvailable, navData]);

  // 2. 链接管理 (通过更新分类文档中的 links 数组实现)

  const handleAddLink = useCallback(async (categoryId, { name, url, icon }) => {
    if (!isFirebaseAvailable || !categoryId) return;
    const categoryDocRef = doc(db, `artifacts/${appId}/public/data/navData`, categoryId);
    
    // 生成本地 ID
    const newLinkId = Date.now().toString(36) + Math.random().toString(36).substr(2, 5); 

    const newLink = { id: newLinkId, name, url, icon: icon || 'ExternalLink' };
    
    try {
        const category = navData.find(c => c.id === categoryId);
        if (category) {
            const updatedLinks = [...(category.links || []), newLink];
            await updateDoc(categoryDocRef, { links: updatedLinks });
            console.log("Link added successfully.");
        }
    } catch (e) {
        console.error("Error adding link: ", e);
    }
  }, [isFirebaseAvailable, navData]);


  const handleEditLink = useCallback(async (categoryId, { id: linkId, name, url, icon }) => {
    if (!isFirebaseAvailable || !categoryId || !linkId) return;
    const categoryDocRef = doc(db, `artifacts/${appId}/public/data/navData`, categoryId);
    
    try {
        const category = navData.find(c => c.id === categoryId);
        if (category) {
            const updatedLinks = (category.links || []).map(link => 
                link.id === linkId ? { ...link, name, url, icon: icon || 'ExternalLink' } : link
            );
            await updateDoc(categoryDocRef, { links: updatedLinks });
            console.log("Link updated successfully.");
        }
    } catch (e) {
        console.error("Error editing link: ", e);
    }
  }, [isFirebaseAvailable, navData]);


  const handleDeleteLink = useCallback(async (categoryId, linkId) => {
    if (!isFirebaseAvailable || !categoryId || !linkId) return;
    if (!confirm('确定要删除此链接吗？')) return;

    const categoryDocRef = doc(db, `artifacts/${appId}/public/data/navData`, categoryId);
    
    try {
        const category = navData.find(c => c.id === categoryId);
        if (category) {
            const updatedLinks = (category.links || []).filter(link => link.id !== linkId);
            await updateDoc(categoryDocRef, { links: updatedLinks });
            console.log("Link deleted successfully.");
        }
    } catch (e) {
        console.error("Error deleting link: ", e);
    }
  }, [isFirebaseAvailable, navData]);

  // 3. 加载默认数据

  const handleLoadDefaultData = useCallback(async () => {
    if (!isFirebaseAvailable) {
        throw new Error("Firebase 未初始化");
    }
    if (!confirm('这将覆盖所有现有导航数据。确定要加载默认数据吗？')) return;

    const batch = writeBatch(db);
    const navCollectionRef = collection(db, `artifacts/${appId}/public/data/navData`);

    try {
      // 1. 删除所有现有文档
      const existingDocs = await getDocs(navCollectionRef);
      existingDocs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      // 2. 批量设置默认文档
      DEFAULT_DATA.forEach(data => {
        // 使用 setDoc 指定 ID，而不是 addDoc
        const docRef = doc(navCollectionRef, data.id);
        batch.set(docRef, data);
      });

      await batch.commit();
      console.log("Default data loaded and existing data cleared successfully.");

    } catch (e) {
      console.error("Error loading default data: ", e);
      throw e; // 抛出错误以在组件中处理加载状态
    }
  }, [isFirebaseAvailable]);


  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <Loader className="w-10 h-10 animate-spin text-blue-600" />
        <p className="ml-3 text-lg text-gray-600 dark:text-gray-400">加载中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-500">
      
      {/* 登录弹窗 */}
      {showLogin && (
        <LoginModal
          onClose={() => setShowLogin(false)}
          onLogin={handleLogin}
          error={loginError}
          isLoading={isLoginLoading}
          isFirebaseAvailable={isFirebaseAvailable} // 传递可用性状态
        />
      )}

      {/* 头部导航栏 */}
      <header className="max-w-7xl mx-auto flex justify-between items-center py-6 px-4 mb-8">
        <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">极速导航</h1>
        <div className="flex gap-4 items-center">
            <DarkModeToggle isDark={isDark} setIsDark={setIsDark} />
            
            {/* Firebase 配置错误提示 */}
            {!isFirebaseAvailable && (
                <div className="text-sm font-medium text-red-500 dark:text-red-400 p-2 rounded-lg bg-red-100 dark:bg-red-900 flex items-center shadow-inner">
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    配置错误
                </div>
            )}

            {isAdmin && isFirebaseAvailable ? (
                <>
                    <span className="text-sm font-medium text-green-600 dark:text-green-400 hidden sm:inline">管理员模式</span>
                    <button 
                        onClick={handleLogout} 
                        className="text-white bg-red-500 hover:bg-red-600 border px-3 py-1 rounded-full font-semibold transition-colors flex items-center shadow-lg"
                    >
                        <LogOut className="w-4 h-4 mr-1" />
                        退出管理
                    </button>
                </>
            ) : (
                <button 
                    onClick={() => isFirebaseAvailable && setShowLogin(true)} 
                    disabled={!isFirebaseAvailable} // 禁用按钮
                    className="text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-800 border-2 border-blue-600 dark:border-blue-400 px-3 py-1 rounded-full font-bold transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-50 dark:hover:bg-gray-700"
                >
                    管理员登录
                </button>
            )}
        </div>
      </header>

      {/* 搜索栏 */}
      <SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} onClear={() => setSearchTerm('')} />

      {/* 导航内容 - 外部居中容器 */}
      <div className="max-w-7xl mx-auto px-4 pb-12">
        {/* 新增美观的背景卡片效果容器 */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-6 md:p-10 border border-gray-100 dark:border-gray-700">
          {isFirebaseAvailable ? (
            // 只有当 Firebase 可用时才加载 AdminPanel/PublicNav
            isAdmin ? (
                <AdminPanel
                navData={navData}
                onLoadDefaultData={handleLoadDefaultData}
                
                // 分类管理函数
                onAddCategory={handleAddCategory}
                onEditCategory={handleEditCategory}
                onDeleteCategory={handleDeleteCategory}
                onMoveCategory={handleMoveCategory}
                
                // 链接管理函数
                onAddLink={handleAddLink}
                onEditLink={handleEditLink}
                onDeleteLink={handleDeleteLink}
                />
            ) : (
                <PublicNav navData={navData} searchTerm={searchTerm} />
            )
          ) : (
              <div className="text-center py-20">
                  <AlertTriangle className="w-16 h-16 mx-auto text-red-500 mb-4" />
                  <h3 className="text-2xl font-semibold text-red-600 dark:text-red-400">系统错误：配置缺失</h3>
                  <p className="mt-2 text-gray-600 dark:text-gray-400">
                      无法加载 Firebase 数据库配置。请联系应用管理员解决配置问题。
                  </p>
              </div>
          )}
        </div>
      </div>

      {/* 底部版权 */}
      <footer className="text-center text-gray-500 dark:text-gray-500 text-sm mt-16 pb-4 px-4">
        © {new Date().getFullYear()} 极速导航 - 精选高效工具
      </footer>
    </div>
  );
};

export default App;