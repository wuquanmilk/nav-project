import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, signInWithCustomToken, signInAnonymously } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, doc, setDoc, deleteDoc, query, orderBy, addDoc, getDoc, updateDoc, writeBatch, getDocs } from 'firebase/firestore';
import { AlertTriangle, Home, LogIn, Settings, Plus, X, Edit3, Save, Trash2, Loader, ExternalLink, Search, Download } from 'lucide-react';

// --- 真实的 Firebase 配置 ---
const REAL_FIREBASE_CONFIG = {
    apiKey: "AIzaSyAlkYbLP4jW1P-XRJtCvC6id8GlIxxY8m4",
    authDomain: "wangzhandaohang.firebaseapp.com",
    projectId: "wangzhandaohang",
    storageBucket: "wangzhandaohang.firebasestorage.app",
    messagingSenderId: "169263636408",
    appId: "1:169263636408:web:ee3608652b2872a539b94d",
    measurementId: "G-6JGHTS41NH"
};

// 使用真实配置覆盖
const firebaseConfig = REAL_FIREBASE_CONFIG;
const appId = REAL_FIREBASE_CONFIG.appId;
const initialAuthToken = null;

// 您的管理员 UID
const ADMIN_UID_PLACEHOLDER = "6UiUdmPna4RJb2hNBoXhx3XCTFN2";

// --- 默认链接数据 ---
const DEFAULT_LINKS_DATA = {
    "AI/效率工具": [
        { title: "ChatGPT", url: "https://chat.openai.com/", description: "强大的多模态语言模型" },
        { title: "Claude AI", url: "https://claude.ai/", description: "Anthropic 的对话AI，擅长长文本处理" },
        { title: "Midjourney", url: "https://www.midjourney.com/app/", description: "AI绘画和图像生成工具" },
        { title: "Notion", url: "https://www.notion.so/", description: "一体化的笔记、项目管理和知识库" },
        { title: "Perplexity", url: "https://www.perplexity.ai/", description: "基于AI的答案引擎和研究工具" },
    ],
    "前端开发": [
        { title: "MDN Web Docs", url: "https://developer.mozilla.org/zh-CN/", description: "Web开发权威参考文档" },
        { title: "React 官网", url: "https://react.dev/", description: "构建用户界面的JavaScript库" },
        { title: "Tailwind CSS", url: "https://tailwindcss.com/", description: "实用至上 (Utility-First) CSS框架" },
        { title: "GitHub", url: "https://github.com/", description: "全球最大的代码托管与协作平台" },
        { title: "Vercel", url: "https://vercel.com/", description: "前端应用托管与部署服务" },
    ],
    "设计资源": [
        { title: "Figma", url: "https://www.figma.com/", description: "协作式界面设计与原型工具" },
        { title: "Unsplash", url: "https://unsplash.com/", description: "免费高分辨率图片资源库" },
        { title: "Dribbble", url: "https://dribbble.com/", description: "设计师作品展示社区" },
        { title: "Lucide Icons", url: "https://lucide.dev/", description: "开源、一致性强的矢量图标库" },
    ],
    "常用工具": [
        { title: "Google", url: "https://www.google.com/", description: "全球最大的搜索引擎" },
        { title: "YouTube", url: "https://www.youtube.com/", description: "全球领先的视频分享网站" },
        { title: "稀土掘金", url: "https://juejin.cn/", description: "面向开发者的技术社区" },
    ],
};

// ----------------------------------------------------
// 1. 公共导航区组件 (PublicNav) - 优化居中布局
// ----------------------------------------------------

const PublicNav = React.memo(({ navData, searchTerm }) => {
    const filteredNavData = useMemo(() => {
        if (!searchTerm) return navData;
        const lowerCaseSearch = searchTerm.toLowerCase();
        const filtered = {};

        Object.entries(navData).forEach(([category, links]) => {
            const matchingLinks = links.filter(link =>
                link.title.toLowerCase().includes(lowerCaseSearch) ||
                (link.description && link.description.toLowerCase().includes(lowerCaseSearch)) ||
                link.url.toLowerCase().includes(lowerCaseSearch) ||
                category.toLowerCase().includes(lowerCaseSearch)
            );

            if (matchingLinks.length > 0) {
                filtered[category] = matchingLinks;
            }
        });
        return filtered;
    }, [navData, searchTerm]);

    const displayData = searchTerm ? filteredNavData : navData;

    if (Object.keys(displayData).length === 0) {
        return (
            <div className="flex justify-center items-center h-64 text-gray-500 dark:text-gray-400">
                <p>{searchTerm ? `没有找到与 "${searchTerm}" 匹配的链接。` : '暂无导航数据，请管理员添加。'}</p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {Object.keys(displayData).sort().map(category => (
                <div key={category} className="mb-12">
                    {/* 居中类别标题 */}
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white inline-block border-b-4 border-indigo-500 pb-2 px-6">
                            {category}
                        </h2>
                    </div>
                    
                    {/* 居中网格容器 */}
                    <div className="flex justify-center">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 w-full max-w-6xl">
                            {displayData[category].map(link => (
                                <a
                                    key={link.id}
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-center bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md hover:shadow-xl transition duration-300 transform hover:scale-105 border border-gray-100 dark:border-gray-700 group"
                                >
                                    <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-xl flex items-center justify-center text-lg font-bold shadow-lg">
                                        {link.title ? link.title[0].toUpperCase() : '?'}
                                    </div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 transition-colors line-clamp-1">
                                        {link.title}
                                    </h3>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                                        {link.description || link.url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}
                                    </p>
                                </a>
                            ))}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
});

// ----------------------------------------------------
// 2. 管理员登录组件 (AdminLogin)
// ----------------------------------------------------

const AdminLogin = ({ auth, onLoginSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = useCallback(async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
            onLoginSuccess();
        } catch (err) {
            console.error("Login failed:", err);
            setError('登录失败：' + (err.message || '请检查邮箱和密码。'));
        } finally {
            setIsLoading(false);
        }
    }, [auth, email, password, onLoginSuccess]);

    return (
        <div className="flex justify-center items-center p-8 min-h-[calc(100vh-56px)] bg-gray-50 dark:bg-gray-900">
            <div className="w-full max-w-md bg-white dark:bg-gray-800 p-8 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700">
                <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-6">管理员登录</h2>
                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="email">邮箱</label>
                        <input
                            id="email"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition duration-150"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="password">密码</label>
                        <input
                            id="password"
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition duration-150"
                        />
                    </div>
                    {error && (
                        <p className="text-red-500 text-sm flex items-center">
                            <AlertTriangle className="w-4 h-4 mr-2" />
                            {error}
                        </p>
                    )}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 disabled:opacity-50"
                    >
                        {isLoading ? <Loader className="w-5 h-5 animate-spin mr-2" /> : <LogIn className="w-5 h-5 mr-2" />}
                        {isLoading ? '登录中...' : '登录'}
                    </button>
                </form>
            </div>
        </div>
    );
};

// ----------------------------------------------------
// 3. 管理员面板组件 (AdminPanel) - 重点优化居中布局
// ----------------------------------------------------

const AdminPanel = ({ db, navData, userId }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [editLink, setEditLink] = useState(null);
    const [newLink, setNewLink] = useState({ category: '', title: '', url: '', description: '' });
    const [currentStatus, setCurrentStatus] = useState('');
    const [isDataLoading, setIsDataLoading] = useState(false);

    const allCategories = useMemo(() => {
        return Object.keys(navData).sort();
    }, [navData]);

    const publicCollectionRef = useMemo(() => {
        if (!db) return null;
        return collection(db, 'artifacts', appId, 'public', 'data', 'navigation_links');
    }, [db]);

    const loadDefaultData = useCallback(async () => {
        if (Object.values(navData).flat().length > 0) {
            if (!window.confirm('数据库中已存在数据，确定要加载默认数据吗？这将重复添加！')) return;
        }

        setIsDataLoading(true);
        setCurrentStatus('正在批量添加默认链接...');
        const batch = writeBatch(db);
        let linkCount = 0;

        try {
            Object.entries(DEFAULT_LINKS_DATA).forEach(([category, links]) => {
                links.forEach(link => {
                    const newDocRef = doc(publicCollectionRef);
                    batch.set(newDocRef, {
                        ...link,
                        category: category,
                        createdAt: new Date(),
                        createdBy: userId,
                    });
                    linkCount++;
                });
            });

            await batch.commit();
            setCurrentStatus(`成功添加 ${linkCount} 条默认链接！`);
        } catch (error) {
            console.error("Error loading default data: ", error);
            setCurrentStatus('批量添加失败：' + error.message);
        } finally {
            setIsDataLoading(false);
            setTimeout(() => setCurrentStatus(''), 5000);
        }
    }, [db, navData, publicCollectionRef, userId]);

    const handleFormChange = useCallback((e) => {
        const { name, value } = e.target;
        if (editLink) {
            setEditLink(prev => ({ ...prev, [name]: value }));
        } else {
            setNewLink(prev => ({ ...prev, [name]: value }));
        }
    }, [editLink]);

    const clearForm = useCallback(() => {
        setNewLink({ category: allCategories[0] || '', title: '', url: '', description: '' });
        setIsAdding(false);
        setEditLink(null);
    }, [allCategories]);

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        setCurrentStatus('保存中...');
        const data = editLink || newLink;

        if (!data.category || !data.title || !data.url) {
            setCurrentStatus('错误: 类别、标题和 URL 不能为空。');
            return;
        }

        try {
            if (editLink) {
                const docRef = doc(publicCollectionRef, data.id);
                await updateDoc(docRef, {
                    category: data.category.trim(),
                    title: data.title.trim(),
                    url: data.url.trim(),
                    description: data.description.trim(),
                    updatedAt: new Date(),
                    updatedBy: userId,
                });
                setCurrentStatus('链接更新成功！');
            } else {
                await addDoc(publicCollectionRef, {
                    category: data.category.trim(),
                    title: data.title.trim(),
                    url: data.url.trim(),
                    description: data.description.trim(),
                    createdAt: new Date(),
                    createdBy: userId,
                });
                setCurrentStatus('链接添加成功！');
                clearForm();
            }
        } catch (error) {
            console.error("Error saving link: ", error);
            setCurrentStatus('操作失败：' + error.message);
        } finally {
            setTimeout(() => setCurrentStatus(''), 3000);
        }
    }, [editLink, newLink, publicCollectionRef, userId, clearForm]);

    const handleDelete = useCallback(async (id) => {
        if (!window.confirm('确定要删除此链接吗？')) return;
        setCurrentStatus('删除中...');
        try {
            await deleteDoc(doc(publicCollectionRef, id));
            setCurrentStatus('链接删除成功！');
        } catch (error) {
            console.error("Error deleting link: ", error);
            setCurrentStatus('删除失败：' + error.message);
        } finally {
            setTimeout(() => setCurrentStatus(''), 3000);
        }
    }, [publicCollectionRef]);

    const LinkForm = (item) => (
        <div className="flex justify-center mb-8">
            <form onSubmit={handleSubmit} className="w-full max-w-2xl bg-white dark:bg-gray-800 p-6 rounded-xl shadow-2xl border border-indigo-200 dark:border-indigo-600 space-y-4">
                <h3 className="text-xl font-bold text-indigo-600 dark:text-indigo-300 text-center">{item.id ? '编辑链接' : '新增链接'}</h3>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">类别 (Category)</label>
                    <select
                        name="category"
                        value={item.category}
                        onChange={handleFormChange}
                        required
                        className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white"
                    >
                        <option value="">-- 选择或输入新类别 --</option>
                        {allCategories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                    <input
                        type="text"
                        name="category"
                        value={item.category}
                        onChange={handleFormChange}
                        placeholder="或直接输入新类别名称"
                        required
                        className="w-full mt-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">标题 (Title)</label>
                    <input
                        type="text"
                        name="title"
                        value={item.title}
                        onChange={handleFormChange}
                        placeholder="网站名称"
                        required
                        className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">URL</label>
                    <input
                        type="url"
                        name="url"
                        value={item.url}
                        onChange={handleFormChange}
                        placeholder="https://example.com"
                        required
                        className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">描述 (Description) (可选)</label>
                    <textarea
                        name="description"
                        value={item.description}
                        onChange={handleFormChange}
                        placeholder="网站的简短描述"
                        rows="2"
                        className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                    />
                </div>
                <div className="flex justify-center space-x-3">
                    <button
                        type="button"
                        onClick={clearForm}
                        className="flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                    >
                        <X className="w-4 h-4 mr-2" />取消
                    </button>
                    <button
                        type="submit"
                        className="flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                        <Save className="w-4 h-4 mr-2" />{item.id ? '保存修改' : '添加链接'}
                    </button>
                </div>
            </form>
        </div>
    );

    const LinkItem = ({ link }) => (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">{link.title}</h3>
                    <span className="inline-block bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 text-xs px-2 py-1 rounded-full mt-1">
                        {link.category}
                    </span>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate mt-2">{link.url}</p>
                </div>
                <div className="flex space-x-2 ml-4">
                    <a 
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-green-600 hover:bg-green-100 dark:text-green-400 dark:hover:bg-gray-700 rounded-full transition"
                        title="访问"
                    >
                        <ExternalLink className="w-4 h-4" />
                    </a>
                    <button
                        onClick={() => { setEditLink(link); setIsAdding(false); }}
                        className="p-2 text-indigo-600 hover:bg-indigo-100 dark:text-indigo-400 dark:hover:bg-gray-700 rounded-full transition"
                        title="编辑"
                    >
                        <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => handleDelete(link.id)}
                        className="p-2 text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-gray-700 rounded-full transition"
                        title="删除"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );

    const allLinks = useMemo(() => {
        return Object.values(navData).flat().sort((a, b) => a.category.localeCompare(b.category) || a.title.localeCompare(b.title));
    }, [navData]);

    return (
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* 居中标题区域 */}
            <div className="text-center mb-8">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                    <Settings className="w-8 h-8 mr-3 text-indigo-600 inline" />
                    导航管理面板
                </h1>
                
                {/* 用户信息卡片居中 */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 max-w-2xl mx-auto mb-6">
                    <p className="text-sm text-blue-800 dark:text-blue-300">
                        <span className="font-semibold">当前用户 ID:</span> 
                        <code className="bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded ml-2">{userId}</code>
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                        只有匹配管理员 UID 的用户拥有写权限
                    </p>
                </div>
            </div>

            {/* 居中按钮组 */}
            <div className="flex justify-center gap-4 mb-8 flex-wrap">
                <button
                    onClick={() => { setIsAdding(true); setEditLink(null); }}
                    className="flex items-center px-6 py-3 bg-indigo-600 text-white rounded-xl shadow-lg hover:bg-indigo-700 transition duration-150 font-semibold"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    添加新链接
                </button>
                <button
                    onClick={loadDefaultData}
                    disabled={isDataLoading}
                    className="flex items-center px-6 py-3 bg-green-600 text-white rounded-xl shadow-lg hover:bg-green-700 transition duration-150 font-semibold disabled:opacity-50"
                >
                    {isDataLoading ? <Loader className="w-5 h-5 mr-2 animate-spin" /> : <Download className="w-5 h-5 mr-2" />}
                    {isDataLoading ? '加载中...' : '一键加载默认数据'}
                </button>
            </div>

            {currentStatus && (
                <div className="text-center">
                    <div className="inline-block p-3 mb-4 text-sm font-medium text-green-700 bg-green-100 rounded-lg dark:bg-green-800 dark:text-green-200">
                        {currentStatus}
                    </div>
                </div>
            )}

            {/* 表单区域 */}
            {(isAdding || editLink) && (
                <LinkForm {...(editLink || newLink)} />
            )}

            {/* 链接列表区域 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        全部链接 ({allLinks.length})
                    </h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {allLinks.length > 0 ? (
                        allLinks.map(link => <LinkItem key={link.id} link={link} />)
                    ) : (
                        <div className="col-span-full text-center py-8 text-gray-500">
                            暂无链接，请点击"添加新链接"或"一键加载默认数据"开始。
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ----------------------------------------------------
// 4. 主应用组件 (App) - 优化整体布局
// ----------------------------------------------------

const App = () => {
    const [navData, setNavData] = useState({});
    const [view, setView] = useState('public');
    const [auth, setAuth] = useState(null);
    const [db, setDb] = useState(null);
    const [userId, setUserId] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        try {
            const app = initializeApp(firebaseConfig);
            const authInstance = getAuth(app);
            const dbInstance = getFirestore(app);
            setAuth(authInstance);
            setDb(dbInstance);

            const unsubscribe = onAuthStateChanged(authInstance, async (user) => {
                const currentUserId = user ? user.uid : null;
                setUserId(currentUserId);

                const userIsAdmin = user && user.uid === ADMIN_UID_PLACEHOLDER;
                setIsAdmin(userIsAdmin);

                if (userIsAdmin && view !== 'admin') {
                    setView('admin');
                } else if (!userIsAdmin && view === 'admin') {
                    setView('public');
                }

                setIsAuthReady(true);
                setIsLoading(false);
            });

            const authenticate = async () => {
                if (!authInstance.currentUser) {
                    try {
                        await signInAnonymously(authInstance);
                    } catch (error) {
                        console.warn("自动匿名登录失败:", error);
                    }
                }
            };

            authenticate();

            return () => unsubscribe();
        } catch (e) {
            console.error("Firebase initialization failed:", e);
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!db || !isAuthReady) return;
        
        const publicCollectionPath = ['artifacts', appId, 'public', 'data', 'navigation_links'];
        const collectionRef = collection(db, ...publicCollectionPath);

        const unsubscribe = onSnapshot(collectionRef, (snapshot) => {
            const links = {};
            snapshot.forEach(doc => {
                const data = { id: doc.id, ...doc.data() };
                const category = data.category || '未分类';
                if (!links[category]) {
                    links[category] = [];
                }
                links[category].push(data);
            });

            Object.keys(links).forEach(category => {
                links[category].sort((a, b) => a.title.localeCompare(b.title));
            });

            setNavData(links);
        }, (error) => {
            if (error.code !== 'permission-denied') {
                 console.error("Error fetching navigation data:", error);
            }
        });

        return () => unsubscribe();
    }, [db, isAuthReady, auth?.currentUser]);

    const handleLogout = useCallback(async () => {
        if (auth) {
            await signOut(auth);
            try {
                 await signInAnonymously(auth);
            } catch (e) {
                console.warn("Re-auth failed:", e);
            }
        }
        setView('public');
    }, [auth]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50 dark:bg-gray-900">
                <Loader className="w-10 h-10 animate-spin text-indigo-500" />
                <p className="ml-3 text-lg text-gray-700 dark:text-gray-300">加载中...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300 font-sans">
            {/* 导航栏 */}
            <nav className="sticky top-0 z-10 bg-white dark:bg-gray-800 shadow-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex-shrink-0">
                            <h1 className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 cursor-pointer flex items-center" onClick={() => { setView('public'); setSearchTerm(''); }}>
                                🚀 极速导航
                            </h1>
                        </div>

                        <div className="flex items-center space-x-2">
                            {isAdmin ? (
                                <>
                                    <button
                                        onClick={() => { setView('admin'); setSearchTerm(''); }}
                                        className={`p-2 rounded-xl text-sm font-medium transition duration-150 flex items-center ${view === 'admin' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                                    >
                                        <Settings className="w-5 h-5" />
                                        <span className="hidden sm:inline ml-1">管理</span>
                                    </button>
                                    <button
                                        onClick={handleLogout}
                                        className="p-2 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900 transition duration-150 flex items-center"
                                    >
                                        <LogIn className="w-5 h-5" />
                                        <span className="hidden sm:inline ml-1">登出</span>
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => { setView('login'); setSearchTerm(''); }}
                                    className={`p-2 rounded-xl text-sm font-medium transition duration-150 flex items-center ${view === 'login' ? 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                                >
                                    <LogIn className="w-5 h-5" />
                                    <span className="hidden sm:inline ml-1">登录</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* 主内容区域 */}
            <div className="flex justify-center w-full">
                <div className="w-full max-w-7xl">
                    <main className="text-gray-900 dark:text-gray-100 px-4 sm:px-6 lg:px-8">
                        {view === 'public' && (
                            <>
                                <div className="pt-12 pb-8 flex justify-center">
                                    <div className="relative w-full max-w-2xl">
                                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="搜索网站标题、描述或类别..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full pl-12 pr-10 py-3 text-lg border-2 border-indigo-300 dark:border-indigo-700 rounded-full focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:text-white shadow-xl"
                                        />
                                        {searchTerm && (
                                            <button
                                                onClick={() => setSearchTerm('')}
                                                className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 rounded-full text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <PublicNav navData={navData} searchTerm={searchTerm} />
                            </>
                        )}
                        
                        {view === 'login' && auth && <AdminLogin auth={auth} onLoginSuccess={() => setView('admin')} />}
                        
                        {view === 'admin' && isAuthReady && db && (
                            isAdmin ? (
                                <AdminPanel db={db} navData={navData} userId={userId} />
                            ) : (
                                <div className="text-center p-20 text-red-500 text-xl bg-white dark:bg-gray-800 m-8 rounded-xl shadow-lg max-w-3xl mx-auto">
                                    <AlertTriangle className="w-10 h-10 mx-auto mb-4" />
                                    <h2 className="font-bold mb-2">权限不足</h2>
                                    <p>您没有管理员权限。请先登录，并确保您的 UID ({userId}) 匹配代码中的管理员 UID。</p>
                                </div>
                            )
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
};

export default App;