import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
  signInWithEmailAndPassword
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  onSnapshot,
  doc,
  addDoc,
  deleteDoc,
  updateDoc,
  getDocs
} from 'firebase/firestore';
// 导入需要的图标
import { ExternalLink, Moon, Sun, LogIn, X, Github, Mail, Globe, Search, User } from 'lucide-react'; 

// 🔹 配置你的管理员 UID
const ADMIN_USER_ID = '6UiUdmPna4RJb2hNBoXhx3XCTFN2';
const APP_ID = 'default-app-id';

// 🔥🔥🔥 清空硬编码数据：使用一个空数组作为初始默认值 🔥🔥🔥
const INITIAL_NAV_DATA = [];

// Helper to check if a string looks like an image URL
const isImageURL = (str) => {
    return str && str.startsWith('http') && str.match(/\.(png|jpg|jpeg|ico|svg|gif)$/i);
};

// Helper to extract hostname safely
const getHostname = (url) => {
    try {
        // Ensure protocol exists for new URL()
        const safeUrl = url.startsWith('http') ? url : `https://${url}`;
        // 确保只返回域名部分，去除端口和路径
        const hostname = new URL(safeUrl).hostname;
        // 如果是 IP 地址，则直接返回
        if (hostname.match(/^(\d{1,3}\.){3}\d{1,3}$/)) {
            return hostname;
        }
        // 对于域名，返回主机名
        return hostname;
    } catch {
        return null;
    }
};

// 🔹 调试栏隐藏
const DebugBar = () => null;

// 🔹 链接卡片
const LinkCard = ({ link }) => {
  // 🚀 多阶段图标查找逻辑 (解决 S2 干扰和子域名问题)
  const faviconUrl = useMemo(() => {
    
    const iconSource = link.icon; 
    const urlSource = link.url;
    
    // 1. 优先级最高：如果 link.icon 是一个完整的图片 URL，直接使用它（管理员硬核修复）
    if (isImageURL(iconSource)) {
        return iconSource;
    }

    // 2. 尝试 S2 查找（使用链接 URL 的域名，适用于大部分站点）
    const primaryHostname = getHostname(urlSource);
    // 检查 link.icon 是否包含一个主域名，用于子域名修正
    const fallbackHostname = getHostname(iconSource);

    // 2a. 如果管理员在 icon 字段输入了主域名（如 claw.cloud），使用它进行 S2 查找
    if (fallbackHostname) {
        return `https://www.google.com/s2/favicons?domain=${fallbackHostname}&sz=64`;
    }
    
    // 2b. 否则，使用链接本身的主机名进行 S2 查找
    if (primaryHostname) {
        return `https://www.google.com/s2/favicons?domain=${primaryHostname}&sz=64`;
    }

    // 3. 最终回退
    return 'https://placehold.co/40x40/ccc/000?text=L';

  }, [link.icon, link.url]);

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg flex flex-col h-full border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow duration-300">
      <a href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-4 flex-grow">
        <div className="flex-shrink-0 w-10 h-10 rounded-lg overflow-hidden border bg-gray-50 dark:bg-gray-700 flex items-center justify-center">
          <img 
            src={faviconUrl} 
            alt={link.name} 
            className="w-full h-full object-cover" 
            // 确保图片加载失败时显示占位符
            onError={(e) => {
              e.target.onerror = null; 
              e.target.src = 'https://placehold.co/40x40/ccc/000?text=L'; 
            }} 
          />
        </div>
        <div className="min-w-0 flex-grow">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">{link.name}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5">{link.description}</p>
        </div>
        <ExternalLink className="w-4 h-4 text-gray-400 dark:text-gray-500" />
      </a>
    </div>
  );
};

// 🔹 公共主页
const PublicNav = ({ navData, searchTerm }) => {
    if (navData.length === 0 && searchTerm) {
        return (
            <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
                <Search className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-xl font-medium text-gray-600 dark:text-gray-300">
                    没有找到与 "{searchTerm}" 相关的链接。
                </p>
                <p className="text-gray-500 dark:text-gray-400 mt-2">请尝试其他关键词。</p>
            </div>
        );
    }

    if (navData.length === 0) {
        return (
            <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
                <Globe className="w-12 h-12 mx-auto text-blue-500 mb-4" />
                <p className="text-xl font-medium text-gray-600 dark:text-gray-300">
                    数据正在加载中...
                </p>
                <p className="text-gray-500 dark:text-gray-400 mt-2">如果长时间未显示，可能是网络连接受限，正在尝试加载本地备用数据。</p>
            </div>
        );
    }


    return (
        <div className="space-y-8 min-h-[60vh]">
            {navData.map(cat => (
                cat.links && cat.links.length > 0 && (
                    <div key={cat.id || cat.category} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm">
                        <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white border-l-4 border-blue-500 pl-3">{cat.category}</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {cat.links.map(link => <LinkCard key={link.id || link.url} link={link} />)}
                        </div>
                    </div>
                )
            ))}
        </div>
    );
};

// 🔹 链接表单 (管理面板内部使用) - 保持不变
const LinkForm = ({ links, setLinks }) => {
  const handleChange = (index, field, value) => {
    const newLinks = [...links];
    newLinks[index][field] = value;
    setLinks(newLinks);
  };
  // 确保新增链接时带上 icon 字段
  const addLink = () => setLinks([...links, { name: '', url: '', description: '', icon: '' }]); 
  const removeLink = (index) => setLinks(links.filter((_, i) => i !== index));

  return (
    <div className="space-y-2">
      {links.map((l, idx) => (
        <div key={idx} className="flex space-x-2">
          <input placeholder="名称" value={l.name} onChange={e => handleChange(idx, 'name', e.target.value)} className="border p-1 rounded w-24 dark:bg-gray-700 dark:border-gray-600"/>
          <input placeholder="链接" value={l.url} onChange={e => handleChange(idx, 'url', e.target.value)} className="border p-1 rounded w-48 dark:bg-gray-700 dark:border-gray-600"/>
          <input placeholder="描述" value={l.description} onChange={e => handleChange(idx, 'description', e.target.value)} className="border p-1 rounded flex-1 dark:bg-gray-700 dark:border-gray-600"/>
          {/* 🚀 提示管理员：输入完整图片 URL (用于硬核修复) 或主域名 (用于子域名修正) */}
          <input placeholder="图标源(完整图片URL/主域名)" value={l.icon} onChange={e => handleChange(idx, 'icon', e.target.value)} className="border p-1 rounded w-32 dark:bg-gray-700 dark:border-gray-600"/> 
          <button onClick={() => removeLink(idx)} className="bg-red-500 text-white px-2 rounded hover:bg-red-600">删除</button>
        </div>
      ))}
      <button onClick={addLink} className="bg-blue-500 text-white px-3 py-1 rounded mt-1 hover:bg-blue-600">新增链接</button>
    </div>
  )
}

// 🔹 登录弹窗 (保持不变)
const LoginModal = ({ onClose, onLogin, error }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const handleSubmit = (e) => { e.preventDefault(); onLogin(email, password); };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md p-8 relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"><X className="w-6 h-6"/></button>
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100 flex items-center"><LogIn className="w-6 h-6 mr-3 text-blue-500"/>管理员登录</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="email" placeholder="邮箱" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" required/>
          <input type="password" placeholder="密码" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" required/>
          {error && <div className="text-sm p-3 bg-red-100 text-red-700 rounded-lg">{error}</div>}
          <button type="submit" className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg">登录</button>
        </form>
      </div>
    </div>
  );
};

// 🔹 管理面板 (保持不变)
const AdminPanel = ({ db, navData, fetchData }) => {
  const [newCategory, setNewCategory] = useState({ category: '', order: 0, links: [] });
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});
  const navCollection = collection(db, `artifacts/${APP_ID}/public/data/navData`);

  const handleAddCategory = async () => {
    if (!newCategory.category) return alert('请输入分类名称');
    await addDoc(navCollection, newCategory);
    setNewCategory({ category: '', order: 0, links: [] });
    fetchData();
  };
  const startEdit = (item) => { 
    // 确保 links 中的每个对象都有 icon 属性，避免编辑时出错
    const linksWithIcon = (item.links || []).map(l => ({...l, icon: l.icon || ''}));
    setEditId(item.id); 
    setEditData({...item, links: linksWithIcon}); 
  };
  const saveEdit = async () => { 
    // 过滤掉空的 icon 字段，保持数据库整洁
    const dataToSave = {
        ...editData,
        links: editData.links.map(l => ({
            ...l,
            icon: l.icon || undefined // 如果为空则不存入数据库
        }))
    };
    await updateDoc(doc(db, `artifacts/${APP_ID}/public/data/navData`, editId), dataToSave); 
    setEditId(null); 
    fetchData(); 
  };
  const handleDelete = async (id) => { 
    if(window.confirm(`确认删除分类: ${navData.find(d => d.id === id)?.category} 吗?`)) {
        await deleteDoc(doc(db, `artifacts/${APP_ID}/public/data/navData`, id)); 
        fetchData();
    }
  };

  return (
    <div className="mt-6 p-4 border rounded bg-gray-50 dark:bg-gray-800">
      <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">管理员面板 (完整 CRUD)</h3>
      <div className="p-4 mb-4 bg-white dark:bg-gray-700 rounded-lg shadow">
          <h4 className="font-semibold mb-2 text-gray-800 dark:text-gray-100">新增分类</h4>
          <div className="flex flex-col gap-3">
              <input placeholder="分类名" className="border p-2 rounded w-full dark:bg-gray-600 dark:border-gray-500" value={newCategory.category} onChange={e => setNewCategory({...newCategory, category:e.target.value})}/>
              <div className="flex items-center space-x-2">
                  <span className="text-gray-600 dark:text-gray-300">排序:</span>
                  <input type="number" placeholder="0" className="border p-2 rounded w-20 dark:bg-gray-600 dark:border-gray-500" value={newCategory.order} onChange={e => setNewCategory({...newCategory, order:Number(e.target.value)})}/>
              </div>
              <LinkForm links={newCategory.links} setLinks={(links)=>setNewCategory({...newCategory, links})}/>
              <button onClick={handleAddCategory} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 self-start">新增分类</button>
          </div>
      </div>
      
      <h4 className="font-semibold mb-2 text-gray-800 dark:text-white">现有分类</h4>
      {navData.map(item=>(
        <div key={item.id} className="border p-3 mb-3 rounded bg-white dark:bg-gray-700 shadow-sm">
          {editId === item.id ? (
            // 编辑状态
            <>
              <input className="border p-1 mb-2 rounded w-full dark:bg-gray-600 dark:border-gray-500" value={editData.category} onChange={e=>setEditData({...editData, category:e.target.value})}/>
              <div className="flex items-center space-x-2 mb-2">
                  <span className="text-gray-600 dark:text-gray-300">排序:</span>
                  <input type="number" className="border p-1 rounded w-20 dark:bg-gray-600 dark:border-gray-500" value={editData.order} onChange={e=>setEditData({...editData, order:Number(e.target.value)})}/>
              </div>
              <LinkForm links={editData.links} setLinks={(links)=>setEditData({...editData, links})}/>
              <div className="flex space-x-2 mt-3">
                <button onClick={saveEdit} className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600">保存</button>
                <button onClick={()=>setEditId(null)} className="bg-gray-400 text-white px-3 py-1 rounded hover:bg-gray-500">取消</button>
              </div>
            </>
          ) : (
            // 显示状态
            <>
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-bold text-gray-800 dark:text-gray-100">{item.category} (排序: {item.order})</h4>
                <div className="flex space-x-2">
                  <button onClick={()=>startEdit(item)} className="bg-yellow-500 text-white text-sm px-3 py-1 rounded hover:bg-yellow-600">编辑</button>
                  <button onClick={()=>handleDelete(item.id)} className="bg-red-500 text-white text-sm px-3 py-1 rounded hover:bg-red-600">删除</button>
                </div>
              </div>
              <ul className="ml-4 space-y-0.5 text-sm text-gray-600 dark:text-gray-300">
                {item.links?.map((l,idx)=><li key={idx} className="truncate">{l.name} - <span className="text-blue-500">{l.url}</span> {l.icon && <span className="text-xs text-green-500">(自定义图标源)</span>}</li>)}
              </ul>
            </>
          )}
        </div>
      ))}
    </div>
  );
};

// 🔹 外部搜索引擎配置 (保持不变)
const externalEngines = [
    { name: '百度', url: 'https://www.baidu.com/s?wd=', icon: 'https://www.baidu.com' },
    { name: '谷歌', url: 'https://www.google.com/search?q=', icon: 'https://www.google.com' },
    { name: '必应', url: 'https://www.bing.com/search?q=', icon: 'https://www.bing.com' },
];

// 🔹 外部搜索处理函数 (保持不变)
const handleExternalSearch = (engineUrl, query) => {
    if (query) {
        window.open(engineUrl + encodeURIComponent(query), '_blank');
    } else {
        const baseDomain = getHostname(engineUrl.split('?')[0]);
        if (baseDomain) {
            window.open(`https://${baseDomain}`, '_blank');
        }
    }
};

// 🔹 SearchInput 组件 (保持不变)
const SearchInput = React.memo(({ searchTerm, setSearchTerm }) => (
    <div className="relative">
        <input 
            type="text" 
            placeholder="搜索链接名称、描述或网址..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full py-3 pl-12 pr-4 text-lg border-2 border-blue-300 dark:border-gray-600 rounded-full focus:ring-4 focus:ring-blue-500/50 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all shadow-md"
        />
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-blue-500 dark:text-blue-400"/>
        {searchTerm && (
            <button 
                onClick={() => setSearchTerm('')} 
                className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 rounded-full text-gray-500 hover:text-gray-700 dark:hover:text-white"
                title="清空站内搜索"
            >
                <X className="w-5 h-5"/>
            </button>
        )}
    </div>
));

// 🔹 ExternalSearchButtons 组件 (保持不变)
const ExternalSearchButtons = React.memo(({ className, searchTerm }) => (
    <div className={className}>
        {externalEngines.map(engine => (
            <button
                key={engine.name}
                onClick={() => handleExternalSearch(engine.url, searchTerm)}
                title={`使用 ${engine.name} 搜索: ${searchTerm || '（无关键词）'}`}
                className={`p-2.5 rounded-full border border-gray-300 dark:border-gray-600 transition-shadow bg-white dark:bg-gray-800 hover:shadow-lg hover:scale-105`}
            >
                <img 
                    src={`https://www.google.com/s2/favicons?domain=${getHostname(engine.icon)}&sz=32`} 
                    alt={engine.name} 
                    className="w-6 h-6 rounded-full"
                />
            </button>
        ))}
    </div>
));

// 🔹 SearchLayout 组件 (保持不变)
const SearchLayout = React.memo(({ isAdmin, currentPage, searchTerm, setSearchTerm }) => {
    if (isAdmin || currentPage !== 'home') return null;

    return (
        <div className="mb-8 max-w-2xl mx-auto">
            {/* 站内搜索框 */}
            <SearchInput searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
            
            {/* 外部搜索按钮 (下方，居中) */}
            <ExternalSearchButtons 
                className="flex justify-center space-x-4 mt-4" 
                searchTerm={searchTerm} 
            />
        </div>
    );
});

// 🔹 关于本站页面组件 (保持不变)
const AboutPage = () => (
    <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg max-w-4xl mx-auto space-y-6 min-h-[60vh]">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white border-b pb-4 mb-4">关于第一象限 极速导航网</h2>
        <div className="space-y-4 text-gray-700 dark:text-gray-300">
            <h3 className="text-xl font-semibold text-blue-600 dark:text-blue-400">【站点功能】</h3>
            <p>
                本站致力于提供一个**简洁、快速、纯粹**的网址导航服务。我们精心筛选了常用、高效和高质量的网站链接，并将它们按类别清晰展示，旨在成为您日常网络冲浪的起点站。
            </p>
            <h3 className="text-xl font-semibold text-blue-600 dark:text-blue-400">【创设初衷：拒绝广告】</h3>
            <p>
                在信息爆炸的时代，许多导航网站充斥着干扰性的广告和推广内容，严重影响了用户体验和访问速度。**第一象限** 创建本站的初衷正是为了提供一个**零广告、零干扰**的净土。我们承诺，本站将永久保持简洁干净，只专注于网址导航这一核心功能。
            </p>
            <h3 className="text-xl font-semibold text-blue-600 dark:text-blue-400">【作者】</h3>
            <p>
                由 <span className="font-bold text-purple-600 dark:text-purple-400">第一象限</span> 独立设计与开发。
                <br/> 
                联系邮箱: 
                <a 
                    href="mailto:contact@example.com" 
                    className="text-blue-500 dark:text-blue-400 hover:underline ml-1"
                >
                    contact@example.com
                </a>
            </p>
        </div>
    </div>
);


// 🔹 免责声明页面组件 (保持不变)
const DisclaimerPage = () => (
    <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg max-w-4xl mx-auto space-y-6 min-h-[60vh]">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white border-b pb-4 mb-4">免责声明</h2>
        <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
            <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400">1. 内容准确性</h3>
            <p>
                本网站（第一象限 极速导航网）所提供的所有链接信息均来源于互联网公开信息或用户提交。本站会尽力确保信息的准确性和时效性，但不对信息的完整性、准确性、时效性或可靠性作任何形式的明示或暗示的担保。
            </p>
            <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400">2. 外部链接责任</h3>
            <p>
                本站提供的所有外部网站链接（包括但不限于导航网站、资源链接等）仅为方便用户访问而设置。本站对任何链接到的第三方网站的内容、政策、产品或服务不承担任何法律责任。用户点击并访问外部链接时，即表示自行承担由此产生的一切风险。
            </p>
            <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400">3. 法律法规遵守</h3>
            <p>
                用户在使用本站服务时，须承诺遵守当地所有适用的法律法规。任何用户利用本站从事违反法律法规的行为，均与本站无关，本站不承担任何法律责任。
            </p>
            <p className="pt-4 italic text-xs text-gray-500 dark:text-gray-400">
                使用本网站即表示您已阅读、理解、并同意本声明的所有内容。
            </p>
        </div>
    </div>
);


// 🔹 页脚组件 (保持不变)
const Footer = ({ setCurrentPage }) => {
  const currentYear = new Date().getFullYear();
  
  const footerLinks = [
    { name: '关于本站', action: () => setCurrentPage('about') },
    { name: '免责声明', action: () => setCurrentPage('disclaimer') },
  ];

  return (
    <footer className="mt-20 py-8 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 bg-opacity-50 dark:bg-opacity-50 backdrop-blur-sm">
      <div className="container mx-auto px-4 text-center">
        <div className="flex flex-col items-center space-y-4"> 
          
          <div className="text-center">
            <h3 
              className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 cursor-pointer inline-block" 
              onClick={() => setCurrentPage('home')}
            >
              第一象限
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              © {currentYear} 极速导航网. 保留所有权利.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-6">
            {footerLinks.map((link, idx) => (
              <a 
                key={idx}
                href="#"
                onClick={(e) => { e.preventDefault(); link.action(); }}
                className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 cursor-pointer"
              >
                {link.name}
              </a>
            ))}
            <div className="flex items-center space-x-4 pl-4 border-l border-gray-300 dark:border-gray-700 ml-2">
              <a href="#" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors" title="Github">
                <Github className="w-5 h-5" />
              </a>
              <a href="mailto:contact@example.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-500 transition-colors" title="Email">
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};


// 🔹 异步获取备用数据函数
const fetchFallbackData = async (setNavData) => {
    console.log("Attempting to fetch fallback data from /fallback-data.json...");
    try {
        // 直接从 public 目录加载 JSON 文件
        const response = await fetch('/fallback-data.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const fallbackData = await response.json();
        // 备用数据也需要排序
        fallbackData.sort((a, b) => (a.order || 0) - (b.order || 0));
        setNavData(fallbackData);
        console.log("Successfully loaded data from fallback-data.json");
    } catch (error) {
        console.error("Failed to load fallback data. Site will be empty.", error);
        setNavData([]); // Set to empty array if both fail
    }
};

// 🔹 主应用 (App 组件)
export default function App() {
  const [firebaseApp, setFirebaseApp] = useState(null);
  const [auth, setAuth] = useState(null);
  const [db, setDb] = useState(null);
  const [userId, setUserId] = useState(null);
  
  const [navData, setNavData] = useState(INITIAL_NAV_DATA); 
  const [isDark, setIsDark] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [loginError, setLoginError] = useState('');
  
  const [currentPage, setCurrentPage] = useState('home'); 
  const [searchTerm, setSearchTerm] = useState(''); 
  
  const [isFirebaseConnected, setIsFirebaseConnected] = useState(false);

  useEffect(()=>{
    const firebaseConfig = {
      apiKey: "AIzaSyAlkYbLP4jW1P-XRJtCvC6id8GlIxxY8m4",
      authDomain: "wangzhandaohang.firebaseapp.com",
      projectId: "wangzhandaohang",
      storageBucket: "wangzhandaohang.firebasestorage.app",
      messagingSenderId: "169263636408",
      appId: "1:169263636408:web:ee3608652b2872a539b94d",
    };
    const app = initializeApp(firebaseConfig);
    const _auth = getAuth(app);
    const _db = getFirestore(app);
    setFirebaseApp(app); setAuth(_auth); setDb(_db);

    const unsub = onAuthStateChanged(_auth, user=>{
      if(user) setUserId(user.uid);
      else { signInAnonymously(_auth).catch(console.error); setUserId('anonymous'); }
    });
    return unsub;
  },[]);

  const isAdmin = userId === ADMIN_USER_ID;

  useEffect(()=>{
    if(!db) return;
    const navCol = collection(db, `artifacts/${APP_ID}/public/data/navData`);
    
    // 🔔 订阅 Firebase 实时更新
    const unsub = onSnapshot(navCol, snapshot=>{
      const data = snapshot.docs.map(d=>({id:d.id,...d.data()}));
      data.sort((a,b)=>(a.order||0)-(b.order||0));
      
      if (data.length > 0 || isAdmin) { 
          setNavData(data);
          setIsFirebaseConnected(true); 
      }
      
    }, (error) => {
        console.warn("Firebase connection failed or blocked. Using fallback strategy.", error);
        setIsFirebaseConnected(false);
        // 🚀 降级策略：Firebase 失败时，尝试加载静态 JSON 文件
        fetchFallbackData(setNavData);
    });
    return unsub;
  },[db, isAdmin]); 

  const fetchData = async ()=>{
    if(!db) return;
    const navCol = collection(db, `artifacts/${APP_ID}/public/data/navData`);
    try {
        const snapshot = await getDocs(navCol);
        const data = snapshot.docs.map(d=>({id:d.id,...d.data()}));
        data.sort((a,b)=>(a.order||0)-(b.order||0));
        setNavData(data);
    } catch (error) {
        console.error("Admin fetch failed, falling back to JSON (if available):", error);
        // 管理员登录时，如果 Firebase 失败，也尝试加载备用数据
        fetchFallbackData(setNavData); 
    }
  };

  const handleLogin = async (email,password)=>{
    try {
      await signInWithEmailAndPassword(auth,email,password);
      setShowLogin(false); 
      setLoginError('');
      // 登录成功后强制重新拉取数据并更新 admin 视图
      await fetchData(); 
    } catch(e){ setLoginError(e.message); }
  };
  
  const filteredNavData = useMemo(() => {
    if (!searchTerm) {
      return navData; 
    }

    const lowerCaseSearchTerm = searchTerm.toLowerCase();

    return navData
      .map(category => {
        const filteredLinks = (category.links || []).filter(link => {
          const name = link.name?.toLowerCase() || '';
          const description = link.description?.toLowerCase() || '';
          const url = link.url?.toLowerCase() || '';

          return name.includes(lowerCaseSearchTerm) || 
                 description.includes(lowerCaseSearchTerm) ||
                 url.includes(lowerCaseSearchTerm);
        });

        return {
          ...category,
          links: filteredLinks,
        };
      })
      .filter(category => category.links.length > 0);
  }, [navData, searchTerm]);


  return (
    <div className={`flex flex-col min-h-screen ${isDark?'dark bg-gray-900 text-white':'bg-gray-50 text-gray-900'}`}>
      <DebugBar />
      {showLogin && <LoginModal onClose={()=>setShowLogin(false)} onLogin={handleLogin} error={loginError} />}
      <div className="container mx-auto px-4 py-8 flex-grow">
        
        {/* Header: 标题居中，按钮垂直堆叠的圆形图标 */}
        <header className="mb-12 relative">
            <h1 
                className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 cursor-pointer text-center"
                onClick={() => setCurrentPage('home')}
            >
                极速导航网
            </h1>
            
            {/* 按钮区域: 绝对定位到右上角, 垂直堆叠 */}
            <div className="flex flex-col gap-2 absolute top-0 right-0">
                {/* 切换主题按钮 (圆形) */}
                <button 
                    onClick={()=>setIsDark(!isDark)} 
                    className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    title="切换主题"
                >
                    {isDark?<Sun className="w-5 h-5"/>:<Moon className="w-5 h-5"/>}
                </button>
                {/* 管理员登录/退出按钮 (圆形, 使用 User 图标) */}
                {!isAdmin && (
                    <button 
                        onClick={() => setShowLogin(true)} 
                        className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                        title="管理员登录"
                    >
                        <User className="w-5 h-5"/> 
                    </button>
                )}
                {isAdmin && (
                    <button 
                        onClick={() => signOut(auth)} 
                        className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-red-500 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                        title="退出管理"
                    >
                        <User className="w-5 h-5"/> 
                    </button>
                )}
            </div>
        </header>
        
        {/* 搜索区域 */}
        <SearchLayout 
            isAdmin={isAdmin}
            currentPage={currentPage}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
        />
        
        {/* 核心内容渲染 */}
        {isAdmin ? (
            <AdminPanel db={db} navData={navData} fetchData={fetchData} />
        ) : (
            currentPage === 'home' ? (
                <PublicNav navData={filteredNavData} searchTerm={searchTerm} />
            ) : currentPage === 'about' ? (
                <AboutPage />
            ) : currentPage === 'disclaimer' ? (
                <DisclaimerPage />
            ) : (
                <PublicNav navData={filteredNavData} searchTerm={searchTerm} />
            )
        )}
      </div>
      
      <Footer setCurrentPage={setCurrentPage} />
    </div>
  )
}