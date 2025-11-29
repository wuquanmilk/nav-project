import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, signInWithCustomToken, signInAnonymously } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, doc, setDoc, deleteDoc, query, orderBy, addDoc, getDocs } from 'firebase/firestore';
import { Home, LogIn, Settings, LogOut, Loader, Search, X, Plus, Trash2, Edit, Link, Zap, BookOpen, Cpu, Globe } from 'lucide-react'; 

// --- 实用工具函数 ---

/**
 * 格式化 Firestore 时间戳或 Date 对象为易读字符串
 * @param {Date | {toDate: () => Date}} date
 * @returns {string} 格式化后的日期字符串
 */
const formatTimestamp = (date) => {
    if (date && typeof date.toDate === 'function') {
        date = date.toDate();
    }
    if (date instanceof Date) {
        return date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    }
    return '未知时间';
};

// --- Firebase 配置和初始化 ---
const firebaseConfig = {
    apiKey: "AIzaSyAlkYbLP4jW1P-XRJtCvC6id8GlIxxY8m4",
    authDomain: "wangzhandaohang.firebaseapp.com",
    projectId: "wangzhandaohang",
    storageBucket: "wangzhandaohang.firebasestorage.app",
    messagingSenderId: "169263636408",
    appId: "1:169263636408:web:07e86e3011ed026c483256",
    measurementId: "G-G91F9W3S3L"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// 清理 appId 以确保 Firestore 路径有效
const rawAppId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const appId = rawAppId.replace(/\//g, '_'); 

// 占位管理员 UID：请替换为您实际的 UID 进行测试。
const ADMIN_UID_PLACEHOLDER = 'ADMIN_UID_PLACEHOLDER'; 

// --- 初始导航数据（模仿 nav.eooce.com 的热门链接结构） ---
const INITIAL_NAV_LINKS = [
    { name: "Google", url: "https://www.google.com/", description: "全球最大的搜索引擎" },
    { name: "Bing", url: "https://www.bing.com/", description: "微软旗下的搜索引擎，具有强大的AI集成" },
    { name: "YouTube", url: "https://www.youtube.com/", description: "全球最大的视频分享平台" },
    { name: "GitHub", url: "https://github.com/", description: "全球最大的软件开发平台" },
    { name: "知乎", url: "https://www.zhihu.com/", description: "中文互联网高质量的问答社区" },
    { name: "淘宝", url: "https://www.taobao.com/", description: "亚洲最大的网上零售平台" },
    { name: "百度", url: "https://www.baidu.com/", description: "中国最大的搜索引擎" },
    { name: "B站", url: "https://www.bilibili.com/", description: "哔哩哔哩，年轻人潮流文化娱乐社区" },
];

// --- 确认删除模态框组件 ---
const DeleteConfirmationModal = ({ item, onConfirm, onCancel }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
            <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-sm transform transition-all duration-300 scale-100 border-t-4 border-red-500">
                <h3 className="text-xl font-bold text-red-600 mb-4 flex items-center">
                    <Trash2 className="w-5 h-5 mr-2" />
                    确认删除
                </h3>
                <p className="text-gray-700 mb-6 text-sm">
                    您确定要永久删除 **{item.name}** 吗？此操作不可撤销。
                </p>
                <div className="flex justify-end space-x-3">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition duration-150"
                    >
                        取消
                    </button>
                    <button
                        onClick={() => onConfirm(item.id)}
                        className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg shadow-md hover:bg-red-700 transition duration-150"
                    >
                        确认删除
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- 公共导航视图组件 (高度模仿 nav.eooce.com 风格) ---
const PublicNav = ({ navData }) => {
    const [searchTerm, setSearchTerm] = useState('');

    // 过滤链接
    const filteredNavData = useMemo(() => {
        if (!searchTerm) return navData;
        const lowerCaseSearch = searchTerm.toLowerCase();
        return navData.filter(item => 
            item.name.toLowerCase().includes(lowerCaseSearch) ||
            item.url.toLowerCase().includes(lowerCaseSearch) ||
            (item.description && item.description.toLowerCase().includes(lowerCaseSearch))
        );
    }, [navData, searchTerm]);

    // 模拟分组（在没有分类字段的情况下，所有链接放在一个组）
    const groupedData = useMemo(() => {
        return {
            "全部精选链接": filteredNavData
        };
    }, [filteredNavData]);

    // 根据链接名称选择一个 Lucide 图标 (用于美观)
    const getLinkIcon = (name) => {
        const lowerName = name.toLowerCase();
        if (lowerName.includes('ai') || lowerName.includes('chatgpt') || lowerName.includes('bing') || lowerName.includes('gemini')) return Cpu;
        if (lowerName.includes('github') || lowerName.includes('开发') || lowerName.includes('code')) return BookOpen;
        if (lowerName.includes('google') || lowerName.includes('百度') || lowerName.includes('search')) return Search;
        if (lowerName.includes('youtube') || lowerName.includes('b站') || lowerName.includes('视频')) return Zap;
        return Link;
    };

    return (
        <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 pt-12">
            
            {/* 居中搜索栏 - 突出显示 */}
            <div className="mb-12 flex justify-center">
                <div className="relative w-full max-w-xl">
                    <input
                        type="text"
                        placeholder="搜索您需要的网址 (例如：Google, AI工具)..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full py-4 pl-12 pr-6 text-lg border border-gray-300 rounded-xl shadow-xl focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition duration-300"
                    />
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400" />
                </div>
            </div>

            {/* 结果显示 */}
            {Object.keys(groupedData).map(groupName => {
                const links = groupedData[groupName];
                if (links.length === 0 && searchTerm) {
                    return null; // 如果搜索结果为空，不显示组标题
                }
                
                return (
                    <div key={groupName} className="mb-10">
                        <h3 className="text-2xl font-bold text-gray-800 mb-6 border-b-2 border-indigo-200 pb-2">
                            {groupName} ({links.length})
                        </h3>

                        {links.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {links.map((item) => {
                                    const Icon = getLinkIcon(item.name);
                                    return (
                                        <a
                                            key={item.id}
                                            href={item.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            title={item.description || item.url}
                                            className="bg-white p-4 rounded-xl shadow-md hover:shadow-lg transition duration-200 transform hover:-translate-y-0.5 border border-gray-100 flex items-center space-x-3 group min-h-[70px]"
                                        >
                                            {/* 图标 - 根据名称动态选择 */}
                                            <div className="w-8 h-8 flex items-center justify-center rounded-full bg-indigo-50 text-indigo-500 flex-shrink-0">
                                                <Icon className="w-4 h-4" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-gray-700 truncate group-hover:text-indigo-600 text-sm">
                                                    {item.name}
                                                </p>
                                            </div>
                                        </a>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center p-12 bg-white rounded-xl shadow-md text-gray-500 border border-dashed">
                                <Search className="w-8 h-8 mx-auto mb-3 text-indigo-400 opacity-60" />
                                <p className="text-lg font-medium">抱歉，没有找到匹配 "{searchTerm}" 的结果。</p>
                            </div>
                        )}
                    </div>
                );
            })}

            {!searchTerm && navData.length === 0 && (
                <div className="col-span-full text-center p-16 bg-white rounded-2xl shadow-xl text-gray-500 border-2 border-dashed border-indigo-200">
                    <p className="text-lg font-medium">当前导航列表为空。管理员请登录并添加第一个链接！</p>
                </div>
            )}
        </div>
    );
};

// --- 登录组件 (保持简洁) ---
const AdminLogin = ({ onLoginSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoggingIn(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
            onLoginSuccess();
        } catch (err) {
            console.error('Login Error:', err);
            setError('登录失败：邮箱或密码错误。');
        } finally {
            setIsLoggingIn(false);
        }
    };

    return (
        <div className="max-w-sm mx-auto py-20 px-4">
            <div className="bg-white p-8 rounded-2xl shadow-2xl border-t-4 border-indigo-500">
                <h2 className="text-2xl font-bold text-center text-indigo-700 mb-6">管理员登录</h2>
                <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-inner focus:ring-indigo-500 focus:border-indigo-500 transition"
                            placeholder="邮箱"
                        />
                    </div>
                    <div>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-inner focus:ring-indigo-500 focus:border-indigo-500 transition"
                            placeholder="密码"
                        />
                    </div>
                    {error && (
                        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
                            {error}
                        </div>
                    )}
                    <button
                        type="submit"
                        disabled={isLoggingIn}
                        className="w-full flex justify-center items-center py-3 px-4 rounded-lg shadow-md text-base font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition duration-200 disabled:bg-indigo-400"
                    >
                        {isLoggingIn ? <Loader className="w-5 h-5 animate-spin mr-2" /> : <LogIn className="w-5 h-5 mr-2" />}
                        {isLoggingIn ? '正在验证...' : '登录'}
                    </button>
                </form>
            </div>
        </div>
    );
};

// --- 添加/编辑表单组件 (通用) ---
const AddEditLinkForm = ({ link, onSubmit, onCancel }) => {
    const [name, setName] = useState(link?.name || '');
    const [url, setUrl] = useState(link?.url || '');
    const [description, setDescription] = useState(link?.description || '');
    const [isSaving, setIsSaving] = useState(false);
    const isEditing = !!link;

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsSaving(true);
        onSubmit({ id: link?.id, name, url, description }); 
        // 父组件将重置 isSaving 状态
    };

    return (
        <div className="mb-8 p-6 bg-white rounded-xl shadow-xl border border-indigo-100">
            <h3 className="text-xl font-bold text-indigo-700 mb-4 flex items-center">
                {isEditing ? <Edit className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                {isEditing ? '编辑链接' : '添加新链接'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="名称 *"
                />
                <input
                    type="url"
                    required
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="URL *"
                />
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows="2"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="描述 (可选)"
                />
                <div className="flex justify-end space-x-3 pt-2">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition duration-150"
                        disabled={isSaving}
                    >
                        取消
                    </button>
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="flex items-center px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg shadow-md hover:bg-indigo-700 transition duration-150 disabled:bg-indigo-400"
                    >
                        {isSaving ? <Loader className="w-4 h-4 mr-2 animate-spin" /> : null}
                        {isEditing ? (isSaving ? '更新中...' : '保存更改') : (isSaving ? '添加中...' : '保存链接')}
                    </button>
                </div>
            </form>
        </div>
    );
};

// --- 管理面板组件 ---
const AdminPanel = ({ navData, userId }) => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingLink, setEditingLink] = useState(null); 
    const [confirmingDeleteId, setConfirmingDeleteId] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const linkToDelete = navData.find(l => l.id === confirmingDeleteId);

    const collectionPath = `artifacts/${appId}/public/data/navigation`;

    // 处理添加和编辑的通用逻辑
    const handleSaveLink = async (linkData) => {
        setIsProcessing(true);
        try {
            if (linkData.id) {
                // 编辑现有链接
                const { id, ...data } = linkData;
                await setDoc(doc(db, collectionPath, id), {
                    ...data,
                    updatedAt: new Date(),
                }, { merge: true });
                setEditingLink(null);
            } else {
                // 添加新链接
                await addDoc(collection(db, collectionPath), {
                    ...linkData,
                    createdAt: new Date(),
                    userId: userId,
                });
            }
            setIsFormOpen(false);
        } catch (error) {
            console.error('Error saving document: ', error);
        } finally {
            setIsProcessing(false);
        }
    };

    // 实际删除链接的逻辑
    const executeDeleteLink = async (id) => {
        setIsProcessing(true);
        try {
            await deleteDoc(doc(db, collectionPath, id));
            setConfirmingDeleteId(null);
        } catch (error) {
            console.error('Error deleting document: ', error);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleOpenEditForm = (item) => {
        setEditingLink(item);
        setIsFormOpen(true);
    };

    return (
        <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            
            {linkToDelete && (
                <DeleteConfirmationModal 
                    item={linkToDelete}
                    onConfirm={executeDeleteLink}
                    onCancel={() => setConfirmingDeleteId(null)}
                />
            )}

            <div className="flex justify-between items-center mb-8 border-b border-gray-300 pb-3">
                <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
                    <Settings className="w-6 h-6 mr-2 inline-block align-middle text-indigo-600" />
                    链接管理
                </h2>
                <button
                    onClick={() => { setEditingLink(null); setIsFormOpen(true); }}
                    disabled={isProcessing}
                    className="flex items-center px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition duration-200 disabled:bg-indigo-400 text-sm"
                >
                    <Plus className="w-4 h-4 mr-1" />
                    添加链接
                </button>
            </div>

            {(isFormOpen || editingLink) && (
                <AddEditLinkForm 
                    link={editingLink} 
                    onSubmit={handleSaveLink} 
                    onCancel={() => { setIsFormOpen(false); setEditingLink(null); }} 
                />
            )}

            <div className="space-y-3">
                {navData.length > 0 ? navData.map((item) => (
                    <div
                        key={item.id}
                        className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition duration-200"
                    >
                        <div className="flex-1 min-w-0 pr-4">
                            <p className="text-base font-semibold text-gray-800 truncate">{item.name}</p>
                            <p className="text-xs text-gray-500 truncate mt-0.5">{item.url}</p>
                        </div>
                        <div className="ml-4 flex space-x-1">
                            <button
                                onClick={() => handleOpenEditForm(item)}
                                disabled={isProcessing}
                                className="p-2 text-gray-500 hover:text-indigo-600 transition duration-150 rounded-full hover:bg-indigo-50 disabled:opacity-50"
                                title="编辑"
                            >
                                <Edit className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setConfirmingDeleteId(item.id)}
                                disabled={isProcessing}
                                className="p-2 text-red-500 hover:text-red-700 transition duration-150 rounded-full hover:bg-red-50 disabled:opacity-50"
                                title="删除"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )) : (
                    <div className="text-center p-10 bg-white rounded-xl shadow-lg text-gray-500 border border-dashed">
                        <p className="text-base">列表为空，请添加您的第一个导航链接。</p>
                    </div>
                )}
            </div>
            <p className="mt-8 text-center text-xs text-gray-400">
                当前用户 ID (用于数据安全)：<span className="font-mono text-indigo-600 break-words">{userId || '未登录'}</span>
            </p>
        </div>
    );
};

// --- 主应用组件 ---
const App = () => {
    const [view, setView] = useState('public'); 
    const [navData, setNavData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [userId, setUserId] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isAuthReady, setIsAuthReady] = useState(false);

    // 1. Auth Setup and Listener
    useEffect(() => {
        const signInUser = async () => {
            try {
                if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                    await signInWithCustomToken(auth, __initial_auth_token);
                } else {
                    await signInAnonymously(auth);
                }
            } catch (e) {
                console.error("Firebase Sign-In Failed:", e);
                try {
                    await signInAnonymously(auth);
                } catch (anonError) {
                    console.error("Anonymous Sign-In Failed:", anonError);
                }
            }
        };
        signInUser();

        // Auth state change listener
        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            if (user) {
                setUserId(user.uid);
                // 检查用户是否是管理员（模拟）
                setIsAdmin(user.uid === ADMIN_UID_PLACEHOLDER);
                // 如果用户是管理员且在登录视图，则跳转到管理面板
                if (user.uid === ADMIN_UID_PLACEHOLDER && view === 'login') {
                     setView('admin');
                }
            } else {
                setUserId(null);
                setIsAdmin(false);
                if (view === 'admin') {
                    setView('public'); // 登出后返回公共视图
                }
            }
            setIsAuthReady(true);
        });

        return () => unsubscribeAuth();
    }, [view]); // 添加 view 依赖项以处理登录后的跳转

    // 2. Data Listener and Initial Population
    useEffect(() => {
        if (!isAuthReady) return;

        setIsLoading(true);
        
        const collectionPath = `artifacts/${appId}/public/data/navigation`;
        const navCollection = collection(db, collectionPath);
        
        const q = query(navCollection, orderBy('createdAt', 'desc'));
        
        // Function to seed initial data if the collection is empty
        const seedInitialData = async () => {
            try {
                const snapshot = await getDocs(navCollection);
                if (snapshot.empty) {
                    console.log("Collection is empty. Seeding initial data...");
                    const batch = [];
                    INITIAL_NAV_LINKS.forEach(link => {
                        batch.push(addDoc(navCollection, {
                            ...link,
                            createdAt: new Date(),
                            userId: "system_initial_data",
                        }));
                    });
                    await Promise.all(batch);
                    console.log("Initial data seeding complete.");
                }
            } catch (error) {
                console.error("Error seeding initial data:", error);
            }
        };

        // 1. Check and seed initial data
        seedInitialData();

        // 2. Set up real-time listener
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setNavData(data);
            setIsLoading(false);
        }, (error) => {
            console.error("Firestore Listener failed:", error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [isAuthReady]);


    const handleLogout = useCallback(async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error('Logout error:', error);
        }
    }, []);

    if (isLoading || !isAuthReady) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-white">
                <div className="flex flex-col items-center p-8">
                    <Loader className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
                    <p className="text-lg font-medium text-gray-700">正在加载数据...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            {/* 顶部导航栏 - 极简主义设计 */}
            <header className="py-4 bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                    {/* 网站标题 */}
                    <span 
                        className="text-3xl font-black text-gray-800 tracking-tight cursor-pointer hover:text-indigo-600 transition" 
                        onClick={() => setView('public')}
                        title="返回首页"
                    >
                        {/* 模仿 eooce.com 的极简风格，使用 Logo 文本 */}
                        FastNav
                    </span>

                    {/* 导航和用户操作 */}
                    <div className="flex items-center space-x-3 text-sm">
                        {/* 公共导航按钮 */}
                        <button
                            onClick={() => setView('public')}
                            className={`flex items-center px-3 py-2 rounded-lg font-medium transition duration-200 ${
                                view === 'public'
                                    ? 'bg-indigo-50 text-indigo-700'
                                    : 'text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                            <Home className="w-4 h-4 mr-1" />
                            主页
                        </button>
                        
                        {/* 管理员入口 */}
                        {isAdmin ? (
                            <>
                                <button
                                    onClick={() => setView('admin')}
                                    className={`flex items-center px-3 py-2 rounded-lg font-medium transition duration-200 ${
                                        view === 'admin'
                                            ? 'bg-indigo-500 text-white shadow-md'
                                            : 'text-gray-600 hover:bg-gray-100'
                                    }`}
                                >
                                    <Settings className="w-4 h-4 mr-1" />
                                    管理
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="p-2 rounded-full text-red-500 hover:bg-red-50 transition duration-150"
                                    title="登出"
                                >
                                    <LogOut className="w-5 h-5" />
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={() => setView('login')}
                                className="flex items-center p-2 rounded-full text-gray-600 hover:bg-gray-100 transition duration-150"
                                title="管理员登录"
                            >
                                <LogIn className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {/* 视图内容 */}
            <main>
                {view === 'public' && <PublicNav navData={navData} />}
                {view === 'login' && <AdminLogin onLoginSuccess={() => setView('admin')} />}
                {view === 'admin' && isAdmin && <AdminPanel navData={navData} userId={userId} />}
                {view === 'admin' && !isAdmin && (
                    <div className="max-w-xl mx-auto mt-16 p-10 bg-white rounded-2xl shadow-xl border-l-4 border-red-500">
                        <h3 className="text-2xl font-bold text-red-600 mb-4 flex items-center">
                            <X className="w-6 h-6 mr-3" />
                            权限不足
                        </h3>
                        <p className="text-gray-700">
                            您没有管理员权限，无法访问此面板。请使用正确的管理员账户登录。
                        </p>
                        <button
                             onClick={() => setView('public')}
                            className="mt-6 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg shadow-md hover:bg-indigo-700 transition duration-150"
                        >
                            返回主页
                        </button>
                    </div>
                )}
            </main>

            {/* 极简底部 */}
            <footer className="mt-16 py-8 border-t border-gray-200 text-center text-sm text-gray-500 bg-white">
                <p>
                    &copy; {new Date().getFullYear()} FastNav. 版权所有。
                </p>
            </footer>
        </div>
    );
};

export default App;