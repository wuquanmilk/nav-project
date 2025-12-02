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
import { 
  ExternalLink, Moon, Sun, LogIn, X, Github, Mail, Globe, Search, User,
  Cloud, Database, Bot, Play, Camera, Network, Server, ShoppingCart, Wand, Monitor, Wrench, Code
} from 'lucide-react'; 

// 🔹 配置你的管理员 UID
const ADMIN_USER_ID = '6UiUdmPna4RJb2hNBoXhx3XCTFN2';
const APP_ID = 'default-app-id';

// 🔥🔥🔥 您的导航数据：DEFAULT_NAV_DATA (硬编码核心图标) 🔥🔥🔥
const DEFAULT_NAV_DATA = [
    {
        id: 'cat-1',
        category: '常用开发',
        order: 0,
        links: [
            // ⭐️ 硬编码图标 ⭐️
            { name: 'HuggingFace', url: 'https://huggingface.co/', description: 'AI/ML 模型共享与协作社区', icon: 'https://huggingface.co/favicon.ico' },
            { name: 'github', url: 'https://github.com/', description: '全球最大的代码托管平台', icon: 'https://github.com/fluidicon.png' },
            { name: 'cloudflare', url: 'https://dash.cloudflare.com/', description: 'CDN 与网络安全服务控制台', icon: 'https://www.cloudflare.com/favicon.ico' },
            // 自定义域名，保留空白使用 DDG 动态图标服务
            { name: 'clawcloudrun', url: 'https://us-east-1.run.claw.cloud/signin?link=FZHSTH7HEBTU', description: 'Claw Cloud Run 登录', icon: '' },
            { name: 'Supabase', url: 'https://supabase.com/', description: '开源 Firebase 替代方案', icon: 'https://supabase.com/favicon.ico' },
            { name: 'firebase', url: 'https://firebase.google.cn/', description: 'Google 后端云服务', icon: 'https://firebase.google.cn/images/favicons/favicon.ico' },
            // 自定义域名，保留空白使用 DDG 动态图标服务
            { name: 'dpdns', url: 'https://dash.domain.digitalplat.org/auth/login?next=%2F', description: 'DPDNS 域名管理平台', icon: '' },
        ],
    },
    {
        id: 'cat-2',
        category: 'AI大模型',
        order: 1,
        links: [
             // ⭐️ 硬编码图标 ⭐️
            { name: 'chatgpt', url: 'https://chatgpt.com/', description: 'OpenAI 对话模型', icon: 'https://chatgpt.com/favicon.ico' },
            { name: 'gemini', url: 'https://gemini.google.com/app', description: 'Google AI 应用', icon: 'https://gemini.google.com/favicon.ico' },
            { name: 'deepseek', url: 'https://www.deepseek.com/', description: '深度求索 AI 平台', icon: 'https://www.deepseek.com/favicon.ico' },
            { name: '阿里千问', url: 'https://chat.qwen.ai/', description: '阿里通义千问', icon: 'https://chat.qwen.ai/favicon.ico' },
            { name: '腾讯元宝', url: 'https://yuanbao.tencent.com/chat/naQivTmsDa', description: '腾讯混元大模型应用', icon: 'https://yuanbao.tencent.com/favicon.ico' },
            { name: '豆包', url: 'https://www.doubao.com/chat/', description: '字节跳动 AI', icon: 'https://www.doubao.com/favicon.ico' },
            { name: '即梦', url: 'https://jimeng.jianying.com/', description: '剪映 AI 创作工具', icon: 'https://jimeng.jianying.com/favicon.ico' },
            { name: '通义万相', url: 'https://tongyi.aliyun.com/wan/', description: '阿里文生图服务', icon: 'https://tongyi.aliyun.com/favicon.ico' },
        ],
    },
    {
        id: 'cat-3',
        category: '影视娱乐',
        order: 2,
        links: [
            // ⭐️ 硬编码图标 ⭐️
            { name: '哔哩哔哩', url: 'https://bilibili.com', description: 'B 站视频分享社区', icon: 'https://www.bilibili.com/favicon.ico' },
            { name: 'youtube', url: 'https://youtube.com', description: '全球最大视频平台', icon: 'https://www.youtube.com/s/desktop/4f17f4b8/img/favicon_96x96.png' },
            { name: '爱奇艺', url: 'https://www.iqiyi.com', description: '国内视频播放平台', icon: 'https://www.iqiyi.com/favicon.ico' },
            // 自定义域名，保留空白使用 DDG 动态图标服务
            { name: '在线音乐', url: 'https://music.eooce.com/', description: '免费在线音乐播放', icon: '' },
            // 自定义域名，保留空白使用 DDG 动态图标服务
            { name: '视频下载', url: 'https://tubedown.cn/', description: '通用视频下载工具', icon: '' },
            // 自定义域名，保留空白使用 DDG 动态图标服务
            { name: '星空音乐下载', url: 'https://www.vh.hk/', description: '音乐下载工具', icon: '' },
            { name: 'instagram', url: 'https://www.instagram.com/', description: '图片与短视频分享社区', icon: 'https://www.instagram.com/static/images/ico/favicon.ico/31604a141b77.ico' },
            { name: '快手', url: 'https://www.kuaishou.com/', description: '短视频分享平台', icon: 'https://www.kuaishou.com/favicon.ico' },
            { name: '抖音', url: 'https://www.douyin.com/', description: '国内短视频平台', icon: 'https://www.douyin.com/favicon.ico' },
            { name: 'TikTok', url: 'https://www.tiktok.com/', description: '国际版短视频平台', icon: 'https://www.tiktok.com/favicon.ico' },
            { name: 'Snapchat', url: 'https://www.snapchat.com/', description: '阅后即焚社交应用', icon: 'https://www.snapchat.com/favicon.ico' },
        ],
    },
    {
        id: 'cat-4',
        category: 'IP检测 地址生成',
        order: 3,
        links: [
            // ⭐️ 硬编码图标 ⭐️
            { name: 'browserscan', url: 'https://www.browserscan.net/zh', description: '浏览器指纹与安全检测', icon: 'https://www.browserscan.net/favicon.ico' },
            { name: 'ping0', url: 'https://ping0.cc/', description: '网络延迟与连通性监测', icon: 'https://ping0.cc/favicon.ico' },
            // 自定义域名，保留空白使用 DDG 动态图标服务
            { name: '真实地址生成器', url: 'https://address.nnuu.nyc.mn/', description: '随机地址生成工具', icon: '' },
            { name: 'Itdog', url: 'https://www.itdog.cn/tcping', description: '网络延迟和丢包检测', icon: 'https://www.itdog.cn/favicon.ico' },
            // 自定义域名，保留空白使用 DDG 动态图标服务
            { name: 'IP地址查询', url: 'https://ip.ssss.nyc.mn/', description: 'IP 地址归属地查询', icon: '' },
        ],
    },
    {
        id: 'cat-5',
        category: '搜索引擎',
        order: 4,
        links: [
            // ⭐️ 硬编码图标 ⭐️
            { name: '谷歌', url: 'https://google.com', description: '全球最大搜索引擎', icon: 'https://www.google.com/favicon.ico' },
            { name: '百度', url: 'https://baidu.com', description: '中文搜索引擎', icon: 'https://www.baidu.com/favicon.ico' }, 
            { name: '必应', url: 'https://bing.com', description: '微软旗下搜索引擎', icon: 'https://www.bing.com/sa/simg/favicon-2x.ico' },
        ],
    },
    {
        id: 'cat-6',
        category: '云计算',
        order: 5,
        links: [
             // ⭐️ 硬编码图标 ⭐️
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
            // ⭐️ 硬编码图标 ⭐️
            { name: '在线工具网', url: 'https://tool.lu/', description: '程序员综合在线工具', icon: 'https://tool.lu/favicon.ico' },
            // 自定义域名，保留空白使用 DDG 动态图标服务
            { name: 'Py混淆', url: 'https://freecodingtools.org/tools/obfuscator/python', description: 'Python 代码混淆工具', icon: '' },
            { name: '二维码生成', url: 'https://cli.im/', description: '在线二维码制作', icon: 'https://cli.im/favicon.ico' },
            // 自定义域名，保留空白使用 DDG 动态图标服务
            { name: 'Argo Tunnel json获取', url: 'https://fscarmen.cloudflare.now.cc/', description: 'Cloudflare Argo Tunnel 配置工具', icon: '' },
            { name: 'base64转换', url: 'https://www.qqxiuzi.cn/bianma/base64.htm', description: 'Base64 编解码转换', icon: 'https://www.qqxiuzi.cn/favicon.ico' },
            { name: '一键抠图', url: 'https://remove.photos/zh-cn/', description: 'AI 图片背景移除', icon: 'https://remove.photos/favicon.ico' },
            // 自定义域名，保留空白使用 DDG 动态图标服务
            { name: '网址缩短', url: 'https://short.ssss.nyc.mn/', description: '链接缩短服务', icon: '' },
            { name: 'flexclip', url: 'https://www.flexclip.com/cn/ai/', description: 'AI 视频制作与编辑', icon: 'https://www.flexclip.com/favicon.ico' },
            { name: 'Js混淆', url: 'https://obfuscator.io/', description: 'JavaScript 代码混淆器', icon: 'https://obfuscator.io/favicon.ico' },
            { name: '文件格式转换', url: 'https://convertio.co/zh/', description: '在线文件格式转换', icon: 'https://convertio.co/favicon.ico' },
            { name: '第一工具网', url: 'https://d1tools.com/', description: '综合在线工具集合', icon: 'https://d1tools.com/favicon.ico' },
            { name: 'PHP混淆加密', url: 'https://www.toolnb.com/tools/phpcarbylamine.html', description: 'PHP 代码加密与混淆', icon: 'https://www.toolnb.com/favicon.ico' },
            { name: 'json工具', url: 'https://www.json.cn/', description: 'JSON 格式化与校验', icon: 'https://www.json.cn/favicon.ico' },
            { name: 'Emoji 表情大全', url: 'https://www.iamwawa.cn/emoji.html', description: 'Emoji 符号查找', icon: 'https://www.iamwawa.cn/favicon.ico' },
            { name: '网站打包app', url: 'https://blackace.app/', description: '将网站打包成 App', icon: 'https://blackace.app/favicon.ico' },
        ],
    },
    {
        id: 'cat-8',
        category: 'IP代理',
        order: 7,
        links: [
            // ⭐️ 硬编码图标 ⭐️
            { name: '在线代理', url: 'https://www.proxyshare.com/zh/proxysite', description: '免费在线代理服务', icon: 'https://www.proxyshare.com/favicon.ico' },
            { name: '免费网络代理', url: 'https://www.lumiproxy.com/zh-hans/online-proxy/proxysite/', description: '免费代理服务', icon: 'https://www.lumiproxy.com/favicon.ico' },
        ],
    },
    {
        id: 'cat-9',
        category: '电商平台',
        order: 8,
        links: [
             // ⭐️ 硬编码图标 ⭐️
            { name: '淘宝网', url: 'https://taobao.com', description: '国内大型综合购物网站', icon: 'https://www.taobao.com/favicon.ico' },
            { name: '京东商城', url: 'https://jd.com', description: '国内知名自营电商', icon: 'https://www.jd.com/favicon.ico' },
            { name: '亚马逊', url: 'https://www.amazon.cn/', description: '国际电商平台', icon: 'https://www.amazon.cn/favicon.ico' },
        ],
    },
];

// 🔹 调试栏隐藏
const DebugBar = () => null;

// =========================================================================
// ⬇️ 图标映射和处理逻辑 ⬇️
// =========================================================================

// 🔹 图标名称到 Lucide 组件的映射
const ICON_MAP = {
    // 常用开发
    'huggingface': Wand, 
    'github': Github,
    'cloudflare': Cloud,
    'clawcloudrun': Code,
    'dpdns': Network,
    'supabase': Database,
    'firebase': Server, 

    // AI 大模型
    'chatgpt': Bot,
    'gemini': Wand, 
    'deepseek': Bot,
    '阿里千问': Bot,
    '腾讯元宝': Bot,
    '豆包': Bot,
    '即梦': Wand,
    '通义万相': Wand,

    // 影视娱乐
    '哔哩哔哩': Play,
    'youtube': Play,
    '爱奇艺': Monitor,
    '在线音乐': Play,
    '视频下载': Monitor,
    '星空音乐下载': Play,
    'instagram': Camera,
    '快手': Camera,
    '抖音': Camera, 
    'tiktok': Camera,
    'snapchat': Camera,

    // IP检测
    'browserscan': Network,
    'ping0': Network,
    '真实地址生成器': Network,
    'itdog': Network,
    'ip地址查询': Network,
    
    // 搜索引擎
    '谷歌': Search,
    '百度': Search,
    '必应': Search,

    // 云计算
    'aws': Server,
    'azure': Server,
    '阿里云': Server,
    '腾讯云': Server,
    '华为云': Server,
    'oracle cloud': Database,
    'ibm cloud': Database,

    // 工具箱 (全部映射到 Wrench/Code/Wand)
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
    '网站打包app': Code,

    // IP代理
    '在线代理': Network,
    '免费网络代理': Network,

    // 电商平台
    '淘宝网': ShoppingCart,
    '京东商城': ShoppingCart,
    '亚马逊': ShoppingCart,
};

// 🔹 辅助函数：根据链接名称获取 Lucide 组件 (用于回退)
const DefaultFallbackIcon = Globe; 

const getLucideIcon = (linkName) => {
    const key = linkName.toLowerCase().replace(/\s/g, ''); 
    const IconComponent = ICON_MAP[key];
    return IconComponent || DefaultFallbackIcon;
};


// 🔹 辅助组件：处理图标的加载和回退 (硬编码优先 + DuckDuckGo 服务)
const LinkIcon = ({ link }) => {
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        setHasError(false);
    }, [link.url, link.icon]);

    const imageUrl = useMemo(() => {
        // 1. 优先使用硬编码的 icon 字段 (用户手动输入或 DEFAULT_NAV_DATA 中的值)
        if (link.icon) {
            return link.icon;
        }

        // 2. 如果没有硬编码，使用 DuckDuckGo 的 Favicon 服务
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
                    // 如果图片加载失败 (无论是硬编码还是动态服务)，设置错误状态，回退到 Lucide 符号
                    onError={() => setHasError(true)} 
                    loading="lazy"
                />
            )}
        </div>
    );
};

// =========================================================================
// ⬆️ 图标映射和处理逻辑 ⬆️
// =========================================================================


// 🔹 链接卡片 (保持不变)
const LinkCard = ({ link }) => {
  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg flex flex-col h-full border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow duration-300">
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

// 🔹 公共主页 (保持不变)
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

// 🔹 链接表单 (新增 Icon URL 输入框)
const LinkForm = ({ links, setLinks }) => {
  const handleChange = (index, field, value) => {
    const newLinks = [...links];
    newLinks[index][field] = value;
    setLinks(newLinks);
  };
  // 新增 icon 字段的默认值
  const addLink = () => setLinks([...links, { name: '', url: '', description: '', icon: '' }]); 
  const removeLink = (index) => setLinks(links.filter((_, i) => i !== index));

  return (
    <div className="space-y-2 text-sm"> 
      {links.map((l, idx) => (
        <div key={idx} className="flex flex-wrap items-center gap-2 border p-2 rounded dark:border-gray-600">
          <input placeholder="名称" value={l.name} onChange={e => handleChange(idx, 'name', e.target.value)} className="border p-1 rounded w-20 dark:bg-gray-700 dark:border-gray-600"/>
          <input placeholder="链接" value={l.url} onChange={e => handleChange(idx, 'url', e.target.value)} className="border p-1 rounded w-32 dark:bg-gray-700 dark:border-gray-600"/>
          <input placeholder="描述" value={l.description} onChange={e => handleChange(idx, 'description', e.target.value)} className="border p-1 rounded w-32 dark:bg-gray-700 dark:border-gray-600"/>
          {/* ⭐️ 图标 URL 输入框 ⭐️ */}
          <input placeholder="图标 URL (可选)" value={l.icon} onChange={e => handleChange(idx, 'icon', e.target.value)} className="border p-1 rounded flex-1 min-w-[150px] dark:bg-gray-700 dark:border-gray-600"/>
          
          <button onClick={() => removeLink(idx)} className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 flex-shrink-0">删除</button>
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
    // 确保 links 数组中的每个对象都有 icon 字段
    const linksWithIcon = newCategory.links.map(link => ({...link, icon: link.icon || '' }));
    await addDoc(navCollection, {...newCategory, links: linksWithIcon});
    setNewCategory({ category: '', order: 0, links: [] });
    fetchData();
  };
  const startEdit = (item) => { 
    // 确保 links 数组中的每个对象都有 icon 字段
    const linksWithIcon = item.links ? item.links.map(link => ({...link, icon: link.icon || '' })) : [];
    setEditId(item.id); 
    setEditData({...item, links: linksWithIcon}); 
  };
  const saveEdit = async () => { 
    // 确保 links 数组中的每个对象都有 icon 字段
    const linksWithIcon = editData.links.map(link => ({...link, icon: link.icon || '' }));
    await updateDoc(doc(db, `artifacts/${APP_ID}/public/data/navData`, editId), {...editData, links: linksWithIcon}); 
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
                {item.links?.map((l,idx)=><li key={idx} className="truncate">{l.name} - <span className="text-blue-500">{l.url}</span></li>)}
              </ul>
            </>
          )}
        </div>
      ))}
    </div>
  );
};

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
              {/* ✅ 邮箱地址已修改 (Footer) */}
              <a href="mailto:115382613@qq.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-500 transition-colors" title="Email">
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

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
                {/* ✅ 邮箱地址已修改 (AboutPage) */}
                <a 
                    href="mailto:115382613@qq.com" 
                    className="text-blue-500 dark:text-blue-400 hover:underline ml-1"
                >
                    115382613@qq.com
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
                使用本网站即表示您已阅读、理解并同意本声明的所有内容。
            </p>
        </div>
    </div>
);


// =========================================================================
// ⬇️ 搜索按钮配置与逻辑 (仅谷歌硬编码) ⬇️
// =========================================================================

// 🔹 外部搜索引擎配置 (仅谷歌硬编码，百度和必应保持原样)
const externalEngines = [
  { name: '百度', url: 'https://www.baidu.com/s?wd=', icon: 'https://www.baidu.com' }, // 保持原样，使用CDN加载
  // 🔥🔥🔥 核心修改：使用 Base64 编码的 Google 图标，确保 100% 在任何网络下都能显示 🔥🔥🔥
  { name: '谷歌', url: 'https://www.google.com/search?q=', icon: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0OCA0OCI+PHBhdGggZmlsbD0iI0VBNDMzNSIgZD0iTTI0IDQ4YzYuNDggMCAxMS45My0yLjQ4IDE1LjgzLTcuMDhMMzQuMjIgMzYuM2MtMi44MSAxLjg5LTYuMjIgMy05LjkzIDMtMTIuODggMC0yMy41LTEwLjQyLTIzLjUtMjMuNDggMC01LjM2IDEuNzYtMTAuMyA0Ljc0LTE0LjM1TDkuNjggMi45OEM0LjAyIDcuNzEgMCAxNS40MyAwIDI0LjUyIDAgMzcuNDggMTAuNzQgNDggMjQgNDh6Ii8+PHBhdGggZmlsbD0iIzQyODVGNCIgZD0iTTQ2Ljk4IDI0LjU1YzAtMS41Ny0uMTUtMy4wOS0uMzgtNC41NUgyNHY5LjAyaDEyLjk0Yy0uNTggMi45Ni0yLjI2IDUuNDgtNC43OCA3LjE4bDcuNzMgNmM0LjUxLTQuMTggNy4wOS0xMC4zNiA3LjA5LTE3LjY1eiIvPjxwYXRoIGZpbGw9IiNGQkJDMDUiIGQ9Ik0xMC41MyAyOC41OWMtLjQ4LTEuNDUtLjc2LTIuOTktLjc2LTQuNTlzLjI3LTMuMTQuNzYtNC41OWwtNy45OC02LjE5Qy45MiAxNi40NiAwIDIwLjEyIDAgMjRjMCAzLjg4LjkyIDcuNTQgMi41NiAxMC43OGw3Ljk3LTYuMTl6Ii8+PHBhdGggZmlsbD0iIzM0QTg1MyIgZD0iTTI0IDQ4YzYuNDggMCAxMS45My0yLjEzIDE1Ljg5LTUuODFsLTcuNzMtNmMtMi4xNSAxLjQ1LTQuOTIgMi4zLTguMTYgMi4zLTYuMjYgMC0xMS41Ny00LjIyLTEzLjQ3LTkuOTFsLTcuOTggNi4xOUM2LjUxIDQyLjYyIDE0LjYyIDQ4IDI0IDQ4eiIvPjwvc3ZnPg==' },
  { name: '必应', url: 'https://www.bing.com/search?q=', icon: 'https://www.bing.com' }, // 保持原样，使用CDN加载
];

// 🔹 外部搜索处理函数 (保持不变)
const handleExternalSearch = (engineUrl, query) => {
  if (query) {
    // 编码查询字符串并新窗口打开
    window.open(engineUrl + encodeURIComponent(query), '_blank');
  } else {
    // 如果没有关键词，直接打开搜索引擎主页
    const baseDomain = new URL(engineUrl.split('?')[0]).origin;
    window.open(baseDomain, '_blank');
  }
};

// 🔹 搜索输入框组件 (提取到 App 外部，接收 props)
const SearchInput = React.memo(({ searchTerm, setSearchTerm }) => (
    <div className="relative">
        <input 
            type="text" 
            placeholder="搜索链接名称、描述或网址..." 
            value={searchTerm}
            // 确保 onChange 正确更新状态
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

// 🔹 子组件：处理单个外部搜索按钮的图标 (新增，用于稳定显示 Favicon)
const ExternalSearchButton = ({ engine, searchTerm }) => {
    const [hasError, setHasError] = useState(false);
    
    // 链接变化时，重置错误状态
    useEffect(() => {
        setHasError(false);
    }, [engine.name]); 

    const handleSearch = () => handleExternalSearch(engine.url, searchTerm);

    // ⭐️ 核心逻辑修改：判断是否为 Base64 编码的图标 ⭐️
    // 如果是 data:image 开头，说明是硬编码的 Base64，直接使用
    // 否则认为是域名，使用 Google S2 CDN 加载 (保持你原有的逻辑)
    const iconSrc = engine.icon.startsWith('data:image') 
        ? engine.icon 
        : `https://www.google.com/s2/favicons?domain=${new URL(engine.icon).hostname}&sz=32`;

    return (
        <button
            onClick={handleSearch}
            title={`使用 ${engine.name} 搜索: ${searchTerm || '（无关键词）'}`}
            className={`p-2.5 rounded-full border border-gray-300 dark:border-gray-600 transition-shadow bg-white dark:bg-gray-800 hover:shadow-lg hover:scale-105 flex items-center justify-center`}
        >
            {/* 如果硬编码的 icon URL 不存在或加载出错，则回退到 Lucide Search 图标 */}
            {hasError || !engine.icon ? (
                <Search className="w-6 h-6 text-gray-500 dark:text-gray-300" />
            ) : (
                <img 
                    src={iconSrc} 
                    alt={engine.name} 
                    className="w-6 h-6 rounded-full object-contain"
                    onError={() => setHasError(true)} // 加载失败，触发回退
                    loading="lazy"
                />
            )}
        </button>
    );
};


// 🔹 外部搜索按钮组件 (提取到 App 外部，接收 props)
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

// 🚀 SearchLayout 组件 (使用稳定的单一布局)
const SearchLayout = React.memo(({ isAdmin, currentPage, searchTerm, setSearchTerm }) => {
    if (isAdmin || currentPage !== 'home') return null;

    // 统一使用 "搜索框在上，按钮在下" 的稳定结构
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


// =========================================================================
// ⬆️ 搜索按钮配置与逻辑 (仅谷歌硬编码) ⬆️
// =========================================================================


// 🔹 主应用 (App 组件)
export default function App() {
  const [firebaseApp, setFirebaseApp] = useState(null);
  const [auth, setAuth] = useState(null);
  const [db, setDb] = useState(null);
  const [userId, setUserId] = useState(null);
  
  const [navData, setNavData] = useState(DEFAULT_NAV_DATA); 
  const [isDark, setIsDark] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [loginError, setLoginError] = useState('');
  
  const [currentPage, setCurrentPage] = useState('home'); 
  const [searchTerm, setSearchTerm] = useState(''); 
  
  // 仅保留状态定义，但在 SearchLayout 中不再用于条件渲染
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
    const unsub = onSnapshot(navCol, snapshot=>{
      const data = snapshot.docs.map(d=>({id:d.id,...d.data()}));
      data.sort((a,b)=>(a.order||0)-(b.order||0));
      
      // 成功获取到数据，标记连接成功
      setIsFirebaseConnected(true); 

      if (data.length > 0 || isAdmin) { 
          setNavData(data);
      }
      
    }, 
    // ✅ 降级修复: Firebase 连接失败时使用内部 DEFAULT_NAV_DATA
    (error) => {
        console.warn("Firebase connection failed or blocked. Using internal DEFAULT_NAV_DATA as fallback.", error.message);
        setIsFirebaseConnected(false); 
        // 确保 navData 即使在连接失败时也至少有默认数据
        setNavData(DEFAULT_NAV_DATA);
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
        console.error("Admin fetch failed:", error);
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
        
        {/* 搜索区域 (使用稳定的外部组件 SearchLayout) */}
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