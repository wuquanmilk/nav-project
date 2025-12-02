import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword // 导入注册函数
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  onSnapshot,
  doc,
  addDoc,
  deleteDoc,
  updateDoc,
  query,
  orderBy,
} from 'firebase/firestore';
// 导入需要的图标
import { 
  ExternalLink, Moon, Sun, LogIn, X, Github, Mail, Globe, Search, User,
  Cloud, Database, Bot, Play, Camera, Network, Server, ShoppingCart, Wand, Monitor, Wrench, Code, ChevronDown, ChevronUp
} from 'lucide-react'; 

// 🔹 配置你的管理员 UID
const ADMIN_USER_ID = '6UiUdmPna4RJb2hNBoXhx3XCTFN2'; // 替换为您的管理员 UID
const APP_ID = 'default-app-id';

// ⭐️ 谷歌图标 Base64 SVG 编码 (用于国际版稳定性修复，防止动态加载失败) ⭐️
const GOOGLE_BASE64_ICON = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0OCA0OCI+PHBhdGggZmlsbD0iI0VBNDMzNSIgZD0iTTI0IDQ4YzYuNDggMCAxMS45My0yLjQ4IDE1LjgzLTcuMDhMMzQuMjIgMzYuM2MtMi44MSAxLjg5LTYuMjIgMy05LjkzIDMtMTIuODggMC0yMy41LTEwLjQyLTIzLjUtMjMuNDggMC01LjM2IDEuNzYtMTAuMyA0Ljc0LTE0LjM1TDkuNjggMi45OEM0LjAyIDcuNzEgMCAxNS40MyAwIDI0LjUyIDAgMzcuNDggMTAuNzQgNDggMjQgNDh6Ii8+PHBhdGggZmlsbD0iIzQyODVGNCIgZD0iTTQ2Ljk4IDI0LjU1Yy0wLjU1Ny0uMTUtMy4wOS0uMzg0LjU1LTMuNDctMS43Mi0yLjk2LTQuOTItNS40OC04LjQ3LTcuMThsLTcuNzM2LTcuMDI2NDIuNTg4IDYuMjk2Yy0xLjUzLS43MS0zLjIzLS45OS00Ljk3LS45OS01LjM2IDAtMTAuMzMgMi40Ni0xMy42NiA2LjE1TDkuNjggMi45YzMuODMtMy42NyA5LjAxLTUuOTYgMTUuMzItNS45NiAyLjk5IDAgNS43OC41NSA4LjQ0IDEuNTRsNS43OCAzLjI0Yy00LjU1LTIuOTYtOS45Mi00LjUzLTE1LjgzLTQuNTMtMTIuODggMC0yMy41IDEwLjQyLTIzLjUgMjMuNDggMC01LjM2IDEuNzYtMTAuMyA0Ljc0LTE0LjM1TDkuNjggMi45eiIvPjwvc3ZnPg==';

// =========================================================================
// 核心数据定义：外部搜索引擎列表 (已恢复)
// =========================================================================

// 国际版搜索引擎
const FULL_EXTERNAL_ENGINES = [
    { name: 'Google', url: 'https://www.google.com/search?q=', icon: GOOGLE_BASE64_ICON },
    { name: 'Bing', url: 'https://www.bing.com/search?q=', icon: 'https://www.bing.com/favicon.ico' },
    { name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=', icon: 'https://duckduckgo.com/favicon.ico' },
    { name: 'GitHub', url: 'https://github.com/search?q=', icon: 'https://github.com/favicon.ico' },
    { name: 'Stack Overflow', url: 'https://stackoverflow.com/search?q=', icon: 'https://cdn.sstatic.net/Sites/stackoverflow/Img/favicon.ico' },
];

// 国内版搜索引擎
const DOMESTIC_EXTERNAL_ENGINES = [
    { name: '百度', url: 'https://www.baidu.com/s?wd=', icon: 'https://www.baidu.com/favicon.ico' },
    { name: 'Bing (国内)', url: 'https://cn.bing.com/search?q=', icon: 'https://cn.bing.com/favicon.ico' },
    { name: '搜狗', url: 'https://www.sogou.com/web?query=', icon: 'https://www.sogou.com/favicon.ico' },
];

// 国际版默认导航数据
const FULL_NAV_DATA = [
    {
        id: 'cat-1',
        category: '常用开发',
        order: 0,
        links: [
            { name: 'HuggingFace', url: 'https://huggingface.co/', description: 'AI/ML 模型共享与协作社区', icon: 'Bot' },
            { name: 'GitHub', url: 'https://github.com/', description: '全球最大的代码托管平台', icon: 'Code' },
            { name: 'Stack Overflow', url: 'https://stackoverflow.com/', description: '开发者问答社区', icon: 'Wrench' },
        ],
    },
    {
        id: 'cat-2',
        category: 'AI 工具',
        order: 1,
        links: [
            { name: 'ChatGPT', url: 'https://chat.openai.com/', description: 'OpenAI 语言模型', icon: 'Cloud' },
            { name: 'Google Gemini', url: 'https://gemini.google.com/', description: '谷歌 AI 助手', icon: 'Database' },
        ],
    },
];

// 国内版默认导航数据
const DOMESTIC_NAV_DATA = [
    {
        id: 'cat-1',
        category: '常用工具',
        order: 0,
        links: [
            { name: '百度', url: 'https://www.baidu.com/', description: '国内常用搜索引擎', icon: 'Search' },
            { name: '淘宝', url: 'https://www.taobao.com/', description: '电商购物平台', icon: 'ShoppingCart' },
        ],
    },
];


// =========================================================================
// 核心切换开关：国内版 / 国际版 (保持不变)
// =========================================================================

const IS_DOMESTIC_VERSION = false; 
const APP_TITLE = IS_DOMESTIC_VERSION ? '极速导航网 (国内版)' : '极速导航网 (国际版)';
const EXTERNAL_ENGINES = IS_DOMESTIC_VERSION ? DOMESTIC_EXTERNAL_ENGINES : FULL_EXTERNAL_ENGINES;
const DEFAULT_NAV_DATA = IS_DOMESTIC_VERSION ? DOMESTIC_NAV_DATA : FULL_NAV_DATA;


// =========================================================================
// ⬇️ 辅助组件 (SearchLayout, LinkCard, PublicNav, LinkForm 等全部恢复) ⬇️
// =========================================================================

// 🔹 LinkIcon 组件
const LinkIcon = ({ iconName, className = "w-4 h-4" }) => {
  const IconComponent = {
    ExternalLink, Moon, Sun, LogIn, X, Github, Mail, Globe, Search, User,
    Cloud, Database, Bot, Play, Camera, Network, Server, ShoppingCart, Wand, Monitor, Wrench, Code,
  }[iconName] || ExternalLink;

  return <IconComponent className={className} />;
};

// 🔹 LinkCard 组件
const LinkCard = React.memo(({ link }) => (
    <a href={link.url} target="_blank" rel="noopener noreferrer" className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 border border-gray-200 dark:border-gray-700 block h-full">
        <div className="flex items-center space-x-3 mb-2">
            <div className="flex-shrink-0">
                {link.icon && link.icon.startsWith('data:image') ? (
                    <img src={link.icon} alt={link.name} className="w-5 h-5 rounded-full" />
                ) : link.icon && link.icon.startsWith('http') ? (
                    <img src={link.icon} alt={link.name} className="w-5 h-5 rounded-full" />
                ) : (
                    <LinkIcon iconName={link.icon} className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                )}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">{link.name}</h3>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{link.description || link.url}</p>
    </a>
));

// 🔹 SearchLayout 组件
const SearchLayout = ({ searchTerm, setSearchTerm }) => {
  const [selectedEngine, setSelectedEngine] = useState(EXTERNAL_ENGINES[0]);
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      window.open(selectedEngine.url + encodeURIComponent(searchTerm), '_blank');
      setSearchTerm('');
    }
  };

  return (
    <div className="mb-12">
      <form onSubmit={handleSearch} className="flex items-center w-full max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700">
        <div className="p-3">
          {selectedEngine.icon.startsWith('data:image') || selectedEngine.icon.startsWith('http') ? (
            <img src={selectedEngine.icon} alt={selectedEngine.name} className="w-5 h-5 rounded-full" />
          ) : (
            <LinkIcon iconName={selectedEngine.icon} className="w-5 h-5 text-blue-500" />
          )}
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={`使用 ${selectedEngine.name} 搜索...`}
          className="flex-grow p-3 text-gray-800 dark:text-gray-100 bg-transparent focus:outline-none"
        />
        <button type="submit" className="p-3 text-white bg-blue-600 rounded-r-xl hover:bg-blue-700 transition-colors flex items-center space-x-1">
          <Search className="w-5 h-5" />
          <span className="hidden sm:inline">搜索</span>
        </button>
      </form>
      <div className="flex justify-center mt-3 space-x-3 text-sm flex-wrap gap-2">
        {EXTERNAL_ENGINES.map(engine => (
          <button
            key={engine.name}
            onClick={() => setSelectedEngine(engine)}
            className={`px-3 py-1 rounded-full transition-colors ${selectedEngine.name === engine.name ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
          >
            {engine.name}
          </button>
        ))}
      </div>
    </div>
  );
};


// 🔹 LinkForm 组件 (用于 AdminPanel 内部)
const LinkForm = ({ links, setLinks }) => {
    const [newLink, setNewLink] = useState({ name: '', url: '', description: '', icon: '' });

    const handleAddLink = () => {
        if (newLink.name && newLink.url) {
            setLinks([...links, newLink]);
            setNewLink({ name: '', url: '', description: '', icon: '' });
        }
    };

    const handleDeleteLink = (index) => {
        setLinks(links.filter((_, i) => i !== index));
    };

    const handleLinkChange = (index, field, value) => {
        const updatedLinks = links.map((link, i) => 
            i === index ? { ...link, [field]: value } : link
        );
        setLinks(updatedLinks);
    };

    return (
        <div className="space-y-3 p-3 border border-dashed rounded dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
            <h5 className="font-semibold text-gray-800 dark:text-gray-100">链接列表</h5>
            {links.map((link, index) => (
                <div key={index} className="flex items-center space-x-2 bg-white dark:bg-gray-800 p-2 rounded shadow-sm">
                    <input type="text" value={link.name} onChange={(e) => handleLinkChange(index, 'name', e.target.value)} placeholder="名称" className="border p-1 rounded text-sm w-24 dark:bg-gray-700 dark:border-gray-600"/>
                    <input type="url" value={link.url} onChange={(e) => handleLinkChange(index, 'url', e.target.value)} placeholder="URL" className="border p-1 rounded text-sm flex-grow dark:bg-gray-700 dark:border-gray-600"/>
                    <input type="text" value={link.description || ''} onChange={(e) => handleLinkChange(index, 'description', e.target.value)} placeholder="描述 (可选)" className="border p-1 rounded text-sm w-24 dark:bg-gray-700 dark:border-gray-600 hidden sm:block"/>
                    <input type="text" value={link.icon || ''} onChange={(e) => handleLinkChange(index, 'icon', e.target.value)} placeholder="图标名/URL (可选)" className="border p-1 rounded text-sm w-24 dark:bg-gray-700 dark:border-gray-600 hidden lg:block"/>
                    <button onClick={() => handleDeleteLink(index)} className="text-red-500 hover:text-red-700 flex-shrink-0"><X className="w-4 h-4"/></button>
                </div>
            ))}
            <div className="flex space-x-2">
                <input type="text" value={newLink.name} onChange={e => setNewLink({...newLink, name: e.target.value})} placeholder="名称" className="border p-2 rounded text-sm w-20 dark:bg-gray-600 dark:border-gray-500"/>
                <input type="url" value={newLink.url} onChange={e => setNewLink({...newLink, url: e.target.value})} placeholder="URL" className="border p-2 rounded text-sm flex-grow dark:bg-gray-600 dark:border-gray-500"/>
                <input type="text" value={newLink.description} onChange={e => setNewLink({...newLink, description: e.target.value})} placeholder="描述" className="border p-2 rounded text-sm w-24 dark:bg-gray-600 dark:border-gray-500 hidden sm:block"/>
                <input type="text" value={newLink.icon} onChange={e => setNewLink({...newLink, icon: e.target.value})} placeholder="图标" className="border p-2 rounded text-sm w-24 dark:bg-gray-600 dark:border-gray-500 hidden lg:block"/>
                <button onClick={handleAddLink} className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-sm flex-shrink-0">添加</button>
            </div>
        </div>
    );
};

// 🔹 PublicNav 组件
const PublicNav = ({ navData, searchTerm }) => {
    // 过滤掉所有链接都被搜索过滤掉的分类
    const visibleCategories = navData
        .map(category => ({
            ...category,
            links: category.links?.filter(link => 
                link.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                link.description?.toLowerCase().includes(searchTerm.toLowerCase())
            ) || []
        }))
        .filter(category => category.links.length > 0);

    if (visibleCategories.length === 0) {
        return (
            <div className="text-center py-20">
                <Search className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-600"/>
                <p className="mt-4 text-xl text-gray-600 dark:text-gray-300">未找到匹配 "{searchTerm}" 的结果。</p>
            </div>
        );
    }

    return (
        <div className="space-y-10">
            {visibleCategories.map(category => (
                <section key={category.id} className="relative">
                    <h2 className="text-2xl font-bold mb-4 border-b pb-2 text-gray-800 dark:text-white dark:border-gray-700">
                        {category.category}
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {category.links.map(link => (
                            <LinkCard key={link.url} link={link} />
                        ))}
                    </div>
                </section>
            ))}
        </div>
    );
};


// 🔹 注册弹窗 (RegisterModal)
const RegisterModal = ({ onClose, onRegister, error, onSwitchToLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const handleSubmit = (e) => { e.preventDefault(); onRegister(email, password); };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md p-8 relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"><X className="w-6 h-6"/></button>
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100 flex items-center"><User className="w-6 h-6 mr-3 text-green-500"/>新用户注册</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="email" placeholder="邮箱" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" required/>
          <input type="password" placeholder="密码 (至少6位)" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" required/>
          {error && <div className="text-sm p-3 bg-red-100 text-red-700 rounded-lg">{error}</div>}
          <button type="submit" className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg">注册</button>
        </form>
        <div className="mt-4 text-center">
            <button onClick={onSwitchToLogin} className="text-sm text-blue-500 hover:underline">
                已有账号？去登录
            </button>
        </div>
      </div>
    </div>
  );
};

// 🔹 登录弹窗 (LoginModal)
const LoginModal = ({ onClose, onLogin, error, onSwitchToRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const handleSubmit = (e) => { e.preventDefault(); onLogin(email, password); };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md p-8 relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"><X className="w-6 h-6"/></button>
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100 flex items-center"><LogIn className="w-6 h-6 mr-3 text-blue-500"/>用户登录</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="email" placeholder="邮箱" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" required/>
          <input type="password" placeholder="密码" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" required/>
          {error && <div className="text-sm p-3 bg-red-100 text-red-700 rounded-lg">{error}</div>}
          <button type="submit" className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg">登录</button>
          <div className="mt-4 text-center">
              <button onClick={onSwitchToRegister} className="text-sm text-blue-500 hover:underline">
                  没有账号？去注册
              </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// 🔹 管理面板 (AdminPanel)
const AdminPanel = ({ db, navData, fetchData, userId, isAdmin }) => {
    // 核心修改：根据用户身份确定操作路径
    const collectionPath = isAdmin 
        ? `artifacts/${APP_ID}/public/data/navData` // 管理员操作公共数据
        : `users/${userId}/data/navData`;         // 普通用户操作私有数据
        
    const navCollection = collection(db, collectionPath);
    
    const [newCategory, setNewCategory] = useState({ category: '', order: 0, links: [] });
    const [editId, setEditId] = useState(null);
    const [editData, setEditData] = useState({});
    const [isAdding, setIsAdding] = useState(false);

    const handleAddCategory = async () => {
        if (!newCategory.category) return alert('请输入分类名称');
        try {
            // 在 Firestore 中创建新分类
            await addDoc(navCollection, {
                category: newCategory.category,
                order: Number(newCategory.order) || 0,
                links: newCategory.links.map(l => ({ name: l.name, url: l.url, description: l.description || '', icon: l.icon || '' })),
            });
            setNewCategory({ category: '', order: 0, links: [] });
            setIsAdding(false);
        } catch (error) {
            console.error("Error adding document: ", error);
            alert("添加分类失败，请检查Firebase连接和权限。");
        }
    };

    const startEdit = (item) => { 
      const linksWithIcon = item.links ? item.links.map(link => ({...link, icon: link.icon || '' })) : [];
      setEditId(item.id); 
      setEditData({...item, links: linksWithIcon}); 
    };

    const saveEdit = async () => { 
      if (!editData.category) return alert('分类名称不能为空');
      
      const linksWithIcon = editData.links.map(link => ({
        name: link.name, 
        url: link.url, 
        description: link.description || '', 
        icon: link.icon || '' 
      }));

      try {
        await updateDoc(doc(db, collectionPath, editId), {
            category: editData.category,
            order: Number(editData.order) || 0,
            links: linksWithIcon,
        }); 
        setEditId(null); 
      } catch (error) {
        console.error("Error updating document: ", error);
        alert("保存修改失败，请检查Firebase连接和权限。");
      }
    };
    
    const handleDelete = async (id) => { 
      if(window.confirm(`确认删除分类: ${navData.find(d => d.id === id)?.category} 吗?`)) {
          try {
            await deleteDoc(doc(db, collectionPath, id));
          } catch (error) {
            console.error("Error deleting document: ", error);
            alert("删除分类失败，请检查Firebase连接和权限。");
          }
      }
    };

    return (
        <div className="mt-6 p-4 rounded bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
            <h3 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">
                {isAdmin ? '管理员面板 (公共数据)' : '我的面板 (私有数据)'}
            </h3>

            <button 
                onClick={() => setIsAdding(!isAdding)} 
                className="mb-4 flex items-center bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            >
                {isAdding ? <ChevronUp className="w-5 h-5 mr-2" /> : <ChevronDown className="w-5 h-5 mr-2" />}
                {isAdding ? '收起新增面板' : '展开新增分类'}
            </button>
            
            {isAdding && (
                <div className="p-4 mb-4 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-blue-200 dark:border-blue-800 transition-all duration-300">
                    <h4 className="font-semibold mb-3 text-lg text-gray-800 dark:text-gray-100">新增分类</h4>
                    <div className="flex flex-col gap-3">
                        <input placeholder="分类名" className="border p-2 rounded w-full dark:bg-gray-700 dark:border-gray-600" value={newCategory.category} onChange={e => setNewCategory({...newCategory, category:e.target.value})}/>
                        <div className="flex items-center space-x-2">
                            <span className="text-gray-600 dark:text-gray-300">排序:</span>
                            <input type="number" placeholder="0" className="border p-2 rounded w-20 dark:bg-gray-700 dark:border-gray-600" value={newCategory.order} onChange={e => setNewCategory({...newCategory, order:Number(e.target.value)})}/>
                        </div>
                        <LinkForm links={newCategory.links} setLinks={(links)=>setNewCategory({...newCategory, links})}/>
                        <button onClick={handleAddCategory} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 self-start">确认新增分类</button>
                    </div>
                </div>
            )}
            
            <h4 className="font-semibold mb-3 text-lg text-gray-800 dark:text-white">现有分类列表</h4>
            <div className="space-y-4">
                {navData.map(item=>(
                  <div key={item.id} className="border p-4 rounded bg-white dark:bg-gray-800 shadow-lg">
                    {editId === item.id ? (
                      // 编辑状态
                      <>
                        <input className="text-xl font-bold border p-2 mb-2 rounded w-full dark:bg-gray-700 dark:border-gray-600" value={editData.category} onChange={e=>setEditData({...editData, category:e.target.value})}/>
                        <div className="flex items-center space-x-2 mb-3">
                            <span className="text-gray-600 dark:text-gray-300">排序:</span>
                            <input type="number" className="border p-2 rounded w-20 dark:bg-gray-700 dark:border-gray-600" value={editData.order} onChange={e=>setEditData({...editData, order:Number(e.target.value)})}/>
                        </div>
                        <LinkForm links={editData.links} setLinks={(links)=>setEditData({...editData, links})}/>
                        <div className="flex space-x-3 mt-4">
                          <button onClick={saveEdit} className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">保存修改</button>
                          <button onClick={()=>setEditId(null)} className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500">取消</button>
                        </div>
                      </>
                    ) : (
                      // 显示状态
                      <>
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="text-xl font-bold text-gray-800 dark:text-gray-100">{item.category} (排序: {item.order})</h4>
                          <div className="flex space-x-2">
                            <button onClick={()=>startEdit(item)} className="bg-yellow-500 text-white text-sm px-4 py-1 rounded hover:bg-yellow-600">编辑</button>
                            <button onClick={()=>handleDelete(item.id)} className="bg-red-500 text-white text-sm px-4 py-1 rounded hover:bg-red-600">删除</button>
                          </div>
                        </div>
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 ml-2 text-sm text-gray-600 dark:text-gray-300 border-t pt-2 dark:border-gray-700">
                          {item.links?.map((l,idx)=><li key={idx} className="truncate"><span className="font-semibold">{l.name}</span> - <a href={l.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{l.url}</a></li>)}
                        </ul>
                      </>
                    )}
                  </div>
                ))}
            </div>
        </div>
    );
};


// 🔹 首页组件 (HomePage)
const HomePage = () => { 
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
    const [navData, setNavData] = useState(DEFAULT_NAV_DATA); 
    const [searchTerm, setSearchTerm] = useState('');
    const [user, setUser] = useState(null);
    const [userId, setUserId] = useState(null); // 存储真实 UID 或 'anonymous'
    const [isAdmin, setIsAdmin] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showRegisterModal, setShowRegisterModal] = useState(false);
    const [loginError, setLoginError] = useState('');
    const [currentPage, setCurrentPage] = useState('home'); 

    // Firebase App 初始化 
    const firebaseConfig = {
      // ❗❗❗ 请在这里填写您真实的 Firebase 配置 ❗❗❗
      apiKey: "YOUR_API_KEY", 
      authDomain: "YOUR_AUTH_DOMAIN", 
      projectId: "YOUR_PROJECT_ID", 
      storageBucket: "YOUR_STORAGE_BUCKET",
      messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
      appId: "YOUR_APP_ID",
      // ❗❗❗ ❗❗❗ ❗❗❗ ❗❗❗ ❗❗❗ ❗❗❗
    };

    const app = useMemo(() => {
        try {
            return initializeApp(firebaseConfig);
        } catch (e) {
            // console.error("Firebase already initialized or config error:", e);
            return null;
        }
    }, []);

    const db = app ? getFirestore(app) : null;
    const auth = app ? getAuth(app) : null;

    useEffect(() => {
        // 主题设置逻辑
        document.documentElement.className = theme === 'dark' ? 'dark' : 'light';
        localStorage.setItem('theme', theme);
    }, [theme]);

    // 认证状态监听 (已实现多用户逻辑)
    useEffect(() => {
        if (!auth) return;
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                // 核心逻辑：区分匿名用户和注册用户
                if (currentUser.isAnonymous) {
                    setUserId('anonymous');
                } else {
                    setUserId(currentUser.uid);
                }
                // 检查是否为管理员 UID
                setIsAdmin(currentUser.uid === ADMIN_USER_ID);
            } else {
                // 如果用户未登录，自动执行匿名登录，作为默认游客身份
                signInAnonymously(auth).catch(console.error);
                setUserId(null); // 在登录完成前保持 null
                setIsAdmin(false);
            }
        });
        return () => unsubscribe();
    }, [auth]);

    // Firestore 数据获取 (已实现数据隔离)
    const fetchData = useCallback(() => {
        if (!db || !userId) {
            return () => {};
        }

        let collectionPath;
        let isPublicData = false;

        if (userId === 'anonymous' || isAdmin) {
            // 游客和管理员都读取公共数据
            collectionPath = `artifacts/${APP_ID}/public/data/navData`;
            isPublicData = true;
        } else {
            // 普通注册用户：读取自己的私有数据
            collectionPath = `users/${userId}/data/navData`;
        }
        
        // 按照 order 字段排序
        const navQuery = query(collection(db, collectionPath), orderBy("order", "asc"));

        const unsubscribe = onSnapshot(navQuery, (snapshot) => {
            let data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            if (data.length === 0 && !isPublicData) {
                // 注册用户第一次登录，私有数据为空，使用默认硬编码数据作为起点
                console.log("User private data empty, using default hardcoded data.");
                // 注意：这里只是显示默认数据，用户保存时才会真正写入私有路径
                setNavData(DEFAULT_NAV_DATA.map(cat => ({...cat, id: cat.category.replace(/\s/g, '-') }))); 
                return;
            } else if (data.length === 0 && isPublicData) {
                 // 公共数据为空，使用默认硬编码数据作为回退
                setNavData(DEFAULT_NAV_DATA);
                return;
            }

            // 更新状态
            setNavData(data);

        }, (error) => {
            console.error("Error fetching Firestore data, using default data:", error);
            setNavData(DEFAULT_NAV_DATA);
        });
        return () => unsubscribe();
    }, [db, userId, isAdmin]);

    useEffect(() => {
        const cleanup = fetchData();
        return cleanup;
    }, [fetchData]);

    const handleRegister = async (email, password) => {
        setLoginError('');
        try {
          await createUserWithEmailAndPassword(auth, email, password);
          setShowRegisterModal(false); 
          setShowLoginModal(false);
        } catch(e){ 
            setLoginError(`注册失败: ${e.message}`); 
        }
    };

    const handleLogin = async (email, password) => {
        setLoginError('');
        try {
            await signInWithEmailAndPassword(auth, email, password);
            setShowLoginModal(false);
            setShowRegisterModal(false);
        } catch (error) {
            console.error("Login failed:", error);
            setLoginError('登录失败：邮箱或密码错误。');
        }
    };

    const handleToggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    const filteredNavData = useMemo(() => {
        if (!searchTerm) return navData;
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        
        // 过滤分类内的链接
        return navData
            .map(category => ({
                ...category,
                links: category.links?.filter(link => 
                    link.name.toLowerCase().includes(lowerCaseSearchTerm) || 
                    link.description?.toLowerCase().includes(lowerCaseSearchTerm) ||
                    category.category.toLowerCase().includes(lowerCaseSearchTerm)
                ) || []
            }))
            .filter(category => category.links.length > 0);
    }, [navData, searchTerm]);


    return (
        <div className={`min-h-screen ${theme === 'dark' ? 'dark' : ''}`}>
            <div className="bg-gray-50 dark:bg-gray-900 transition-colors duration-300 min-h-screen pt-4">
              <div className="container mx-auto px-4 max-w-7xl">
        
                {/* 头部导航栏 */}
                <header className="flex justify-between items-center py-4 mb-8">
                    <h1 
                        className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 cursor-pointer" 
                        onClick={() => setCurrentPage('home')}
                    >
                        {APP_TITLE}
                    </h1>
                    <div className="flex items-center space-x-3">
                        {/* 主页按钮 */}
                        <button 
                            onClick={() => setCurrentPage('home')} 
                            className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-blue-500 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                            title="主页"
                        >
                            <Globe className="w-5 h-5"/>
                        </button>

                        {/* 主题切换按钮 */}
                        <button 
                            onClick={handleToggleTheme} 
                            className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                            title="切换主题"
                        >
                            {theme === 'light' ? <Moon className="w-5 h-5"/> : <Sun className="w-5 h-5"/>}
                        </button>

                        {/* 核心认证按钮逻辑 */}
                        {userId && userId !== 'anonymous' ? (
                            // 已登录用户 (普通客户或管理员)
                            <button 
                                onClick={() => signOut(auth)} 
                                className="p-2 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
                                title={isAdmin ? `退出管理 (${user?.email})` : `退出登录 (${user?.email})`}
                            >
                                <User className="w-5 h-5"/> 
                            </button>
                        ) : (
                            // 游客 (匿名用户) 或未完成初始化
                            <div className="flex space-x-2">
                                <button 
                                    onClick={() => setShowLoginModal(true)} 
                                    className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                                    title="客户/管理员登录"
                                >
                                    <LogIn className="w-5 h-5"/> 
                                </button>
                                <button 
                                    onClick={() => setShowRegisterModal(true)} 
                                    className="p-2 rounded-full bg-green-500 text-white hover:bg-green-600 transition-colors"
                                    title="新用户注册"
                                >
                                    <User className="w-5 h-5"/> 
                                </button>
                            </div>
                        )}
                    </div>
                </header>
                
                {/* 搜索区域 */}
                <SearchLayout searchTerm={searchTerm} setSearchTerm={setSearchTerm}/>
                
                {/* 核心内容渲染 (新增初始化等待状态) */}
                {!db || !auth || userId === null ? (
                    <div className="text-center py-20 text-gray-500 dark:text-gray-400">正在初始化应用和认证状态...</div>
                ) : (
                    (userId && userId !== 'anonymous') ? (
                        // 注册用户或管理员登录后，显示 AdminPanel 供其修改自己的数据
                        <AdminPanel 
                            db={db} 
                            navData={navData} 
                            fetchData={fetchData}
                            userId={userId} 
                            isAdmin={isAdmin} 
                        />
                    ) : (
                        // 游客或匿名用户，显示公共导航
                        currentPage === 'home' ? (
                            <PublicNav navData={filteredNavData} searchTerm={searchTerm} />
                        ) : currentPage === 'about' ? (
                            <AboutPage />
                        ) : currentPage === 'disclaimer' ? (
                            <DisclaimerPage />
                        ) : (
                            <PublicNav navData={filteredNavData} searchTerm={searchTerm} />
                        )
                    )
                )}
              </div>
            </div>
            
            <Footer setCurrentPage={setCurrentPage} appTitle={APP_TITLE} />
            
            {/* 登录/注册弹窗渲染 */}
            {showLoginModal && (
                <LoginModal 
                    onClose={() => setShowLoginModal(false)} 
                    onLogin={handleLogin} 
                    error={loginError}
                    onSwitchToRegister={() => { setShowLoginModal(false); setShowRegisterModal(true); }}
                />
            )}
            {showRegisterModal && (
                <RegisterModal 
                    onClose={() => setShowRegisterModal(false)} 
                    onRegister={handleRegister} 
                    error={loginError}
                    onSwitchToLogin={() => { setShowRegisterModal(false); setShowLoginModal(true); }}
                />
            )}
        </div>
    );
};

// 🔹 页脚 (Footer)
const Footer = ({ setCurrentPage, appTitle }) => (
    <footer className="w-full mt-12 py-6 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 transition-colors duration-300">
      <div className="container mx-auto px-4 max-w-7xl flex flex-col sm:flex-row justify-between items-center text-sm text-gray-500 dark:text-gray-400">
        <p>&copy; {new Date().getFullYear()} {appTitle}. All rights reserved.</p>
        <div className="flex space-x-4 mt-3 sm:mt-0">
          <button onClick={() => setCurrentPage('about')} className="hover:text-blue-500">关于我们</button>
          <button onClick={() => setCurrentPage('disclaimer')} className="hover:text-blue-500">免责声明</button>
          <a href="https://github.com/your-repo" target="_blank" rel="noopener noreferrer" className="hover:text-blue-500 flex items-center">
            <Github className="w-4 h-4 mr-1"/> GitHub
          </a>
        </div>
      </div>
    </footer>
);

// 🔹 占位页面 (AboutPage)
const AboutPage = () => (
    <div className="py-12 px-6 bg-white dark:bg-gray-800 rounded-xl shadow-2xl">
        <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">关于我们</h2>
        <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">
            这是一个由 React、Tailwind CSS 和 Firebase 驱动的现代化、高度可定制的个人导航门户。
        </p>
        <p className="text-gray-600 dark:text-gray-400">
            我们的目标是提供一个快速、简洁的界面，帮助用户高效地访问他们最常用的网站和工具。通过多用户功能，每个注册用户都可以创建和维护自己的专属面板，实现真正的个性化。
        </p>
    </div>
);

// 🔹 占位页面 (DisclaimerPage)
const DisclaimerPage = () => (
    <div className="py-12 px-6 bg-white dark:bg-gray-800 rounded-xl shadow-2xl">
        <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">免责声明</h2>
        <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">
            本导航页面上的所有链接和内容均由用户自行添加和管理。
        </p>
        <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
            <li>本站不对链接的有效性、安全性或内容承担任何责任。</li>
            <li>用户应自行判断和承担访问外部网站的风险。</li>
            <li>如果您是注册用户，您的私有数据将受到 Firebase 规则保护，但您需对数据的准确性和合法性负责。</li>
        </ul>
    </div>
);

// 默认导出主应用组件
export default HomePage;