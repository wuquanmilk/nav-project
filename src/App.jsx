import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updatePassword,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  onSnapshot,
  doc,
  addDoc,
  deleteDoc,
  updateDoc,
  setDoc, // ⭐️ 引入 setDoc (用于解决 No document to update 错误)
  getDocs,
  query,
} from 'firebase/firestore';
// 导入需要的图标
import { 
  ExternalLink, LogIn, X, Github, Mail, Globe, Search, User, UserPlus, Lock, CheckCircle, AlertTriangle,
  Cloud, Database, Bot, Play, Camera, Network, Server, ShoppingCart, Wand, Monitor, Wrench, Code, Clock
} from 'lucide-react'; 

// =========================================================================
// ⭐️ 稳健性增强 1: ErrorBoundary 组件
// =========================================================================
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error: error.message };
    }

    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary 捕获到错误:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '20px', border: '2px solid red', backgroundColor: '#fef2f2', color: '#b91c1c', borderRadius: '12px', margin: '20px 0' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>功能组件加载失败 (已捕获)</h3>
                    <p style={{ marginTop: '5px' }}>抱歉，此面板出现致命错误。应用的其他部分将保持正常。</p>
                    <details style={{ marginTop: '10px', fontSize: '0.875rem' }}>
                        <summary>查看详细错误 (开发环境可见)</summary>
                        <p>{this.state.error}</p>
                    </details>
                </div>
            );
        }
        return this.props.children;
    }
}

// 🔹 配置你的管理员 UID
const ADMIN_USER_ID = '6UiUdmPna4RJb2hNBoXhx3XCTFN2';
const APP_ID = 'default-app-id';

// 🔹 Firebase 集合路径常量
const PUBLIC_NAV_PATH = `artifacts/${APP_ID}/public/data/navData`;
const getUserNavPath = (uid) => `users/${uid}/navData`; 

// 🔥🔥🔥 您的导航数据：DEFAULT_NAV_DATA (已删除指定链接) 🔥🔥🔥
const DEFAULT_NAV_DATA = [
    {
        id: 'cat-1',
        category: '常用开发',
        order: 0,
        links: [
            // 已删除 HuggingFace, clawcloudrun, firebase, dpdns
            { name: 'github', url: 'https://github.com/', description: '全球最大的代码托管平台', icon: 'https://github.com/fluidicon.png' },
            { name: 'cloudflare', url: 'https://dash.cloudflare.com/', description: 'CDN 与网络安全服务控制台', icon: 'https://www.cloudflare.com/favicon.ico' },
            { name: 'Supabase', url: 'https://supabase.com/', description: '开源 Firebase 替代方案', icon: 'https://supabase.com/favicon.ico' },
        ],
    },
    {
        id: 'cat-2',
        category: 'AI大模型',
        order: 1,
        links: [
            { name: 'chatgpt', url: 'https://chatgpt.com/', description: 'OpenAI 对话模型', icon: 'https://chatgpt.com/favicon.ico' },
            { name: 'gemini', url: 'https://gemini.google.com/app', description: 'Google AI 应用', icon: 'https://gemini.google.com/favicon.ico' },
            { name: 'deepseek', url: 'https://www.deepseek.com/', description: '深度求索 AI 平台', icon: 'https://www.deepseek.com/favicon.ico' },
            { name: '阿里千问', url: 'https://chat.qwen.ai/', description: '阿里通义千问', icon: 'https://chat.qwen.ai/favicon.ico' },
            { name: '腾讯元宝', url: 'https://yuanbao.tencent.com/chat/naQivTmsDa', description: '腾讯混元大模型应用', icon: 'https://yuanbao.tencent.com/favicon.ico' },
            { name: '豆包', url: 'https://www.doubao.com/chat/', description: '字节跳动 AI', icon: 'https://www.doubao.com/favicon.ico' },
            { name: '即梦', url: 'https://jimeng.jianying.com/', description: '剪映 AI 创作工具', icon: 'https://jimeng.jianying.com/favicon.ico' },
            { name: '通义万相', url: 'https://tongyi.aliyun.com/wan/', description: '阿里文生图服务', icon: 'https://tongyi.aliyun.com/wan/favicon.ico' },
        ],
    },
    {
        id: 'cat-3',
        category: '影视娱乐',
        order: 2,
        links: [
            { name: '哔哩哔哩', url: 'https://bilibili.com', description: 'B 站视频分享社区', icon: 'https://www.bilibili.com/favicon.ico' },
            { name: 'youtube', url: 'https://youtube.com', description: '全球最大视频平台', icon: 'https://www.youtube.com/s/desktop/4f17f4b8/img/favicon_96x96.png' },
            { name: '爱奇艺', url: 'https://www.iqiyi.com', description: '国内视频播放平台', icon: 'https://www.iqiyi.com/favicon.ico' },
            { name: '在线音乐', url: 'https://music.eooce.com/', description: '免费在线音乐播放', icon: '' },
            { name: '视频下载', url: 'https://tubedown.cn/', description: '通用视频下载工具', icon: '' },
            { name: '星空音乐下载', url: 'https://www.vh.hk/', description: '音乐下载工具', icon: '' },
            { name: 'instagram', url: 'https://www.instagram.com/', description: '图片与短视频分享社区', icon: 'https://www.instagram.com/static/images/ico/favicon.ico/31604a141b77.ico' },
            { name: '快手', url: 'https://www.kuaishou.com/', description: '短视频分享平台', icon: 'https://www.kuaishou.com/favicon.ico' },
            { name: '抖音', url: 'https://www.douyin.com/', description: '国内短视频平台', icon: 'https://www.douyin.com/favicon.ico' },
            // 已删除 TikTok
            { name: 'Snapchat', url: 'https://www.snapchat.com/', description: '阅后即焚社交应用', icon: 'https://www.snapchat.com/favicon.ico' },
        ],
    },
    {
        id: 'cat-4',
        category: 'IP检测 地址生成',
        order: 3,
        links: [
            { name: 'browserscan', url: 'https://www.browserscan.net/zh', description: '浏览器指纹与安全检测', icon: 'https://www.browserscan.net/favicon.ico' },
            { name: 'ping0', url: 'https://ping0.cc/', description: '网络延迟与连通性监测', icon: 'https://ping0.cc/favicon.ico' },
            { name: '真实地址生成器', url: 'https://address.nnuu.nyc.mn/', description: '随机地址生成工具', icon: '' },
            { name: 'Itdog', url: 'https://www.itdog.cn/tcping', description: '网络延迟和丢包检测', icon: 'https://www.itdog.cn/favicon.ico' },
            { name: 'IP地址查询', url: 'https://ip.ssss.nyc.mn/', description: 'IP 地址归属地查询', icon: '' },
        ],
    },
    {
        id: 'cat-5',
        category: '搜索引擎',
        order: 4,
        links: [
            { name: '百度', url: 'https://baidu.com', description: '中文搜索引擎', icon: 'https://www.baidu.com/favicon.ico' }, 
            { name: '谷歌', url: 'https://google.com', description: '全球最大搜索引擎', icon: 'https://icons.duckduckgo.com/ip3/google.com.ico' },
            { name: '必应', url: 'https://bing.com', description: '微软旗下搜索引擎', icon: 'https://www.bing.com/sa/simg/favicon-2x.ico' },
        ],
    },
    {
        id: 'cat-6',
        category: '云计算',
        order: 5,
        links: [
            { name: 'AWS', url: 'https://aws.amazon.com/', description: '亚马逊云服务', icon: 'https://a0.awsstatic.com/main/images/site/touch-icon-180x180.png' },
            { name: 'Azure', url: 'https://azure.microsoft.com/', description: '微软云服务', icon: 'https://azure.microsoft.com/favicon.ico' },
            { name: '阿里云', url: 'https://www.aliyun.com/', description: '阿里巴巴云服务', icon: 'https://www.aliyun.com/favicon.ico' },
            { name: '腾讯云', url: 'https://cloud.tencent.com/', description: '腾讯云服务', icon: 'https://cloud.tencent.com/favicon.ico' },
            { name: '华为云', url: 'https://www.huaweicloud.com/', description: '华为云服务', icon: 'https://www.huaweicloud.com/favicon.ico' },
            { name: 'Oracle Cloud', url: 'https://www.oracle.com/cloud/', description: '甲骨文云服务', icon: 'https://www.oracle.com/asset/ctx/design/images/favicon.ico' },
            { name: 'IBM Cloud', url: 'https://www.ibm.com/cloud', description: 'IBM 云服务', icon: 'https://www.ibm.com/favicon.ico' },
        ],
    },
    {
        id: 'cat-7',
        category: '工具箱',
        order: 6,
        links: [
            { name: '在线工具网', url: 'https://tool.lu/', description: '程序员综合在线工具', icon: 'https://tool.lu/favicon.ico' },
            { name: 'Py混淆', url: 'https://freecodingtools.org/tools/obfuscator/python', description: 'Python 代码混淆工具', icon: '' },
            { name: '二维码生成', url: 'https://cli.im/', description: '在线二维码制作', icon: 'https://cli.im/favicon.ico' },
            { name: 'Argo Tunnel json获取', url: 'https://fscarmen.cloudflare.now.cc/', description: 'Cloudflare Argo Tunnel 配置工具', icon: '' },
            { name: 'base64转换', url: 'https://www.qqxiuzi.cn/bianma/base64.htm', description: 'Base64 编解码转换', icon: 'https://www.qqxiuzi.cn/favicon.ico' },
            { name: '一键抠图', url: 'https://remove.photos/zh-cn/', description: 'AI 图片背景移除', icon: 'https://remove.photos/favicon.ico' },
            { name: '网址缩短', url: 'https://short.ssss.nyc.mn/', description: '链接缩短服务', icon: '' },
            { name: 'flexclip', url: 'https://www.flexclip.com/cn/ai/', description: 'AI 视频制作与编辑', icon: 'https://www.flexclip.com/favicon.ico' },
            { name: 'Js混淆', url: 'https://obfuscator.io/', description: 'JavaScript 代码混淆器', icon: 'https://obfuscator.io/favicon.ico' },
            { name: '文件格式转换', url: 'https://convertio.co/zh/', description: '在线文件格式转换', icon: 'https://convertio.co/favicon.ico' },
            { name: '第一工具网', url: 'https://d1tools.com/', description: '综合在线工具集合', icon: 'https://d1tools.com/favicon.ico' },
            { name: 'PHP混淆加密', url: 'https://www.toolnb.com/tools/phpcarbylamine.html', description: 'PHP 代码加密与混淆', icon: 'https://www.toolnb.com/favicon.ico' },
            { name: 'json工具', url: 'https://www.json.cn/', description: 'JSON 格式化与校验', icon: 'https://www.json.cn/favicon.ico' },
            // 已删除 网站打包app
            { name: 'Emoji 表情大全', url: 'https://www.iamwawa.cn/emoji.html', description: 'Emoji 符号查找', icon: 'https://www.iamwawa.cn/favicon.ico' },
        ],
    },
    {
        id: 'cat-8',
        category: 'IP代理',
        order: 7,
        links: [
            { name: '在线代理', url: 'https://www.proxyshare.com/zh/proxysite', description: '免费在线代理服务', icon: 'https://www.proxyshare.com/favicon.ico' },
            { name: '免费网络代理', url: 'https://www.lumiproxy.com/zh-hans/online-proxy/proxysite/', description: '免费代理服务', icon: 'https://www.lumiproxy.com/favicon.ico' },
        ],
    },
    {
        id: 'cat-9',
        category: '电商平台',
        order: 8,
        links: [
            { name: '淘宝网', url: 'https://taobao.com', description: '国内大型综合购物网站', icon: 'https://www.taobao.com/favicon.ico' },
            { name: '京东商城', url: 'https://jd.com', description: '国内知名自营电商', icon: 'https://www.jd.com/favicon.ico' },
            // 已删除 亚马逊
        ],
    },
];

const DebugBar = () => null;

// =========================================================================
// ⬇️ 图标映射和处理逻辑 ⬇️
// =========================================================================

const ICON_MAP = {
    // 已删除 huggingface, clawcloudrun, firebase, dpdns
    'github': Github,
    'cloudflare': Cloud,
    'supabase': Database,
    'chatgpt': Bot,
    'gemini': Wand, 
    'deepseek': Bot,
    '阿里千问': Bot,
    '腾讯元宝': Bot,
    '豆包': Bot,
    '即梦': Wand,
    '通义万相': Wand,
    '哔哩哔哩': Play,
    'youtube': Play,
    '爱奇艺': Monitor,
    '在线音乐': Play,
    '视频下载': Monitor,
    '星空音乐下载': Play,
    'instagram': Camera,
    '快手': Camera,
    '抖音': Camera, 
    // 已删除 tiktok
    'snapchat': Camera,
    'browserscan': Network,
    'ping0': Network,
    '真实地址生成器': Network,
    'itdog': Network,
    'ip地址查询': Network,
    '谷歌': Search,
    '百度': Search,
    '必应': Search,
    'aws': Server,
    'azure': Server,
    '阿里云': Server,
    '腾讯云': Server,
    '华为云': Server,
    'oracle cloud': Database,
    'ibm cloud': Database,
    '在线工具网': Wrench, 
    'py混淆': Wrench,
    '二维码生成': Wrench,
    'argo tunnel json获取': Wrench,
    'base64转换': Wrench,
    '一键抠图': Wand, 
    '网址缩短': Wrench,
    'flexclip': Wand,
    'js混淆': Wrench,
    '文件格式转换': Wrench,
    '第一工具网': Wrench,
    'php混淆加密': Wrench,
    'json工具': Wrench, 
    'emoji 表情大全': Wrench,
    // 已删除 网站打包app
    '在线代理': Network,
    '免费网络代理': Network,
    '淘宝网': ShoppingCart,
    '京东商城': ShoppingCart,
    // 已删除 亚马逊
};

const DefaultFallbackIcon = Globe; 

const getLucideIcon = (linkName) => {
    const key = linkName.toLowerCase().replace(/\s/g, ''); 
    const IconComponent = ICON_MAP[key];
    return IconComponent || DefaultFallbackIcon;
};

const LinkIcon = ({ link }) => {
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        setHasError(false);
    }, [link.url, link.icon]);

    const imageUrl = useMemo(() => {
        if (link.icon) {
            return link.icon;
        }

        try {
            const urlToParse = link.url;
            const urlObj = new URL(urlToParse);
            return `https://icons.duckduckgo.com/ip3/${urlObj.hostname}.ico`;
        } catch {
            return ''; 
        }
    }, [link.icon, link.url]);
    
    const FallbackIconComponent = getLucideIcon(link.name); 
    
    return (
        <div className="flex-shrink-0 w-10 h-10 rounded-lg overflow-hidden border bg-gray-50 dark:bg-gray-700 flex items-center justify-center">
            {hasError || !imageUrl ? (
                <FallbackIconComponent className="w-6 h-6 text-blue-500 dark:text-blue-400"/>
            ) : (
                <img 
                    src={imageUrl} 
                    alt={link.name} 
                    className="w-6 h-6 object-contain"
                    onError={() => setHasError(true)} 
                    loading="lazy"
                />
            )}
        </div>
    );
};

// 🔹 链接卡片 
const LinkCard = ({ link }) => {
  return (
    <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-xl shadow-md flex flex-col h-full 
    border border-gray-200 dark:border-gray-600 
    hover:shadow-lg hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-300">
      <a href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-4 flex-grow">
        
        <LinkIcon link={link} /> 

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

    return (
        <div className="space-y-8 min-h-[60vh]">
            {navData.map(cat => (
                cat.links && cat.links.length > 0 && (
                    <div key={cat.id || cat.category} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-shadow duration-300">
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

// 🔹 链接表单
const LinkForm = ({ links, setLinks }) => {
  const handleChange = (index, field, value) => {
    const newLinks = [...links];
    newLinks[index][field] = value;
    setLinks(newLinks);
  };
  const addLink = () => setLinks([...links, { name: '', url: '', description: '', icon: '' }]); 
  const removeLink = (index) => setLinks(links.filter((_, i) => i !== index));

  return (
    <div className="space-y-2 text-sm"> 
      {links.map((l, idx) => (
        <div key={idx} className="flex flex-wrap items-center gap-2 border p-2 rounded dark:border-gray-600">
          <input placeholder="名称" value={l.name} onChange={e => handleChange(idx, 'name', e.target.value)} className="border p-1 rounded w-20 dark:bg-gray-700 dark:border-gray-600"/>
          <input placeholder="链接" value={l.url} onChange={e => handleChange(idx, 'url', e.target.value)} className="border p-1 rounded w-32 dark:bg-gray-700 dark:border-gray-600"/>
          <input placeholder="描述" value={l.description} onChange={e => handleChange(idx, 'description', e.target.value)} className="border p-1 rounded w-32 dark:bg-gray-700 dark:border-gray-600"/>
          <input placeholder="图标 URL (可选)" value={l.icon} onChange={e => handleChange(idx, 'icon', e.target.value)} className="border p-1 rounded flex-1 min-w-[150px] dark:bg-gray-700 dark:border-gray-600"/>
          
          <button onClick={() => removeLink(idx)} className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 flex-shrink-0">删除</button>
        </div>
      ))}
      <button onClick={addLink} className="bg-blue-500 text-white px-3 py-1 rounded mt-1 hover:bg-blue-600">新增链接</button>
    </div>
  )
}

// 🔹 密码修改弹窗
const ChangePasswordModal = ({ onClose, onChangePassword, error, success }) => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        try {
            if (newPassword.length < 6) {
                throw new Error("密码长度不能少于 6 位。");
            }
            if (newPassword !== confirmPassword) {
                throw new Error("两次输入的密码不一致。");
            }
            onChangePassword(newPassword);
            setNewPassword('');
            setConfirmPassword('');
        } catch (e) {
            onChangePassword(null, e.message); 
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[9999] p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md p-8 relative">
                <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"><X className="w-6 h-6"/></button>
                <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100 flex items-center"><Lock className="w-6 h-6 mr-3 text-blue-500"/>修改密码</h2>
                
                {success && (
                    <div className="text-sm p-3 bg-green-100 text-green-700 rounded-lg flex items-center mb-4 dark:bg-green-800 dark:text-green-200">
                        <CheckCircle className="w-5 h-5 mr-2"/> {success}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="password" placeholder="新密码 (至少6位)" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" required/>
                    <input type="password" placeholder="确认新密码" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" required/>
                    
                    {error && (
                        <div className="text-sm p-3 bg-red-100 text-red-700 rounded-lg flex items-center dark:bg-red-800 dark:text-red-200">
                            <AlertTriangle className="w-5 h-5 mr-2"/> {error}
                        </div>
                    )}
                    
                    <button type="submit" className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg">确认修改</button>
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center">注意：为安全起见，修改密码后您可能需要重新登录。</p>
                </form>
            </div>
        </div>
    );
};

// 🔹 登录弹窗
const LoginModal = ({ onClose, onLogin, error, onForgotPassword }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const handleSubmit = (e) => { e.preventDefault(); onLogin(email, password); };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md p-8 relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"><X className="w-6 h-6"/></button>
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100 flex items-center"><LogIn className="w-6 h-6 mr-3 text-blue-500"/>用户/管理员登录</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="email" placeholder="邮箱" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" required/>
          <input type="password" placeholder="密码" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" required/>
          {error && <div className="text-sm p-3 bg-red-100 text-red-700 rounded-lg">{error}</div>}
          <button type="submit" className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg">登录</button>
          <a href="#" onClick={(e) => { e.preventDefault(); onForgotPassword(email); }} className="text-sm text-blue-500 hover:underline text-center mt-2 block dark:text-blue-400">忘记密码？</a>
        </form>
      </div>
    </div>
  );
};

// 🔹 注册弹窗
const RegisterModal = ({ onClose, onRegister, error }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        try {
             if (password.length < 6) {
                throw new Error("密码长度不能少于 6 位。");
            }
            if (password !== confirmPassword) {
                throw new Error("两次输入的密码不一致。");
            }
            onRegister(email, password); 
        } catch (e) {
            onRegister(null, null, e.message); 
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[9999] p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md p-8 relative">
                <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"><X className="w-6 h-6"/></button>
                <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100 flex items-center"><UserPlus className="w-6 h-6 mr-3 text-green-500"/>用户注册</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="email" placeholder="邮箱" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" required/>
                    <input type="password" placeholder="密码 (至少6位)" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" required/>
                    <input type="password" placeholder="确认密码" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" required/>
                    {error && <div className="text-sm p-3 bg-red-100 text-red-700 rounded-lg">{error}</div>}
                    <button type="submit" className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg">注册</button>
                </form>
            </div>
        </div>
    );
};

// 🔹 管理面板 (编辑公共数据)
const AdminPanel = ({ db, navData, fetchData }) => {
  const [newCategory, setNewCategory] = useState({ category: '', order: 0, links: [] });
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});
  const navCollection = collection(db, PUBLIC_NAV_PATH); 

  const handleAddCategory = async () => {
    try {
        if (!newCategory.category) return alert('请输入分类名称');
        const linksWithIcon = newCategory.links.map(link => ({...link, icon: link.icon || '' }));
        await addDoc(navCollection, {...newCategory, links: linksWithIcon});
        setNewCategory({ category: '', order: 0, links: [] });
        fetchData();
    } catch (error) {
        alert("新增公共分类失败：" + error.message);
        console.error("Error adding admin category:", error);
    }
  };
  const startEdit = (item) => { 
    const linksWithIcon = item.links ? item.links.map(link => ({...link, icon: link.icon || '' })) : [];
    setEditId(item.id); 
    setEditData({...item, links: linksWithIcon}); 
  };
  const saveEdit = async () => { 
    try {
        if (!editData.category) return alert('分类名称不能为空');
        const linksWithIcon = editData.links.map(link => ({...link, icon: link.icon || '' }));
        // ⭐️ 修复：使用 setDoc + merge 来处理 "文档可能不存在" 的情况
        await setDoc(doc(db, PUBLIC_NAV_PATH, editId), {...editData, links: linksWithIcon}, { merge: true }); 
        setEditId(null); 
        fetchData(); 
    } catch (error) {
        alert("保存公共分类失败：" + error.message);
        console.error("Error saving admin category:", error);
    }
  };
  const handleDelete = async (id) => { 
    if(window.confirm(`确认删除分类: ${navData.find(d => d.id === id)?.category} 吗?`)) {
        try {
            await deleteDoc(doc(db, PUBLIC_NAV_PATH, id)); 
            fetchData();
        } catch (error) {
            alert("删除公共分类失败：" + error.message);
            console.error("Error deleting admin category:", error);
        }
    }
  };

  return (
    <div className="mt-6 p-4 border rounded bg-gray-50 dark:bg-gray-800">
      <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">管理员面板 (编辑公共数据)</h3>
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
      
      <h4 className="font-semibold mb-2 text-gray-800 dark:text-white">现有公共分类</h4>
      {navData.map(item=>(
        <div key={item.id} className="border p-3 mb-3 rounded bg-white dark:bg-gray-700 shadow-sm">
          {editId === item.id ? (
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
            <>
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-bold text-gray-800 dark:text-gray-100">{item.category} (排序: {item.order})</h4>
                <div className="flex space-x-2">
                  <button onClick={()=>startEdit(item)} className="bg-yellow-500 text-white text-sm px-3 py-1 rounded hover:bg-yellow-600">编辑</button>
                  <button onClick={()=>handleDelete(item.id)} className="bg-red-500 text-white text-sm px-3 py-1 rounded hover:bg-red-600">删除</button>
                </div>
              </div>
              <ul className="ml-4 space-y-0.5 text-sm text-gray-600 dark:text-gray-300">
                {item.links?.map((l,idx)=><li key={idx} className="truncate">{l.name} - <span className="text-blue-500">{l.url}</span></li>)}
              </ul>
            </>
          )}
        </div>
      ))}
    </div>
  );
};

// 🔹 用户的自定义导航面板
const UserNavPanel = ({ db, userId, navData, fetchData }) => {
    const [newCategory, setNewCategory] = useState({ category: '', order: 0, links: [] });
    const [editId, setEditId] = useState(null);
    const [editData, setEditData] = useState({});
    
    const navCollection = collection(db, getUserNavPath(userId)); 

    const handleAddCategory = async () => {
      try {
        if (!newCategory.category) return alert('请输入分类名称');
        const linksWithIcon = newCategory.links.map(link => ({...link, icon: link.icon || '' }));
        await addDoc(navCollection, {...newCategory, links: linksWithIcon});
        setNewCategory({ category: '', order: 0, links: [] });
        fetchData(); 
      } catch (error) {
        alert("新增分类失败：" + error.message);
        console.error("Error adding user category:", error);
      }
    };

    const startEdit = (item) => { 
      const linksWithIcon = item.links ? item.links.map(link => ({...link, icon: link.icon || '' })) : [];
      setEditId(item.id); 
      setEditData({...item, links: linksWithIcon}); 
    };

    const saveEdit = async () => { 
      try {
        if (!editData.category) return alert('分类名称不能为空');
        const linksWithIcon = editData.links.map(link => ({...link, icon: editData.icon || '' }));
        // ⭐️ 修复：同样在用户面板使用 setDoc + merge
        await setDoc(doc(db, getUserNavPath(userId), editId), {...editData, links: linksWithIcon}, { merge: true }); 
        setEditId(null); 
        fetchData();
      } catch (error) {
        alert("保存编辑失败：" + error.message);
        console.error("Error saving user category:", error);
      }
    };
    
    const handleDelete = async (id) => { 
      if(window.confirm(`确认删除分类: ${navData.find(d => d.id === id)?.category} 吗?`)) {
          try {
              await deleteDoc(doc(db, getUserNavPath(userId), id)); 
              fetchData();
          } catch (error) {
              alert("删除失败：" + error.message);
              console.error("Error deleting user category:", error);
          }
      }
    };

    const hasCustomData = navData.length > 0 && navData.some(d => d.id && !d.id.startsWith('cat-'));

    return (
        <div className="mt-6 p-4 border rounded bg-gray-50 dark:bg-gray-800">
            <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">我的自定义导航面板 (仅您可见)</h3>
            
            {!hasCustomData && navData.length > 0 && (
                <div className="p-4 mb-4 bg-yellow-100 text-yellow-800 rounded-lg dark:bg-yellow-800 dark:text-yellow-100">
                    您尚未添加任何自定义链接。当前显示的是系统默认链接。请在下方添加您的专属分类。
                </div>
            )}

            <div className="p-4 mb-4 bg-white dark:bg-gray-700 rounded-lg shadow">
                <h4 className="font-semibold mb-2 text-gray-800 dark:text-gray-100">新增自定义分类</h4>
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
            
            <h4 className="font-semibold mb-2 text-gray-800 dark:text-white">现有导航分类</h4>
            {navData.map(item=>(
              <div key={item.id} className="border p-3 mb-3 rounded bg-white dark:bg-gray-700 shadow-sm">
                {editId === item.id ? (
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
                  <>
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-bold text-gray-800 dark:text-gray-100">{item.category} (排序: {item.order})</h4>
                      <div className="flex space-x-2">
                        <button onClick={()=>startEdit(item)} className="bg-yellow-500 text-white text-sm px-3 py-1 rounded hover:bg-yellow-600">编辑</button>
                        <button onClick={()=>handleDelete(item.id)} className="bg-red-500 text-white text-sm px-3 py-1 rounded hover:bg-red-600">删除</button>
                      </div>
                    </div>
                    <ul className="ml-4 space-y-0.5 text-sm text-gray-600 dark:text-gray-300">
                      {item.links?.map((l,idx)=><li key={idx} className="truncate">{l.name} - <span className="text-blue-500">{l.url}</span></li>)}
                    </ul>
                  </>
                )}
              </div>
            ))}
        </div>
    );
};

// 🔹 普通用户面板
const UserPanel = ({ userEmail, setShowChangePassword, setCurrentPage }) => {
    return (
        <div className="mt-6 p-6 border rounded-2xl bg-white dark:bg-gray-800 shadow-lg max-w-xl mx-auto min-h-[60vh]">
            <h3 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white flex items-center">
                <User className="w-6 h-6 mr-3 text-blue-500"/>我的账户
            </h3>
            
            <div className="space-y-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">当前登录邮箱:</p>
                    <p className="text-lg font-medium text-gray-900 dark:text-white break-all">{userEmail}</p>
                </div>

                <div className="pt-4 border-t dark:border-gray-700">
                    <p className="text-lg font-semibold mb-3 text-gray-800 dark:text-white">安全设置</p>
                    <button 
                        onClick={() => setShowChangePassword(true)} 
                        className="flex items-center space-x-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                    >
                        <Lock className="w-5 h-5"/>
                        <span>修改密码</span>
                    </button>
                    <button
                        onClick={() => setCurrentPage('home')}
                        className="flex items-center space-x-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors mt-3"
                    >
                        <Globe className="w-5 h-5"/>
                        <span>返回导航主页</span>
                    </button>
                </div>
            </div>
            
        </div>
    );
};

// 🔹 辅助组件：网站运行时间计时器
const SiteRuntime = () => {
    const [timeStr, setTimeStr] = useState('加载中...');

    useEffect(() => {
        // ⭐️ 请在此修改建站日期 (格式: YYYY-MM-DD)
        const START_DATE = '2024-01-01'; 
        
        const updateTime = () => {
            const start = new Date(START_DATE);
            const now = new Date();
            const diff = now - start;

            if (diff < 0) {
                setTimeStr('筹备中...');
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            
            // 如果只需要显示天数：
            setTimeStr(`${days} 天`);
        };

        updateTime(); // 立即执行一次
        const timer = setInterval(updateTime, 1000 * 60); // 每分钟更新一次即可
        return () => clearInterval(timer);
    }, []);

    return (
        <span className="font-mono font-medium text-blue-600 ml-1">
            {timeStr}
        </span>
    );
};

// 🔹 页脚组件 
const Footer = ({ setCurrentPage }) => {
  const currentYear = new Date().getFullYear();
  
  const footerLinks = [
    { name: '关于本站', action: () => setCurrentPage('about') },
    { name: '免责声明', action: () => setCurrentPage('disclaimer') },
  ];

  return (
    <footer className="mt-20 py-8 border-t border-gray-200 bg-white bg-opacity-50 backdrop-blur-sm">
      <div className="container mx-auto px-4 text-center">
        <div className="flex flex-col items-center space-y-4"> 
          
          <div className="text-center">
            <h3 
              className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 cursor-pointer inline-block" 
              onClick={() => setCurrentPage('home')}
            >
              第一象限
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              © {currentYear} 极速导航网. 保留所有权利.
            </p>
            {/* ⭐️ 新增：稳定运行时间显示 */}
            <p className="text-xs text-gray-400 mt-1 flex items-center justify-center">
               <Clock className="w-3 h-3 mr-1"/> 本站已稳定运行 <SiteRuntime />
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-6">
            {footerLinks.map((link, idx) => (
              <a 
                key={idx}
                href="#"
                onClick={(e) => { e.preventDefault(); link.action(); }}
                className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors duration-200 cursor-pointer"
              >
                {link.name}
              </a>
            ))}
            
            <div className="flex items-center space-x-4 pl-4 border-l border-gray-300 ml-2">
              <a href="https://github.com/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-800 transition-colors" title="Github">
                <Github className="w-5 h-5" />
              </a>
              <a href="https://adcwwvux.eu-central-1.clawcloudrun.com/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-500 transition-colors" title="Claw Cloud Run">
                <Globe className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

// 🔹 关于本站页面组件
const AboutPage = () => (
    <div className="bg-white p-8 rounded-2xl shadow-lg max-w-4xl mx-auto space-y-6 min-h-[60vh]">
        <h2 className="text-3xl font-bold text-gray-900 border-b pb-4 mb-4">关于第一象限 极速导航网</h2>
        <div className="space-y-4 text-gray-700">
            <h3 className="text-xl font-semibold text-blue-600">【站点功能】</h3>
            <p>
                本站致力于提供一个**简洁、快速、纯粹**的网址导航服务。我们精心筛选了常用、高效和高质量的网站链接，并将它们按类别清晰展示，旨在成为您日常网络冲浪的起点站。
            </p>
            <h3 className="text-xl font-semibold text-blue-600">【创设初衷：拒绝广告】</h3>
            <p>
                在信息爆炸的时代，许多导航网站充斥着干扰性的广告和推广内容，严重影响了用户体验和访问速度。**第一象限** 创建本站的初衷正是为了提供一个**零广告、零干扰**的净土。我们承诺，本站将永久保持简洁干净，只专注于网址导航这一核心功能。
            </p>
            <h3 className="text-xl font-semibold text-blue-600">【作者】</h3>
            <p>
                由 <span className="font-bold text-purple-600">第一象限</span> 独立设计与开发。
                <br/> 
                联系邮箱: 
                <a 
                    href="mailto:115382613@qq.com" 
                    className="text-blue-500 hover:underline ml-1"
                >
                    115382613@qq.com
                </a>
            </p>
        </div>
    </div>
);


// 🔹 免责声明页面组件 
const DisclaimerPage = () => (
    <div className="bg-white p-8 rounded-2xl shadow-lg max-w-4xl mx-auto space-y-6 min-h-[60vh]">
        <h2 className="text-3xl font-bold text-gray-900 border-b pb-4 mb-4">免责声明</h2>
        <div className="space-y-4 text-sm text-gray-700">
            <h3 className="text-lg font-semibold text-blue-600">1. 内容准确性</h3>
            <p>
                本网站（第一象限 极速导航网）所提供的所有链接信息均来源于互联网公开信息或用户提交。本站会尽力确保信息的准确性和时效性，但不对信息的完整性、准确性、时效性或可靠性作任何形式的明示或暗示的担保。
            </p>
            <h3 className="text-lg font-semibold text-blue-600">2. 外部链接责任</h3>
            <p>
                本站提供的所有外部网站链接（包括但不限于导航网站、资源链接等）仅为方便用户访问而设置。本站对任何链接到的第三方网站的内容、政策、产品或服务不承担任何法律责任。用户点击并访问外部链接时，即表示自行承担由此产生的一切风险。
            </p>
            <h3 className="text-lg font-semibold text-blue-600">3. 法律法规遵守</h3>
            <p>
                用户在使用本站服务时，须承诺遵守当地所有适用的法律法规。任何用户利用本站从事违反法律法规的行为，均与本站无关，本站不承担任何法律责任。
            </p>
            <h3 className="text-lg font-semibold text-blue-600">4. 图标与版权声明</h3>
            <p>
                本站网址图标有些因为网络原因、技术缺陷，可能导致图标显示不准确。如果涉及侵权，请联系作者删除。作者邮箱：<span className="font-bold">115382613@qq.com</span>
            </p>
            <p className="pt-4 italic text-xs text-gray-500">
                使用本网站即表示您已阅读、理解并同意本声明的所有内容。
            </p>
        </div>
    </div>
);

// 🔹 外部搜索引擎配置
const externalEngines = [
  { name: '百度', url: 'https://www.baidu.com/s?wd=', icon: 'https://www.baidu.com/favicon.ico' }, 
{ 
    name: '谷歌', 
    url: 'https://www.google.com/search?q=', 
    // ⭐️ 硬编码 Base64 Google Logo (SVG) 解决国内加载失败问题
    icon: 'data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMTggMTgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJhIiB4MT0iMCIgeDI9IjI0LjUiIHkxPSIwIiB5Mj0iMCIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPjxzdG9wIG9mZnNldD0iMCIgc3RvcC1jb2xvcj0iIzQyODVmNCIvPjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iIzVhNWZhNiIvPjwvZGVmcz48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImIiIHgxPSIxMy41IiB4Mj0iMTcuMjUiIHkxPSIxMC41IiB5Mj0iMTAuNSIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPjxzdG9wIG9mZnNldD0iMCIgc3RvcC1jb2xvcj0iIzM0YTg1MyIvPjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iIzRmYjQ1ZSIvPjwvZGVmcz48cGF0aCBkPSJtOSAwYzkgMCA5IDQuMDMgMCA5LTQuMDMgOS05LTQuMDMtOS05LTAzem0tLjgyNSAxNC42MjVjLS4xNS4xMjUtLjI1LjI1LS40LjI1LS4xMjUuMDc1LS4yNzUuMTI1LS40NS4xMjVoLS4wMjVjLS4xNzUgMC0uMzUtLjA1LS41LS4xMjVhLjk3Mi45NzIgMCAwIDEtLjQtLjI1Yy0uMTI1LS4xMjUtLjIzNS0uMjUtLjQtLjI1aC0uMmMtLjIyNSAwLS41LjA1LS42MjUuMTI1LS4yLjExMi0uNDEuMzItLjYzLjYxMi0uNDQuNjItLjk4NSAxLjM1LTEuNzY1IDEuOTItLjYuNDM3LTEuMy44NC0yLjEgMS4yNzVsLS41MjUuMjYyYy0uMS4wNS0uMjUuMDgtLjQuMDgtLjYyNSAwaC0uN2MwLS40Ny40Ny0uOTQuNjktMS4xMi4yMjUtLjE2Mi43LS41MyAxLjA1LTEuMDMuOTctMS4zNC44Mi0yLjctLjI3LTMuNjY1LS4xMjUtLjEwNS0uMjQ1LS4yMDUtLjM5NS0uMjk1LS4zNzUtLjIzLS44Mi0uNDUtMS4yNy0uNTI1LS41LS4xMDUtMS4wNTctLjE3NS0xLjY3LS4xNzVoLS4yYzAtLjQgLjI0LS43Ny40MS0uOTkuMjItLjI2LjU5LS41NC45Mi0uNzUuODEtLjU4IDEuNi0xLjMgMi40NS0xLjkuMTUtLjE1LjI1LS4yNzUuNC0uMzI1LjEuMDMuMzIuMS40MjUuMTI1LjEyNS4wNS4yNS4wOC40LjA3NS4xMjUgMCAuMjUtLjAyNS40LS4wNzUuMTA1LS4wMjUuMjA1LS4wNzUuMy0uMTA1LjA3NS0uMDcuMTc1LS4xNy4yMi0uMjZsLjY1LS40LjctLjQ3LjU3NS0uNC41LS4zMjVjLjY3NS0uNDI1IDEuNTE1LS42NzUgMi4yMS0uNjcuNzUgMCAxLjU2LjI3IDIuMzIuODEuNzYuNTQgMS4yIDIuMTUgMS4zNiAzLjIuMTkgMS4yLjE5IDIuNS0uMDcgMy42LS42MyAyLjYtMi44IDQuNzYtNS41MyA0LjcyeiIgZmlsbD0idXJsKCNhKSIvPjxwYXRoIGQ9Im0xMi4wMjUgMy4zMjVjLjcyLjQ5IDEuNDQuOTkgMi4wNSAxLjU5LjIyLjIyLjQ2LjQ1LjY4LjY4Ljc5LjgyIDEuMzggMS43IDEuNTQgMi41LS41LS4wNS0xLjEtLjA3NS0xLjctLjA1LS41NyAwLTEuMTQuMDctMS42OC4yYTIuODU2IDIuODU2IDAgMCAwLTEuNDYuNzNjLS43LjQyLTEuMS45NC0xLjIgMS41LS4yOC4yMi0uNTguNDUtLjg2LjY4LS4yOS4yMi0uNTkuNDUtLjg5LjY4LS4xMi4wOC0uMjEuMTU1LS4zMS4yMjUtLjIyNS4xNzUtLjQ1LjMtLjY3NS4zODVhLjI0NC4yNDQgMCAwIDEtLjEuMDJjLS4xNzUuMDUtLjMgLjEtLjQuMTVsLjg1LS4xYzIuNjMtLjM3IDQuMTItMi4zNSA1LjItNS4wOC4zNS0uODcuNTEtMS44Ni41LTEuNjUuMTUtLjMgLjMyLS41OC40OS0uODZsLjQyLS40OGMuMzgtLjI3NS43Mi0uNTYgMS4wNy0uODQuMjctLjIyNS41Mi0uNDcuNzMtLjcyNS4wMi0uMDI1LjAyNS0uMDUgMC0uMDc1LS4wNS0uMDc1LS4xMS0uMTUtLjE2LS4yMjUtLjIyLS4zMi0uNDUtLjYyLS42Ny0uOTItLjM0LS40OS0uNzItLjk3LTEuMS0xLjQ1bC0uNDQtLjU3LS43Ni0xLjAyLS4xNzUtLjIyNWMtLjEtLjE1LS4xOTUtLjMtLjMtLjQyNWEyLjgzNSAyLjgzNSAwIDAgMC0yLjAzLTEuMWMtLjIgMC0uMzI1LjEtLjM3LjIuMjIuNi4zOCAxLjIuNTUgMS44bC4wNzUuMjIuNTI1LjMuNC4yNS4zLjE1IiBmaWxsPSIjZDkzMDI1Ii8+PHBhdGggZD0ibTQuMiAyLjEyNWMuODUuMzIgMS43LjY5IDIuNSAxLjA1LjIyLjA5LjM0LjIuMzguMzItLjEuMDUtLjI0LjE2LS4zNi4zNS0uMTQuMTgtLjMuNC0uNC42LS40MS45LS42NiAxLjg1LS42NyAyLjh MjQ2LjU4NCAxODQ1MjQuNiAzNTcwNi41NTEiIHZlcnNpb249IjEuMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNNTU2LjIxMyw2MjcuODQxYy03MC41NTQsMC0xMjguMjQ4LTY3LjM4OC0xMjguMjQ4LTExNS41OTQgYzAtNDguMjA2LDU3LjY5NC0xMTUuNTk1LDEyOC4yNDgtMTE1LjU5NSBjNzAuNTUzLDAsMTI4LjI0OCw2Ny4zODksMTI4LjI0OCwxMTUuNTk1IEM2ODQuNDYxLDU2MC40NTMsNjI2Ljc2Niw2MjcuODQxLDU1Ni4yMTMsNjI3Ljg0MXogTTU2My41ODYsNTM5LjU5MCBMNDczLjIyMywyNDMuNzYxIGw4OS4xMjItNjguMDMzIGw1OC45NTksMjc2LjM0MyBMMTAwNi44OTgsMzAwLjY1MiBMMTI4MC40MjYsMTIyLjY0bDM4Ny4yOTIsNDU3Ljk3OWwtMTE5LjA1LDI4NC40NDUgTDk3MC4xMTgsMTY2LjgyNSBMNTYzLjU4Niw1MzkuNTkweiIgZmlsbD0iIzQ4ODVFNCIvPjwvc3ZnPg==' 
}, // <--- 已硬编码为 Google 官方图标
  { name: '必应', url: 'https://www.bing.com/search?q=', icon: 'https://www.bing.com/sa/simg/favicon-2x.ico' },
];

const handleExternalSearch = (engineUrl, query) => {
  if (query) {
    window.open(engineUrl + encodeURIComponent(query), '_blank');
  } else {
    const baseDomain = new URL(engineUrl.split('?')[0]).origin;
    window.open(baseDomain, '_blank');
  }
};

const SearchInput = React.memo(({ searchTerm, setSearchTerm }) => (
    <div className="relative">
        <input 
            type="text" 
            placeholder="搜索链接名称、描述或网址..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full py-3 pl-12 pr-4 text-lg border-2 border-blue-300 rounded-full focus:ring-4 focus:ring-blue-500/50 focus:border-blue-500 bg-gray-700 text-white transition-all shadow-md"
        />
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-blue-500"/>
        {searchTerm && (
            <button 
                onClick={() => setSearchTerm('')} 
                className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 rounded-full text-gray-500 hover:text-gray-700"
                title="清空站内搜索"
            >
                <X className="w-5 h-5"/>
            </button>
        )}
    </div>
));

const ExternalSearchButton = ({ engine, searchTerm }) => {
    const [hasError, setHasError] = useState(false);
    const imageUrl = engine.icon; 
    const handleSearch = () => handleExternalSearch(engine.url, searchTerm);

    return (
        <button
            onClick={handleSearch}
            title={`使用 ${engine.name} 搜索: ${searchTerm || '（无关键词）'}`}
            className={`p-2.5 rounded-full border border-gray-300 transition-shadow bg-white hover:shadow-lg hover:scale-105 flex items-center justify-center`}
        >
            {hasError || !imageUrl ? (
                <Search className="w-6 h-6 text-gray-500" />
            ) : (
                <img 
                    src={imageUrl} 
                    alt={engine.name} 
                    className="w-6 h-6 rounded-full object-contain"
                    onError={() => setHasError(true)} 
                    loading="lazy"
                />
            )}
        </button>
    );
};

const ExternalSearchButtons = React.memo(({ className, searchTerm }) => (
    <div className={className}>
        {externalEngines.map(engine => (
            <ExternalSearchButton 
                key={engine.name} 
                engine={engine} 
                searchTerm={searchTerm} 
            />
        ))}
    </div>
));

const SearchLayout = React.memo(({ isAdmin, isUser, currentPage, searchTerm, setSearchTerm, isEditing }) => {
    if (isAdmin || isUser || currentPage !== 'home' || isEditing) return null; 

    return (
        <div className="mb-8 max-w-2xl mx-auto">
            <SearchInput searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
            <ExternalSearchButtons 
                className="flex justify-center space-x-4 mt-4" 
                searchTerm={searchTerm} 
            />
        </div>
    );
});

// 🔹 右下角浮动按钮组件 
const FloatingButtons = ({ userIsAnonymous, isAdmin, userEmail, handleLogout, setShowRegister, setShowLogin, setCurrentPage, currentPage, isEditing, setIsEditing }) => {
    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end space-y-3">
            
            {(isAdmin || !userIsAnonymous) && currentPage === 'home' && (
                <button 
                    onClick={() => setIsEditing(!isEditing)} 
                    className={`p-3 rounded-full shadow-xl text-white transition-all 
                                ${isEditing ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
                    title={isEditing ? "退出编辑模式 (切换到浏览主页)" : "进入编辑模式"}
                >
                    {isEditing ? <Wrench className="w-6 h-6"/> : <Wrench className="w-6 h-6"/>}
                </button>
            )}

            {userIsAnonymous ? (
              <>
                <button 
                    onClick={() => { setShowRegister(true); setShowLogin(false); }} 
                    className="p-3 rounded-full shadow-xl bg-green-500 text-white hover:bg-green-600 transition-all"
                    title="用户注册"
                >
                    <UserPlus className="w-6 h-6"/> 
                </button>
                <button 
                    onClick={() => { setShowLogin(true); setShowRegister(false); }} 
                    className="p-3 rounded-full shadow-xl bg-blue-500 text-white hover:bg-blue-600 transition-all"
                    title="用户/管理员登录"
                >
                    <User className="w-6 h-6"/> 
                </button>
              </>
            ) : (
              <>
                <button
                    onClick={() => { 
                        if (currentPage === 'user') {
                            setCurrentPage('home'); 
                        } else {
                            setCurrentPage('user'); 
                            setIsEditing(false);    
                        }
                    }} 
                    className={`p-3 rounded-full shadow-xl text-white transition-all 
                               ${isAdmin ? 'bg-purple-600 hover:bg-purple-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                    title={currentPage === 'user' ? `返回导航主页` : (isAdmin ? `管理员: ${userEmail}` : `用户中心: ${userEmail}`)}
                >
                    <User className="w-6 h-6"/> 
                </button>
                <button 
                    onClick={handleLogout} 
                    className="p-3 rounded-full shadow-xl bg-red-500 text-white hover:bg-red-600 transition-all"
                    title="退出登录"
                >
                    <LogIn className="w-6 h-6 rotate-180"/> 
                </button>
              </>
            )}
        </div>
    );
};


// 🔹 主应用 (App 组件)
export default function App() {
  const [firebaseApp, setFirebaseApp] = useState(null);
  const [auth, setAuth] = useState(null);
  const [db, setDb] = useState(null);
  
  const [userId, setUserId] = useState(null);
  const [userEmail, setUserEmail] = useState(''); 
  const [userIsAnonymous, setUserIsAnonymous] = useState(true); 
  
  const [navData, setNavData] = useState(DEFAULT_NAV_DATA); 
  const [currentPage, setCurrentPage] = useState('home'); 
  const [searchTerm, setSearchTerm] = useState(''); 
  const [isFirebaseConnected, setIsFirebaseConnected] = useState(false);
  const [isEditing, setIsEditing] = useState(false); 
  
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false); 
  
  const [loginError, setLoginError] = useState('');
  const [registerError, setRegisterError] = useState('');
  const [changePasswordError, setChangePasswordError] = useState(''); 
  const [changePasswordSuccess, setChangePasswordSuccess] = useState(''); 

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
      if(user) {
        setUserId(user.uid);
        setUserEmail(user.email || '匿名用户');
        setUserIsAnonymous(user.isAnonymous);
        setCurrentPage('home'); 
        setIsEditing(false); 
      } else { 
        signInAnonymously(_auth).catch(console.error); 
        setUserId('anonymous');
        setUserEmail('');
        setUserIsAnonymous(true);
        setCurrentPage('home'); 
        setIsEditing(false); 
      }
    });
    return unsub;
  },[]);

  const isAdmin = userId === ADMIN_USER_ID;
  const isUser = userId && userId !== 'anonymous' && !isAdmin; 

  useEffect(()=>{
    if(!db || !userId) {
        if (!db) {
            setNavData(DEFAULT_NAV_DATA);
        }
        return;
    }
    
    const targetPath = (isUser || isAdmin) && userId !== 'anonymous' 
        ? getUserNavPath(userId) 
        : PUBLIC_NAV_PATH;       
        
    const navCol = collection(db, targetPath); 
    
    const unsub = onSnapshot(navCol, snapshot=>{
      const data = snapshot.docs.map(d=>({id:d.id,...d.data()}));
      data.sort((a,b)=>(a.order||0)-(b.order||0));
      
      setIsFirebaseConnected(true); 
      if (data.length === 0 && (isUser || isAdmin)) {
          setNavData(DEFAULT_NAV_DATA); 
      } else if (data.length > 0) { 
          setNavData(data);
      } else if (!isFirebaseConnected) {
          setNavData(DEFAULT_NAV_DATA);
      }
      
    }, 
    (error) => {
        console.warn(`Firebase fetch failed for ${isUser ? 'user' : 'public'} data. Using internal fallback.`, error.message);
        setIsFirebaseConnected(false); 
        setNavData(DEFAULT_NAV_DATA);
    });
    return unsub;
},[db, userId, isAdmin, isUser]); 

  const fetchData = async ()=>{
    if(!db || !userId) return;
    const targetPath = isAdmin ? PUBLIC_NAV_PATH : getUserNavPath(userId);
    const navCol = collection(db, targetPath);
    try {
        const snapshot = await getDocs(navCol);
        const data = snapshot.docs.map(d=>({id:d.id,...d.data()}));
        data.sort((a,b)=>(a.order||0)-(b.order||0));
        setNavData(data);
    } catch (error) {
        console.error("Data fetch failed:", error);
    }
  };

  const handleRegister = async (email, password, customError) => {
    if (customError) {
        setRegisterError(customError);
        return;
    }
    setRegisterError('');
    try {
        await createUserWithEmailAndPassword(auth, email, password);
        setShowRegister(false);
        alert('注册成功！已自动登录。'); 
    } catch(e) { 
        setRegisterError(e.message); 
    }
  };
  
  const handleLogin = async (email,password)=>{
    setLoginError('');
    try {
      await signInWithEmailAndPassword(auth,email,password);
      setShowLogin(false); 
    } catch(e){ 
      setLoginError(e.message); 
    }
  };

  const handleForgotPassword = async (email) => {
      if (!email) {
          alert("请输入您的注册邮箱进行密码重置。");
          return;
      }
      try {
          await sendPasswordResetEmail(auth, email);
          alert(`密码重置链接已发送到邮箱: ${email}。请检查您的收件箱和垃圾邮件。`);
          setShowLogin(false);
      } catch (e) {
          alert(`重置邮件发送失败: ${e.message}`);
      }
  };
  
  const handleChangePassword = async (newPassword, customError) => {
      setChangePasswordError('');
      setChangePasswordSuccess('');

      if (customError) {
          setChangePasswordError(customError);
          return;
      }
      
      const user = auth.currentUser;
      if (!user) {
          setChangePasswordError('用户未登录。');
          return;
      }

      try {
          await updatePassword(user, newPassword);
          setChangePasswordSuccess('密码修改成功！您可能需要重新登录。');
      } catch (e) {
          if (e.code === 'auth/requires-recent-login') {
            setChangePasswordError('出于安全考虑，请先退出并重新登录，然后再尝试修改密码。');
          } else {
            setChangePasswordError(e.message);
          }
      }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUserId('anonymous');
    setUserEmail('');
    setIsEditing(false); 
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


  let content;

  if (currentPage === 'home') {
    if ((isAdmin || isUser) && isEditing) {
        if (isAdmin) {
            content = (
                <ErrorBoundary>
                    <AdminPanel db={db} navData={navData} fetchData={fetchData} />
                </ErrorBoundary>
            );
        } else { 
            content = (
                <ErrorBoundary>
                    <UserNavPanel 
                        db={db} 
                        userId={userId} 
                        navData={navData} 
                        fetchData={fetchData} 
                    />
                </ErrorBoundary>
            );
        }
    } else {
        content = <PublicNav navData={filteredNavData} searchTerm={searchTerm} />;
    }
  } else if (currentPage === 'user' && (isUser || isAdmin)) { 
      content = (
          <ErrorBoundary>
              <UserPanel 
                  userEmail={userEmail} 
                  setShowChangePassword={setShowChangePassword}
                  setCurrentPage={setCurrentPage} 
              />
          </ErrorBoundary>
      );
  } else if (currentPage === 'about') {
      content = <AboutPage />;
  } else if (currentPage === 'disclaimer') {
      content = <DisclaimerPage />;
  } else {
      content = <PublicNav navData={filteredNavData} searchTerm={searchTerm} />;
  }

  return (
    <div className={`flex flex-col min-h-screen bg-gray-50 text-gray-900`}>
      <DebugBar />
      
      {showLogin && <LoginModal onClose={()=>setShowLogin(false)} onLogin={handleLogin} error={loginError} onForgotPassword={handleForgotPassword}/>}
      {showRegister && <RegisterModal onClose={()=>setShowRegister(false)} onRegister={handleRegister} error={registerError} />}
      {showChangePassword && (
        <ChangePasswordModal 
          onClose={() => {setShowChangePassword(false); setChangePasswordError(''); setChangePasswordSuccess('');}} 
          onChangePassword={handleChangePassword} 
          error={changePasswordError}
          success={changePasswordSuccess}
        />
      )}
      
      <FloatingButtons 
        userIsAnonymous={userIsAnonymous}
        isAdmin={isAdmin}
        userEmail={userEmail}
        handleLogout={handleLogout}
        setShowRegister={setShowRegister}
        setShowLogin={setShowLogin}
        setCurrentPage={setCurrentPage}
        currentPage={currentPage}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
      />
      
      <div className="container mx-auto px-4 py-8 flex-grow">
        
        <header className="mb-12 relative">
            <h1 
                className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 cursor-pointer text-center"
                onClick={() => setCurrentPage('home')}
            >
                极速导航网
            </h1>
        </header>
        
        <SearchLayout 
            isAdmin={isAdmin}
            isUser={isUser}
            currentPage={currentPage}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            isEditing={isEditing}
        />
        
        {content} 
      </div>
      
      <Footer setCurrentPage={setCurrentPage} />
    </div>
  )
}