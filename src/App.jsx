import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, signInWithCustomToken, signInAnonymously } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, doc, setDoc, deleteDoc, query, orderBy, addDoc, getDoc, getDocs } from 'firebase/firestore';

// --- 全局变量和配置 (Canvas Environment) ---
// MUST use these global variables provided by the Canvas environment
const firebaseConfig = {
  apiKey: "AIzaSyAlkYbLP4jW1P-XRJtCvC6id8GlIxxY8m4",
  authDomain: "wangzhandaohang.firebaseapp.com",
  projectId: "wangzhandaohang",
  storageBucket: "wangzhandaohang.firebasestorage.app",
  messagingSenderId: "169263636408",
  appId: "1:169263636408:web:ee3608652b2872a539b94d",
  measurementId: "G-6JGHTS41NH"
};
// Replace this placeholder with your actual Firebase User ID (UID) after registering.
// Only this UID will have permission to edit the navigation data.
const ADMIN_UID_PLACEHOLDER = "6UiUdmPna4RJb2hNBoXhx3XCTFN2"; 

// --- Firebase 初始化和认证 (Must be outside the component) ---
let app;
let db;
let auth;

if (firebaseConfig) {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
}

// --- Helper Functions ---

/**
 * 格式化链接，确保有 http(s):// 前缀
 */
const formatUrl = (url) => {
    if (!url.match(/^(http(s)?:\/\/)/)) {
        return 'https://' + url;
    }
    return url;
};

/**
 * 获取网站的简易图标（使用首字母作为占位符）
 */
const getFaviconPlaceholder = (name) => {
    return name.charAt(0).toUpperCase();
};

// --- Component: Public Navigation View ---

const PublicNav = ({ navData, handleSearch }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchEngine, setSearchEngine] = useState('google');

    // 过滤链接数据 (根据搜索词过滤名称和URL)
    const filteredData = useMemo(() => {
        if (!searchTerm) return navData;
        const lowerCaseSearchTerm = searchTerm.toLowerCase();

        return navData.map(category => ({
            ...category,
            links: category.links.filter(link => 
                link.name.toLowerCase().includes(lowerCaseSearchTerm) || 
                link.url.toLowerCase().includes(lowerCaseSearchTerm)
            )
        })).filter(category => category.links.length > 0);
    }, [navData, searchTerm]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (!searchTerm.trim()) return;

        let searchUrl = '';
        const encodedQuery = encodeURIComponent(searchTerm.trim());

        switch (searchEngine) {
            case 'google':
                searchUrl = `https://www.google.com/search?q=${encodedQuery}`;
                break;
            case 'baidu':
                searchUrl = `https://www.baidu.com/s?wd=${encodedQuery}`;
                break;
            case 'bing':
                searchUrl = `https://www.bing.com/search?q=${encodedQuery}`;
                break;
            default:
                searchUrl = `https://www.google.com/search?q=${encodedQuery}`;
        }

        window.open(searchUrl, '_blank');
    };


    return (
        <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
            {/* 头部标题和搜索 */}
            <header className="text-center mb-10 md:mb-16">
                <h1 className="text-4xl md:text-5xl font-extrabold text-indigo-700 mb-2">
                    精选导航
                </h1>
                <p className="text-lg text-gray-500">
                    实时更新，您的专属网络资源入口。
                </p>
            </header>

            {/* 快速搜索栏 */}
            <div className="mb-10 max-w-2xl mx-auto">
                <div className="bg-white p-5 rounded-xl shadow-lg border border-gray-100">
                    <h2 className="text-xl font-semibold mb-3 text-gray-700 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-indigo-500 mr-2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                        </svg>
                        快速搜索
                    </h2>
                    <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                        <input
                            type="text"
                            placeholder="输入关键词，按回车搜索或筛选下方链接..."
                            className="flex-grow p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base shadow-inner"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <select
                            className="p-3 border border-gray-300 rounded-lg bg-gray-50 text-base shadow-inner w-full sm:w-auto"
                            value={searchEngine}
                            onChange={(e) => setSearchEngine(e.target.value)}
                        >
                            <option value="google">Google</option>
                            <option value="baidu">百度 Baidu</option>
                            <option value="bing">Bing</option>
                        </select>
                        <button type="submit"
                                className="p-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition duration-150 shadow-md">
                            搜索
                        </button>
                    </form>
                </div>
            </div>

            {/* 导航链接区域 */}
            <div className="space-y-12">
                {navData.length === 0 && !searchTerm ? (
                     <div className="text-center p-10 text-gray-500">
                        <p className="text-xl">目前还没有导航链接。请切换到 '管理面板' 添加第一个链接。</p>
                        <p className="text-sm mt-2">（如果您是管理员，请检查您的 ADMIN_UID 配置是否正确）</p>
                    </div>
                ) : filteredData.length === 0 ? (
                     <div className="text-center p-10 text-gray-500 text-xl">
                        没有找到匹配 "{searchTerm}" 的结果。
                    </div>
                ) : (
                    filteredData.map(section => (
                        <section key={section.id} className="bg-white p-6 rounded-2xl shadow-xl border border-indigo-100">
                            <h2 className="text-2xl font-bold text-indigo-600 mb-2 border-b pb-2 border-indigo-100 flex items-center">
                                {section.categoryName}
                            </h2>
                            {section.description && <p className="text-gray-500 mb-6">{section.description}</p>}
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                {section.links.map(link => (
                                    <a 
                                        key={link.id} 
                                        href={formatUrl(link.url)} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="link-card block p-4 bg-gray-50 rounded-xl shadow-md hover:shadow-xl border border-gray-100 transform hover:scale-[1.01] transition-all duration-300 ease-in-out"
                                    >
                                        <div className="flex items-center space-x-3">
                                            {/* 简易 Favicon (使用首字母) */}
                                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-200 text-indigo-700 flex items-center justify-center font-bold text-sm">
                                                {getFaviconPlaceholder(link.name)}
                                            </div>
                                            <span className="text-base font-medium text-gray-700 truncate">{link.name}</span>
                                        </div>
                                    </a>
                                ))}
                            </div>
                        </section>
                    ))
                )}
            </div>

            {/* 底部信息 */}
            <footer className="mt-16 text-center text-sm text-gray-400 border-t pt-6">
                <p>© 2024 精选导航. 所有链接均来自 Firestore 实时数据。</p>
            </footer>
        </div>
    );
};

// --- Component: Admin Login ---

const AdminLogin = ({ onLoginSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        // Simple input validation
        if (!email || !password) {
            setError('请输入邮箱和密码。');
            setIsLoading(false);
            return;
        }

        try {
            await signInWithEmailAndPassword(auth, email, password);
            onLoginSuccess(); // Trigger successful login
        } catch (err) {
            console.error("Login Error:", err);
            setError('登录失败：错误的邮箱或密码。');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-2xl border border-gray-200">
                <h2 className="text-2xl font-bold text-center text-indigo-600 mb-6">管理员登录</h2>
                <div className="p-4 mb-4 text-sm text-yellow-800 bg-yellow-100 rounded-lg">
                    请在部署前，使用您的 Firebase Admin UID 替换代码中的 `ADMIN_UID_PLACEHOLDER`。
                </div>
                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">邮箱</label>
                        <input
                            id="email"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="mt-1 w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="admin@example.com"
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
                            className="mt-1 w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="••••••••"
                        />
                    </div>
                    {error && (
                        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">{error}</div>
                    )}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 disabled:opacity-50"
                    >
                        {isLoading ? '登录中...' : '登录'}
                    </button>
                </form>
            </div>
        </div>
    );
};

// --- Component: Admin Panel (CRUD Operations) ---

const AdminPanel = ({ navData, userId }) => {
    const [currentCategory, setCurrentCategory] = useState({ id: null, categoryName: '', description: '', links: [] });
    const [linkForm, setLinkForm] = useState({ id: null, name: '', url: '' });
    const [categoryName, setCategoryName] = useState('');
    const [categoryDescription, setCategoryDescription] = useState('');
    const [categoryList, setCategoryList] = useState(navData.map(c => ({ id: c.id, name: c.categoryName })));
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    
    // Reset form when the selected category changes
    useEffect(() => {
        const category = navData.find(c => c.id === currentCategory.id);
        if (category) {
            setCurrentCategory(category);
            setCategoryName(category.categoryName);
            setCategoryDescription(category.description || '');
        } else if (navData.length > 0) {
            // Auto-select the first category if none is selected
            setCurrentCategory(navData[0]);
            setCategoryName(navData[0].categoryName);
            setCategoryDescription(navData[0].description || '');
        }
    }, [navData, currentCategory.id]);

    useEffect(() => {
        setCategoryList(navData.map(c => ({ id: c.id, name: c.categoryName })));
    }, [navData]);

    const showMessage = (msg) => {
        setMessage(msg);
        setTimeout(() => setMessage(''), 3000);
    }

    const categoryRef = collection(db, `artifacts/${appId}/public/data/navLinks`);

    // --- Category Management ---
    
    const handleAddCategory = async () => {
        if (!categoryName.trim()) {
            setError('分类名称不能为空。');
            return;
        }
        try {
            const newCategory = {
                categoryName: categoryName.trim(),
                description: categoryDescription.trim(),
                links: []
            };
            await addDoc(categoryRef, newCategory);
            showMessage(`分类 "${categoryName}" 创建成功！`);
            setCategoryName('');
            setCategoryDescription('');
            setError('');
        } catch (e) {
            console.error("Error adding document: ", e);
            setError('创建分类失败。');
        }
    };

    const handleDeleteCategory = async (categoryId) => {
        if (window.confirm(`确定要删除分类 "${currentCategory.categoryName}" 吗？该分类下的所有链接也会被删除。`)) {
            try {
                await deleteDoc(doc(db, categoryRef.path, categoryId));
                showMessage(`分类 "${currentCategory.categoryName}" 已删除。`);
                setCurrentCategory({ id: null, categoryName: '', description: '', links: [] });
                setError('');
            } catch (e) {
                console.error("Error deleting document: ", e);
                setError('删除分类失败。');
            }
        }
    };

    // --- Link Management ---

    const handleLinkChange = (e) => {
        setLinkForm({ ...linkForm, [e.target.name]: e.target.value });
    };

    const handleAddLink = async (e) => {
        e.preventDefault();
        if (!linkForm.name || !linkForm.url || !currentCategory.id) {
            setError('链接名称和 URL 不能为空，且必须选择一个分类。');
            return;
        }

        try {
            // Deep copy and add new link
            const newLinks = [...currentCategory.links];
            const newLink = {
                id: crypto.randomUUID(), // Use UUID for unique link ID
                name: linkForm.name,
                url: formatUrl(linkForm.url)
            };
            newLinks.push(newLink);

            await setDoc(doc(db, categoryRef.path, currentCategory.id), {
                ...currentCategory,
                links: newLinks
            });

            showMessage(`链接 "${linkForm.name}" 添加成功！`);
            setLinkForm({ id: null, name: '', url: '' });
            setError('');

        } catch (e) {
            console.error("Error adding link: ", e);
            setError('添加链接失败。');
        }
    };

    const handleDeleteLink = async (linkId) => {
        if (window.confirm('确定要删除这个链接吗？')) {
            try {
                const updatedLinks = currentCategory.links.filter(link => link.id !== linkId);
                
                await setDoc(doc(db, categoryRef.path, currentCategory.id), {
                    ...currentCategory,
                    links: updatedLinks
                });
                showMessage('链接已删除。');
                setError('');
            } catch (e) {
                console.error("Error deleting link: ", e);
                setError('删除链接失败。');
            }
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-indigo-600 mb-6">导航管理面板</h1>
            <div className="text-sm text-gray-500 mb-4">当前用户UID: <span className="font-mono bg-gray-100 p-1 rounded">{userId}</span></div>
            
            {message && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
                    <span className="block sm:inline">{message}</span>
                </div>
            )}
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                    <span className="block sm:inline">错误: {error}</span>
                </div>
            )}
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* 左侧: 分类管理 */}
                <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-lg border border-gray-100 h-fit">
                    <h2 className="text-xl font-semibold text-gray-700 mb-4">分类操作</h2>

                    {/* 添加新分类 */}
                    <div className="mb-6 border-b pb-4">
                        <h3 className="font-medium text-lg mb-2">添加新分类</h3>
                        <input
                            type="text"
                            placeholder="分类名称 (如：常用工具)"
                            value={categoryName}
                            onChange={(e) => setCategoryName(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg mb-2 text-sm focus:ring-indigo-500"
                        />
                         <input
                            type="text"
                            placeholder="描述 (可选)"
                            value={categoryDescription}
                            onChange={(e) => setCategoryDescription(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg mb-3 text-sm focus:ring-indigo-500"
                        />
                        <button
                            onClick={handleAddCategory}
                            className="w-full py-2 px-4 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition duration-150 text-sm"
                        >
                            创建新分类
                        </button>
                    </div>

                    {/* 选择现有分类 */}
                    <h3 className="font-medium text-lg mb-2">选择要编辑的分类</h3>
                    <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                        {categoryList.map(cat => (
                            <div
                                key={cat.id}
                                onClick={() => setCurrentCategory(navData.find(c => c.id === cat.id))}
                                className={`p-3 rounded-lg cursor-pointer transition duration-150 flex justify-between items-center ${currentCategory.id === cat.id ? 'bg-indigo-100 text-indigo-700 font-semibold border-indigo-300 border' : 'bg-gray-50 hover:bg-gray-100 text-gray-700'}`}
                            >
                                <span className="truncate">{cat.name}</span>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat.id); }}
                                    className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-white transition"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 10-2 0v6a1 1 0 102 0V8z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                        ))}
                    </div>

                </div>

                {/* 右侧: 链接管理 */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                    <h2 className="text-xl font-semibold text-gray-700 mb-4">
                        {currentCategory.categoryName ? `编辑分类：${currentCategory.categoryName}` : '请先选择或创建一个分类'}
                    </h2>

                    {currentCategory.id && (
                        <>
                            <p className="text-gray-500 mb-6">描述: {currentCategory.description || '无描述'}</p>

                            {/* 添加新链接表单 */}
                            <form onSubmit={handleAddLink} className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-200 shadow-inner">
                                <h3 className="font-medium text-lg mb-3 border-b pb-2">添加新链接</h3>
                                <div className="space-y-3">
                                    <input
                                        type="text"
                                        name="name"
                                        placeholder="链接名称 (如：Google)"
                                        value={linkForm.name}
                                        onChange={handleLinkChange}
                                        className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500"
                                        required
                                    />
                                    <input
                                        type="text"
                                        name="url"
                                        placeholder="URL (如：www.google.com)"
                                        value={linkForm.url}
                                        onChange={handleLinkChange}
                                        className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500"
                                        required
                                    />
                                    <button
                                        type="submit"
                                        className="w-full py-2 px-4 bg-indigo-500 text-white font-semibold rounded-lg hover:bg-indigo-600 transition duration-150 text-sm"
                                    >
                                        添加链接
                                    </button>
                                </div>
                            </form>

                            {/* 现有链接列表 */}
                            <h3 className="font-medium text-lg mb-3 border-b pb-2">现有链接 ({currentCategory.links.length})</h3>
                            <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                                {currentCategory.links.map(link => (
                                    <div key={link.id} className="flex justify-between items-center p-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition duration-150">
                                        <div className="truncate flex-1 min-w-0">
                                            <div className="font-medium text-gray-800 truncate">{link.name}</div>
                                            <div className="text-xs text-indigo-500 truncate">{link.url}</div>
                                        </div>
                                        <button 
                                            onClick={() => handleDeleteLink(link.id)}
                                            className="ml-4 flex-shrink-0 text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 10-2 0v6a1 1 0 102 0V8z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- Main Application Component ---

const App = () => {
    const [navData, setNavData] = useState([]);
    const [user, setUser] = useState(null);
    const [view, setView] = useState('public'); // 'public' or 'admin'
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);

    // 1. Authentication and Initialization
    useEffect(() => {
        if (!firebaseConfig) {
            console.error("Firebase config is missing.");
            setIsAuthReady(true);
            return;
        }

        // 首次加载时处理 Canvas 认证
        const initialAuth = async () => {
            try {
                if (initialAuthToken) {
                    await signInWithCustomToken(auth, initialAuthToken);
                } else {
                    await signInAnonymously(auth);
                }
            } catch (e) {
                console.error("Initial auth failed:", e);
                // Fallback to anonymous if custom token fails
                try {
                    await signInAnonymously(auth);
                } catch (e) {
                    console.error("Anonymous auth failed:", e);
                }
            }
        };
        initialAuth();

        // 监听认证状态变化
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            // 检查当前用户是否是管理员
            if (currentUser && currentUser.uid === ADMIN_UID_PLACEHOLDER) {
                setIsAdmin(true);
            } else {
                setIsAdmin(false);
            }
            setIsAuthReady(true);
        });

        return () => unsubscribe();
    }, []);

    // 2. Real-time Data Fetching (Firestore)
    useEffect(() => {
        if (!isAuthReady || !user || !db) return;

        // 导航数据存储在公共路径下
        const q = query(collection(db, `artifacts/${appId}/public/data/navLinks`));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            // 按照名称排序分类，以保证显示顺序稳定
            data.sort((a, b) => a.categoryName.localeCompare(b.categoryName, 'zh-CN'));
            setNavData(data);
        }, (error) => {
            console.error("Firestore listen failed:", error);
        });

        return () => unsubscribe();
    }, [isAuthReady, user]);

    const handleSignOut = async () => {
        try {
            await signOut(auth);
            // 登出后自动切换到匿名身份
            await signInAnonymously(auth);
            setView('public');
        } catch (error) {
            console.error("Sign out error:", error);
        }
    };

    const userId = user?.uid || 'N/A';
    
    // Loading State
    if (!isAuthReady) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50">
                <div className="text-xl text-indigo-500">
                    <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-indigo-500 inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    应用初始化中...
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 min-h-screen">
            {/* 顶部导航和切换按钮 */}
            <nav className="bg-white shadow-md sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <span className="text-xl font-bold text-indigo-600">自定义导航</span>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => setView('public')}
                                className={`px-3 py-2 rounded-md text-sm font-medium transition duration-150 ${view === 'public' ? 'bg-indigo-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                            >
                                导航首页
                            </button>
                            {isAdmin ? (
                                <>
                                    <button
                                        onClick={() => setView('admin')}
                                        className={`px-3 py-2 rounded-md text-sm font-medium transition duration-150 ${view === 'admin' ? 'bg-yellow-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                                    >
                                        管理面板
                                    </button>
                                    <button
                                        onClick={handleSignOut}
                                        className="px-3 py-2 rounded-md text-sm font-medium text-red-600 border border-red-300 hover:bg-red-50 transition duration-150"
                                    >
                                        登出
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => setView('login')}
                                    className={`px-3 py-2 rounded-md text-sm font-medium transition duration-150 ${view === 'login' ? 'bg-gray-200 text-gray-800' : 'text-gray-600 hover:bg-gray-100'}`}
                                >
                                    管理员登录
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
                    <div className="text-center p-20 text-red-500 text-xl">
                        您没有管理员权限。请先登录，并确保您的 UID ({userId}) 匹配代码中的 `ADMIN_UID_PLACEHOLDER`。
                    </div>
                )}
            </main>
        </div>
    );
};

export default App;
