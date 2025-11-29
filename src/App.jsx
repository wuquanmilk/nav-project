import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, signInWithCustomToken, signInAnonymously } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, doc, setDoc, deleteDoc, query, orderBy, addDoc, getDoc, getDocs } from 'firebase/firestore';
import { Home, LogIn, Settings, LogOut, Loader, BarChart, X, Plus, Trash2 } from 'lucide-react'; // 确保您已安装 lucide-react

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

// --- Firebase 配置和初始化 (保留用户提供的配置) ---
// IMPORTANT: The firebaseConfig should be dynamic in a real Canvas environment,
// but we are hardcoding the user's provided config here for demonstration.
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

// NOTE: Canvas environment provides __app_id and __initial_auth_token.

const rawAppId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
// 修复 1: 清理 appId，确保它不包含路径分隔符，导致 Firestore 路径分段错误。
// 替换所有 '/' 为 '_'，使 appId 成为一个有效的 Firestore 段名。
const appId = rawAppId.replace(/\//g, '_'); 

const ADMIN_UID_PLACEHOLDER = 'ADMIN_UID_PLACEHOLDER'; // 请替换为您的管理员 UID

// --- 占位组件 (用于构建可视化框架，请替换为您的真实组件) ---

const PublicNav = ({ navData }) => (
    <div className="max-w-7xl mx-auto py-10">
        <h2 className="text-4xl font-extrabold text-gray-900 mb-8 tracking-tight border-b-2 border-indigo-200 pb-2">精选导航</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {navData.length > 0 ? navData.map((item, index) => (
                <a
                    key={index}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition duration-300 transform hover:-translate-y-1 border border-gray-100 flex flex-col justify-between group"
                >
                    <div>
                        <h3 className="text-xl font-semibold text-indigo-700 mb-2 group-hover:text-indigo-900 transition-colors">{item.name}</h3>
                        <p className="text-gray-500 text-sm truncate">{item.description || '暂无描述'}</p>
                    </div>
                    <div className="mt-4 flex items-center text-sm text-gray-400">
                        <Home className="w-4 h-4 mr-2" />
                        <span className="truncate">{item.url}</span>
                    </div>
                </a>
            )) : (
                <div className="col-span-full text-center p-12 bg-white rounded-xl shadow-lg text-gray-500">
                    <BarChart className="w-10 h-10 mx-auto mb-4 text-indigo-400" />
                    <p className="text-lg">目前还没有导航数据。</p>
                </div>
            )}
        </div>
    </div>
);

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
        <div className="max-w-md mx-auto py-16">
            <div className="bg-white p-8 rounded-xl shadow-2xl border border-indigo-100">
                <h2 className="text-3xl font-bold text-center text-indigo-700 mb-8">管理员登录</h2>
                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">邮箱</label>
                        <input
                            id="email"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition"
                            placeholder="输入管理员邮箱"
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">密码</label>
                        <input
                            id="password"
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition"
                            placeholder="输入密码"
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
                        className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-md text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 disabled:bg-indigo-400"
                    >
                        {isLoggingIn ? <Loader className="w-5 h-5 animate-spin mr-2" /> : <LogIn className="w-5 h-5 mr-2" />}
                        {isLoggingIn ? '正在登录...' : '立即登录'}
                    </button>
                </form>
            </div>
        </div>
    );
};

const AdminPanel = ({ navData, userId }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [links, setLinks] = useState(navData);
    // 修复 3: 新增状态用于替代 window.confirm
    const [confirmingDeleteId, setConfirmingDeleteId] = useState(null);

    useEffect(() => {
        setLinks(navData);
    }, [navData]);

    // 添加链接
    const handleAddLink = async (newLink) => {
        const collectionRef = collection(db, `artifacts/${appId}/public/data/navigation`);
        try {
            await addDoc(collectionRef, {
                ...newLink,
                createdAt: new Date(),
                userId: userId,
            });
            setIsAdding(false);
        } catch (error) {
            console.error('Error adding document: ', error);
            // 使用 console.error 替代 alert
            console.error('添加链接失败，请查看控制台。'); 
        }
    };

    // 实际删除链接的逻辑
    const executeDeleteLink = async (id) => {
        try {
            await deleteDoc(doc(db, `artifacts/${appId}/public/data/navigation`, id));
            setConfirmingDeleteId(null); // 删除成功或失败都清除确认状态
        } catch (error) {
            console.error('Error deleting document: ', error);
            console.error('删除链接失败，请查看控制台。');
            setConfirmingDeleteId(null);
        }
    };

    // 触发删除确认
    const requestDeleteLink = (id) => {
        setConfirmingDeleteId(id);
    };

    const linkToDelete = links.find(l => l.id === confirmingDeleteId);

    return (
        <div className="max-w-7xl mx-auto py-10">
            {/* 删除确认区域 */}
            {linkToDelete && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-sm">
                        <h3 className="text-xl font-bold text-red-600 mb-4 flex items-center">
                            <Trash2 className="w-5 h-5 mr-2" />
                            确认删除
                        </h3>
                        <p className="text-gray-700 mb-6">
                            您确定要永久删除导航链接 **{linkToDelete.name}** 吗？此操作不可撤销。
                        </p>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setConfirmingDeleteId(null)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition duration-150"
                            >
                                取消
                            </button>
                            <button
                                onClick={() => executeDeleteLink(confirmingDeleteId)}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg shadow-md hover:bg-red-700 transition duration-150"
                            >
                                确认删除
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex justify-between items-center mb-8 border-b-2 border-indigo-200 pb-4">
                <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight">管理面板</h2>
                <button
                    onClick={() => setIsAdding(true)}
                    className="flex items-center px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg shadow-md hover:bg-indigo-700 transition duration-150"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    添加新链接
                </button>
            </div>

            {isAdding && <AddLinkForm onSubmit={handleAddLink} onCancel={() => setIsAdding(false)} />}

            <div className="space-y-4">
                {links.length > 0 ? links.map((item) => (
                    <div
                        key={item.id}
                        className="flex items-center justify-between bg-white p-4 rounded-xl shadow-lg border border-gray-100 transition duration-200 hover:shadow-xl"
                    >
                        <div className="flex-1 min-w-0">
                            <a
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-lg font-semibold text-indigo-600 truncate hover:underline"
                            >
                                {item.name}
                            </a>
                            <p className="text-sm text-gray-500 truncate">{item.description || '无描述'}</p>
                            <p className="text-xs text-gray-400 mt-1">创建时间: {formatTimestamp(item.createdAt)}</p>
                        </div>
                        <div className="ml-4 flex space-x-2">
                            {/* 占位：编辑按钮 */}
                            <button
                                // onClick={() => handleEdit(item)}
                                className="p-2 text-sm text-gray-500 hover:text-indigo-600 transition duration-150 rounded-full hover:bg-indigo-50"
                                title="编辑"
                            >
                                <Settings className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => requestDeleteLink(item.id)} // 调用确认函数
                                className="p-2 text-sm text-red-500 hover:text-red-700 transition duration-150 rounded-full hover:bg-red-50"
                                title="删除"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )) : (
                    <div className="text-center p-20 bg-white rounded-xl shadow-lg text-gray-500">
                        <p>没有找到任何链接。请点击 "添加新链接"。</p>
                    </div>
                )}
            </div>
            <p className="mt-10 text-center text-sm text-gray-500 p-4 border-t border-gray-200">
                当前管理员 UID: <span className="font-mono text-indigo-600 break-words">{userId || '未登录'}</span>
            </p>
        </div>
    );
};

const AddLinkForm = ({ onSubmit, onCancel }) => {
    const [name, setName] = useState('');
    const [url, setUrl] = useState('');
    const [description, setDescription] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsSaving(true);
        // onSubmit will handle the async operation, but we reset loading state here
        // or let the parent component handle it based on real completion.
        onSubmit({ name, url, description }); 
        setTimeout(() => setIsSaving(false), 500);
    };

    return (
        <div className="mb-8 p-6 bg-white rounded-xl shadow-2xl border border-indigo-200">
            <h3 className="text-2xl font-semibold text-indigo-700 mb-4">添加新导航链接</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">名称</label>
                    <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="例如：Google"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">URL</label>
                    <input
                        type="url"
                        required
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="例如：https://www.google.com"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">描述 (可选)</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows="2"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="对链接的简短描述"
                    />
                </div>
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
                        className="flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg shadow-md hover:bg-indigo-700 transition duration-150 disabled:bg-indigo-400"
                    >
                        {isSaving ? <Loader className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                        {isSaving ? '正在保存...' : '保存链接'}
                    </button>
                </div>
            </form>
        </div>
    );
};


// --- 主应用组件 ---

const App = () => {
    const [view, setView] = useState('public'); // 'public', 'login', 'admin'
    const [navData, setNavData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [userId, setUserId] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isAuthReady, setIsAuthReady] = useState(false);

    // 1. Auth Setup and Listener
    useEffect(() => {
        // Initial sign-in with custom token or anonymously
        const signInUser = async () => {
            try {
                if (typeof __initial_auth_token !== 'undefined') {
                    await signInWithCustomToken(auth, __initial_auth_token);
                } else {
                    await signInAnonymously(auth);
                }
            } catch (e) {
                console.error("Firebase Sign-In Failed:", e);
                // Fallback to anonymous sign-in if custom token fails
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
                // Check if user is the hardcoded administrator
                setIsAdmin(user.uid === ADMIN_UID_PLACEHOLDER);
            } else {
                setUserId(null);
                setIsAdmin(false);
            }
            setIsAuthReady(true);
        });

        return () => unsubscribeAuth();
    }, []);

    // 2. Data Listener (Only runs after auth is ready)
    useEffect(() => {
        if (!isAuthReady) return;

        setIsLoading(true);
        
        // Collection path for public navigation data
        const collectionPath = `artifacts/${appId}/public/data/navigation`;
        const q = query(collection(db, collectionPath), orderBy('createdAt', 'desc'));

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
            setView('public'); // 返回公共视图
            // 由于 onAuthStateChanged 会处理 setUserId(null)，这里不需要额外操作
        } catch (error) {
            console.error('Logout error:', error);
            // In a real app, use a custom modal for error messages
        }
    }, []);

    const navItems = useMemo(() => [
        { key: 'public', label: '全部导航', icon: Home },
        { key: 'admin', label: '管理面板', icon: Settings, authRequired: true, adminRequired: true },
    ], []);

    if (isLoading || !isAuthReady) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <div className="flex flex-col items-center p-8 bg-white rounded-xl shadow-lg">
                    <Loader className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
                    <p className="text-lg text-gray-700">正在加载数据...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* 顶部导航栏 - 优化后的样式 */}
            <nav className="sticky top-0 z-50 bg-white shadow-xl/20 border-b border-gray-100/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* 网站标题/Logo */}
                        <div className="flex-shrink-0">
                            <span className="text-3xl font-extrabold text-indigo-600 tracking-tight cursor-pointer" onClick={() => setView('public')}>
                                网站导航
                            </span>
                        </div>

                        {/* 导航和用户操作 */}
                        <div className="flex items-center space-x-4">
                            {/* 主要导航链接 */}
                            <div className="hidden md:flex items-center space-x-2">
                                {navItems.map(item => {
                                    if (item.adminRequired && !isAdmin) return null;
                                    
                                    // 修复 2: 必须将组件变量赋给一个大写开头的变量才能在 JSX 中使用
                                    const Icon = item.icon; 

                                    return (
                                        <button
                                            key={item.key}
                                            onClick={() => setView(item.key)}
                                            className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition duration-200 ${
                                                view === item.key
                                                    ? 'bg-indigo-100 text-indigo-800'
                                                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                            }`}
                                        >
                                            <Icon className="w-5 h-5 mr-1" /> {/* 修正后的渲染 */}
                                            {item.label}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* 登录/登出按钮 */}
                            {isAdmin ? (
                                <>
                                    <span className="hidden sm:inline text-sm text-gray-500">
                                        管理员：<span className="font-medium text-indigo-600">{userId ? userId.substring(0, 8) + '...' : 'N/A'}</span>
                                    </span>
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-500 border border-transparent hover:bg-red-600 transition duration-150 shadow-md"
                                    >
                                        <LogOut className="w-5 h-5 mr-1" />
                                        登出
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => setView('login')}
                                    className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition duration-150 ${view === 'login' ? 'bg-gray-200 text-gray-800' : 'text-indigo-600 border border-indigo-200 hover:bg-indigo-50'}`}
                                >
                                    <LogIn className="w-5 h-5 mr-1" />
                                    管理员登录
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* 视图内容 - 增加了内边距和响应式居中 */}
            <main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
                {view === 'public' && <PublicNav navData={navData} />}
                {view === 'login' && <AdminLogin onLoginSuccess={() => setView('admin')} />}
                {view === 'admin' && isAdmin && <AdminPanel navData={navData} userId={userId} />}
                {view === 'admin' && !isAdmin && (
                    <div className="max-w-xl mx-auto mt-16 p-10 bg-white rounded-xl shadow-2xl border-l-4 border-red-500">
                        <h3 className="text-2xl font-bold text-red-600 mb-4">权限不足</h3>
                        <p className="text-gray-700">
                            您没有管理员权限。请先通过正确的账号和密码登录。
                        </p>
                        <p className="mt-2 text-sm text-gray-500">
                            当前用户 ID: <span className="font-mono text-gray-600 break-words">{userId || '未登录'}</span>
                        </p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default App;