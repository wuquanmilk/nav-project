import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, signInWithCustomToken, signInAnonymously } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, doc, setDoc, deleteDoc, query, orderBy, addDoc } from 'firebase/firestore';
import { Home, LogIn, Settings, LogOut, Loader, BarChart, X, Plus, Trash2, Link, Edit, Users } from 'lucide-react'; // 导入更多图标

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
// 注意：在实际的 Canvas 环境中，我们使用全局变量来初始化 Firebase
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

// 确保 appId 是一个有效的 Firestore 路径段名，解决 Firebase 路径错误。
const rawAppId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
// 修复 1: 清理 appId，将所有路径分隔符 '/' 替换为 '_'
const appId = rawAppId.replace(/\//g, '_'); 

// 占位管理员 UID，请根据需要替换
const ADMIN_UID_PLACEHOLDER = 'ADMIN_UID_PLACEHOLDER'; 

// --- 确认删除模态框组件 ---
const DeleteConfirmationModal = ({ item, onConfirm, onCancel }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
            <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100">
                <h3 className="text-2xl font-bold text-red-600 mb-4 flex items-center">
                    <Trash2 className="w-6 h-6 mr-3" />
                    确认删除导航链接
                </h3>
                <p className="text-gray-700 mb-6">
                    您确定要永久删除 **{item.name}** 吗？此操作不可撤销。
                </p>
                <div className="flex justify-end space-x-4 pt-3 border-t">
                    <button
                        onClick={onCancel}
                        className="px-6 py-2 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition duration-150 shadow-md"
                    >
                        取消
                    </button>
                    <button
                        onClick={() => onConfirm(item.id)}
                        className="px-6 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg shadow-lg hover:bg-red-700 transition duration-150"
                    >
                        确认删除
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- 公共导航视图组件 ---
const PublicNav = ({ navData }) => (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <h2 className="text-4xl font-extrabold text-gray-900 mb-10 tracking-tight border-b-4 border-indigo-300 pb-3">
            <Link className="w-8 h-8 mr-3 inline-block align-middle text-indigo-500" />
            精选网站导航
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {navData.length > 0 ? navData.map((item) => (
                <a
                    key={item.id}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white p-6 rounded-2xl shadow-xl hover:shadow-2xl transition duration-300 transform hover:-translate-y-1 border border-gray-100 flex flex-col justify-between group h-full"
                >
                    <div>
                        <h3 className="text-xl font-bold text-indigo-700 mb-2 group-hover:text-indigo-900 transition-colors">{item.name}</h3>
                        <p className="text-gray-500 text-sm line-clamp-2">{item.description || '暂无描述'}</p>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center text-sm text-gray-400">
                        <Home className="w-4 h-4 mr-2 text-gray-400" />
                        <span className="truncate">{item.url}</span>
                    </div>
                </a>
            )) : (
                <div className="col-span-full text-center p-16 bg-white rounded-2xl shadow-xl text-gray-500">
                    <BarChart className="w-12 h-12 mx-auto mb-4 text-indigo-400 opacity-70" />
                    <p className="text-lg font-medium">目前还没有导航数据。管理员请登录并添加。</p>
                </div>
            )}
        </div>
    </div>
);

// --- 登录组件 ---
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
            // 请注意：此登录功能仅用于演示。在生产环境中，您应使用更安全的认证机制。
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
        <div className="max-w-md mx-auto py-20 px-4 sm:px-6 lg:px-8">
            <div className="bg-white p-10 rounded-2xl shadow-2xl border-t-4 border-indigo-500">
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
                            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-inner focus:ring-indigo-500 focus:border-indigo-500 transition"
                            placeholder="请输入管理员邮箱"
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
                            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-inner focus:ring-indigo-500 focus:border-indigo-500 transition"
                            placeholder="请输入密码"
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
                        className="w-full flex justify-center items-center py-3 px-4 rounded-lg shadow-xl text-base font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-indigo-500 transition duration-200 disabled:bg-indigo-400"
                    >
                        {isLoggingIn ? <Loader className="w-5 h-5 animate-spin mr-2" /> : <LogIn className="w-5 h-5 mr-2" />}
                        {isLoggingIn ? '正在验证...' : '立即登录'}
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
        // 父组件负责重置 isSaving 状态
    };

    return (
        <div className="mb-10 p-8 bg-white rounded-2xl shadow-2xl border border-indigo-100">
            <h3 className="text-2xl font-bold text-indigo-700 mb-5 flex items-center">
                {isEditing ? <Edit className="w-5 h-5 mr-2" /> : <Plus className="w-5 h-5 mr-2" />}
                {isEditing ? '编辑导航链接' : '添加新导航链接'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label className="block text-sm font-medium text-gray-700">名称 *</label>
                    <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-inner focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="例如：Google 搜索引擎"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">URL *</label>
                    <input
                        type="url"
                        required
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-inner focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="例如：https://www.google.com"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">描述 (可选)</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows="2"
                        className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-inner focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="对链接的简短描述"
                    />
                </div>
                <div className="flex justify-end space-x-3 pt-3">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-5 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition duration-150 shadow-sm"
                        disabled={isSaving}
                    >
                        取消
                    </button>
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="flex items-center px-5 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg shadow-md hover:bg-indigo-700 transition duration-150 disabled:bg-indigo-400"
                    >
                        {isSaving ? <Loader className="w-4 h-4 mr-2 animate-spin" /> : null}
                        {isEditing ? (isSaving ? '正在更新...' : '保存更改') : (isSaving ? '正在添加...' : '保存链接')}
                    </button>
                </div>
            </form>
        </div>
    );
};

// --- 管理面板组件 ---
const AdminPanel = ({ navData, userId }) => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingLink, setEditingLink] = useState(null); // 用于编辑的链接
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
                console.log('Document successfully updated!');
            } else {
                // 添加新链接
                await addDoc(collection(db, collectionPath), {
                    ...linkData,
                    createdAt: new Date(),
                    userId: userId,
                });
                console.log('Document successfully added!');
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
            console.log('Document successfully deleted!');
            setConfirmingDeleteId(null);
        } catch (error) {
            console.error('Error deleting document: ', error);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleOpenAddForm = () => {
        setEditingLink(null);
        setIsFormOpen(true);
    };

    const handleOpenEditForm = (item) => {
        setEditingLink(item);
        setIsFormOpen(true);
    };

    return (
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            {/* 确认删除模态框 */}
            {linkToDelete && (
                <DeleteConfirmationModal 
                    item={linkToDelete}
                    onConfirm={executeDeleteLink}
                    onCancel={() => setConfirmingDeleteId(null)}
                />
            )}

            <div className="flex justify-between items-center mb-10 border-b-4 border-indigo-300 pb-4">
                <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight">
                    <Settings className="w-8 h-8 mr-3 inline-block align-middle text-indigo-600" />
                    管理员面板
                </h2>
                <button
                    onClick={handleOpenAddForm}
                    disabled={isProcessing}
                    className="flex items-center px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:bg-indigo-700 transition duration-200 disabled:bg-indigo-400"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    添加新链接
                </button>
            </div>

            {(isFormOpen || editingLink) && (
                <AddEditLinkForm 
                    link={editingLink} 
                    onSubmit={handleSaveLink} 
                    onCancel={() => { setIsFormOpen(false); setEditingLink(null); }} 
                />
            )}

            <div className="space-y-4">
                {navData.length > 0 ? navData.map((item) => (
                    <div
                        key={item.id}
                        className="flex items-center justify-between bg-white p-5 rounded-xl shadow-lg border border-gray-100 transition duration-200 hover:shadow-xl hover:ring-2 hover:ring-indigo-100"
                    >
                        <div className="flex-1 min-w-0 pr-4">
                            <a
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xl font-bold text-indigo-600 truncate hover:underline"
                            >
                                {item.name}
                            </a>
                            <p className="text-sm text-gray-500 truncate mt-1">{item.description || '无描述'}</p>
                            <p className="text-xs text-gray-400 mt-2 flex items-center">
                                <Users className="w-3 h-3 mr-1" />
                                管理员: <span className="font-mono ml-1">{item.userId.substring(0, 8) + '...'}</span>
                                <span className="ml-4">创建时间: {formatTimestamp(item.createdAt)}</span>
                            </p>
                        </div>
                        <div className="ml-4 flex space-x-2">
                            <button
                                onClick={() => handleOpenEditForm(item)}
                                disabled={isProcessing}
                                className="p-3 text-lg text-gray-500 hover:text-indigo-600 transition duration-150 rounded-full hover:bg-indigo-50 disabled:opacity-50"
                                title="编辑链接"
                            >
                                <Edit className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setConfirmingDeleteId(item.id)}
                                disabled={isProcessing}
                                className="p-3 text-lg text-red-500 hover:text-red-700 transition duration-150 rounded-full hover:bg-red-50 disabled:opacity-50"
                                title="删除链接"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )) : (
                    <div className="text-center p-20 bg-white rounded-xl shadow-lg text-gray-500">
                        <p className="text-lg">没有找到任何链接。请点击 "添加新链接" 开始管理您的导航。</p>
                    </div>
                )}
            </div>
            <p className="mt-12 text-center text-sm text-gray-500 p-4 border-t border-gray-200">
                当前用户 ID (用于数据安全)：<span className="font-mono text-indigo-600 break-words">{userId || '未登录'}</span>
            </p>
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
        const signInUser = async () => {
            try {
                if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                    await signInWithCustomToken(auth, __initial_auth_token);
                } else {
                    await signInAnonymously(auth);
                }
            } catch (e) {
                console.error("Firebase Sign-In Failed (Falling back to Anonymous):", e);
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
                // 假设 ADMIN_UID_PLACEHOLDER 仅用于测试，实际应用中应使用更安全的角色管理
                setIsAdmin(user.uid === ADMIN_UID_PLACEHOLDER);
                // 登录后如果用户是管理员，则默认跳转到管理面板
                if (user.uid === ADMIN_UID_PLACEHOLDER) {
                    setView('admin');
                }
            } else {
                setUserId(null);
                setIsAdmin(false);
                setView('public'); // 登出后返回公共视图
            }
            setIsAuthReady(true);
        });

        return () => unsubscribeAuth();
    }, []);

    // 2. Data Listener (Only runs after auth is ready)
    useEffect(() => {
        // 只有当认证准备就绪时才开始监听 Firestore
        if (!isAuthReady) return;

        setIsLoading(true);
        
        // 使用清理后的 appId 构建路径
        const collectionPath = `artifacts/${appId}/public/data/navigation`;
        // 根据创建时间降序排列
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
            // setView('public') is handled by the onAuthStateChanged listener
        } catch (error) {
            console.error('Logout error:', error);
        }
    }, []);

    // 导航项定义
    const navItems = useMemo(() => [
        { key: 'public', label: '全部导航', icon: Home },
        { key: 'admin', label: '管理面板', icon: Settings, adminRequired: true },
    ], []);

    if (isLoading || !isAuthReady) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <div className="flex flex-col items-center p-8 bg-white rounded-xl shadow-lg">
                    <Loader className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
                    <p className="text-lg font-medium text-gray-700">正在初始化应用...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            {/* 顶部导航栏 - 增强样式和响应式设计 */}
            <nav className="sticky top-0 z-50 bg-white shadow-lg border-b border-indigo-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        {/* 网站标题/Logo */}
                        <div className="flex-shrink-0">
                            <span className="text-4xl font-black text-indigo-600 tracking-tight cursor-pointer" onClick={() => setView('public')}>
                                NAV.SITE
                            </span>
                        </div>

                        {/* 导航和用户操作 */}
                        <div className="flex items-center space-x-4">
                            {/* 主要导航链接 */}
                            <div className="flex items-center space-x-2">
                                {navItems.map(item => {
                                    if (item.adminRequired && !isAdmin) return null;
                                    
                                    // 修复 2: 必须将组件变量赋给一个大写开头的变量才能在 JSX 中使用
                                    const Icon = item.icon; 

                                    return (
                                        <button
                                            key={item.key}
                                            onClick={() => setView(item.key)}
                                            className={`flex items-center px-4 py-2 rounded-xl text-base font-semibold transition duration-200 shadow-sm ${
                                                view === item.key
                                                    ? 'bg-indigo-600 text-white shadow-indigo-300'
                                                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 bg-white'
                                            }`}
                                        >
                                            <Icon className="w-5 h-5 mr-1" />
                                            {item.label}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* 登录/登出按钮 */}
                            {isAdmin ? (
                                <>
                                    <span className="hidden lg:inline text-sm text-gray-500">
                                        管理员 UID：<span className="font-mono text-indigo-600">{userId ? userId.substring(0, 8) + '...' : 'N/A'}</span>
                                    </span>
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center px-4 py-2 rounded-xl text-base font-semibold text-white bg-red-500 border border-transparent hover:bg-red-600 transition duration-200 shadow-md"
                                        title="管理员登出"
                                    >
                                        <LogOut className="w-5 h-5 mr-1" />
                                        登出
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => setView('login')}
                                    className={`flex items-center px-4 py-2 rounded-xl text-base font-semibold text-indigo-600 border-2 border-indigo-200 hover:bg-indigo-50 transition duration-200 shadow-md`}
                                    title="管理员登录"
                                >
                                    <LogIn className="w-5 h-5 mr-1" />
                                    登录
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* 视图内容 */}
            <main>
                {view === 'public' && <PublicNav navData={navData} />}
                {view === 'login' && <AdminLogin onLoginSuccess={() => setView('admin')} />}
                {view === 'admin' && isAdmin && <AdminPanel navData={navData} userId={userId} />}
                {view === 'admin' && !isAdmin && (
                    <div className="max-w-xl mx-auto mt-16 p-10 bg-white rounded-2xl shadow-2xl border-l-8 border-red-500 transform transition-all duration-300">
                        <h3 className="text-3xl font-bold text-red-600 mb-4 flex items-center">
                            <X className="w-6 h-6 mr-3" />
                            访问被拒绝
                        </h3>
                        <p className="text-lg text-gray-700">
                            您没有管理员权限，无法访问此面板。请使用正确的管理员账户登录。
                        </p>
                        <p className="mt-4 text-sm text-gray-500">
                            当前用户 ID: <span className="font-mono text-gray-600 break-words">{userId || '未登录'}</span>
                        </p>
                        <button
                             onClick={() => setView('public')}
                            className="mt-6 px-6 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg shadow-md hover:bg-indigo-700 transition duration-150"
                        >
                            返回主页
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
};

export default App;