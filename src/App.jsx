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

// ⭐️ 谷歌图标 Base64 SVG 编码 (用于国际版稳定性修复，防止动态加载失败) ⭐️
const GOOGLE_BASE64_ICON = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0OCA0OCI+PHBhdGggZmlsbD0iI0VBNDMzNSIgZD0iTTI0IDQ4YzYuNDggMCAxMS45My0yLjQ4IDE1LjgzLTcuMDhMMzQuMjIgMzYuM2MtMi44MSAxLjg5LTYuMjIgMy05LjkzIDMtMTIuODggMC0yMy41LTEwLjQyLTIzLjUtMjMuNDggMC01LjM2IDEuNzYtMTAuMyA0Ljc0LTE0LjM1TDkuNjggMi45OEM0LjAyIDcuNzEgMCAxNS40MyAwIDI0LjUyIDAgMzcuNDggMTAuNzQgNDggMjQgNDh6Ii8+PHBhdGogZmlsbD0iIzQyODVGNCIgZD0iTTQ2Ljk4IDI0LjU1Yz羞思T1.NTctLjE1LTMuMDktLjM4LTQuNTVIMjR2OS4wMmgxMi45NGMtMC41OCAyLjk2LTIuMjYgNS40OC00Ljc4IDcuMThsNy43MzYgNi4xOTY0LjUxLTQuMTggNy4wOS0xMC4zNiA3LjA5LTE3LjY1eiIvPjxwYXRoZmlsbD0iI0ZCQkMwNSIgZD0iTTEwLjUzIDI4LjU5Yy0wLjQ4LTEuNDUtLjc2LTIuOTktLjc2LTQuNTlzMC4yNy0zLjE0Ljc2LTQuNTlsLTcuOTgtNi4xOUMuOTIgMTYuNDYgMCAyMC4xMiAwIDI0YzAgMy44OC45MiA3LjU0IDIuNTYgMTAuNzhsNy45Ny02LjE5eiIvPjxwYXRoIGZpbGw9IiMzNEE4NTMiIGQ9Ik0xMC41MyAxNi4yNEM3LjI4IDE5LjAzIDQuODcgMjMuMDMgNC44NyAyNC45OWMwLjAwMSAzgcyLS42NiA3LjQ2LTkuNTVsLTcuOTgtNi4xOUM2LjUyIDcuNjcgMTQuNjMgMy42NCAyNCAzLjY0YzIuOTkgMCA1Ljc4LjU1IDguNDQgMS41NGwtNS43OCAzLjI0Yy0xLjUzLS43MS0zLjIzLS45OS00Ljk3LS45OS01LjM2IDAtMTAuMzMgMi40Ni0xMy42NiA2LjE1eiIvPjwvc3ZnPg==';

// =========================================================================
// 核心切换开关：国内版 / 国际版
// =========================================================================

// 🚨 当前为 国际版 (FULL)
// true  = 国内版 (屏蔽国外受限链接)
// false = 国际版 (显示所有链接，用于翻墙用户)
const IS_DOMESTIC_VERSION = false; 

// =========================================================================
// ⬇️ 国际版 (FULL) 数据定义 (包含所有国际和国内链接) ⬇️
// =========================================================================

const FULL_EXTERNAL_ENGINES = [
    { name: '谷歌', url: 'https://www.google.com/search?q=', icon: GOOGLE_BASE64_ICON },
    { name: '百度', url: 'https://www.baidu.com/s?wd=', icon: 'https://icons.duckduckgo.com/ip3/baidu.com.ico' },
    { name: '必应', url: 'https://www.bing.com/search?q=', icon: 'https://icons.duckduckgo.com/ip3/bing.com.ico' },
];

const FULL_NAV_DATA = [
    {
        id: 'cat-1',
        category: '常用开发',
        order: 0,
        links: [
            // 国际链接
            { name: 'HuggingFace', url: 'https://huggingface.co/', description: 'AI/ML 模型共享与协作社区', icon: 'https://huggingface.co/favicon.ico' },
            { name: 'github', url: 'https://github.com/', description: '全球最大的代码托管平台', icon: 'https://github.com/fluidicon.png' },
            { name: 'cloudflare', url: 'https://dash.cloudflare.com/', description: 'CDN 与网络安全服务控制台', icon: 'https://www.cloudflare.com/favicon.ico' },
            { name: 'clawcloudrun', url: 'https://us-east-1.run.claw.cloud/signin?link=FZHSTH7HEBTU', description: 'Claw Cloud Run 登录', icon: '' },
            { name: 'Supabase', url: 'https://supabase.com/', description: '开源 Firebase 替代方案', icon: 'https://supabase.com/favicon.ico' },
            { name: 'firebase', url: 'https://firebase.google.cn/', description: 'Google 后端云服务', icon: 'https://firebase.google.cn/images/favicons/favicon.ico' },
            { name: 'dpdns', url: 'https://dash.domain.digitalplat.org/auth/login?next=%2F', description: 'DPDNS 域名管理平台', icon: '' },
        ],
    },
    {
        id: 'cat-2',
        category: 'AI大模型',
        order: 1,
        links: [
             // 国际 & 国内链接
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
            // 国际 & 国内链接
            { name: '哔哩哔哩', url: 'https://bilibili.com', description: 'B 站视频分享社区', icon: 'https://www.bilibili.com/favicon.ico' },
            { name: 'youtube', url: 'https://youtube.com', description: '全球最大视频平台', icon: 'https://www.youtube.com/s/desktop/4f17f4b8/img/favicon_96x96.png' },
            { name: '爱奇艺', url: 'https://www.iqiyi.com', description: '国内视频播放平台', icon: 'https://www.iqiyi.com/favicon.ico' },
            { name: '在线音乐', url: 'https://music.eooce.com/', description: '免费在线音乐播放', icon: '' },
            { name: '视频下载', url: 'https://tubedown.cn/', description: '通用视频下载工具', icon: '' },
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
            // 国际 & 国内搜索引擎
            { name: '百度', url: 'https://baidu.com', description: '中文搜索引擎', icon: 'https://icons.duckduckgo.com/ip3/baidu.com.ico' }, 
            { name: '谷歌', url: 'https://google.com', description: '全球最大搜索引擎', icon: GOOGLE_BASE64_ICON },
            { name: '必应', url: 'https://bing.com', description: '微软旗下搜索引擎', icon: 'https://icons.duckduckgo.com/ip3/bing.com.ico' },
        ],
    },
    {
        id: 'cat-6',
        category: '云计算',
        order: 5,
        links: [
             // 国际 & 国内云服务
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
            { name: 'flexclip', url: 'https://www.flexclip.com/cn/ai/', description: 'AI 视频制作与编辑', icon: 'https://www.flexclip.com/cn/favicon.ico' },
            { name: 'Js混淆', url: 'https://obfuscator.io/', description: 'JavaScript 代码混淆器', icon: 'https://obfuscator.io/favicon.ico' },
            { name: '文件格式转换', url: 'https://convertio.co/zh/', description: '在线文件格式转换', icon: 'https://convertio.co/zh/favicon.ico' },
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
            { name: '在线代理', url: 'https://www.proxyshare.com/zh/proxysite', description: '免费在线代理服务', icon: 'https://www.proxyshare.com/favicon.ico' },
            { name: '免费网络代理', url: 'https://www.lumiproxy.com/zh-hans/online-proxy/proxysite/', description: '免费代理服务', icon: 'https://www.lumiproxy.com/lumiproxy-icon-16.png' },
        ],
    },
    {
        id: 'cat-9',
        category: '电商平台',
        order: 8,
        links: [
            { name: '淘宝网', url: 'https://taobao.com', description: '国内大型综合购物网站', icon: 'https://www.taobao.com/favicon.ico' },
            { name: '京东商城', url: 'https://jd.com', description: '国内知名自营电商', icon: 'https://www.jd.com/favicon.ico' },
            { name: '亚马逊', url: 'https://www.amazon.cn/', description: '国际电商平台', icon: 'https://www.amazon.cn/favicon.ico' },
        ],
    },
];

// =========================================================================
// ⬇️ 国内版 (DOMESTIC) 数据定义 (已筛选出所有国际受限链接) ⬇️
// =========================================================================

const DOMESTIC_EXTERNAL_ENGINES = [
    { name: '百度', url: 'https://www.baidu.com/s?wd=', icon: 'https://icons.duckduckgo.com/ip3/baidu.com.ico' }, 
];

const DOMESTIC_NAV_DATA = [
    // cat-1 常用开发 (已移除所有国际链接)
    
    {
        id: 'cat-2',
        category: 'AI大模型',
        order: 1,
        links: [
             // 已移除 chatgpt, gemini, deepseek
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
            // 已移除 youtube, instagram, TikTok, Snapchat
            { name: '哔哩哔哩', url: 'https://bilibili.com', description: 'B 站视频分享社区', icon: 'https://www.bilibili.com/favicon.ico' },
            { name: '爱奇艺', url: 'https://www.iqiyi.com', description: '国内视频播放平台', icon: 'https://www.iqiyi.com/favicon.ico' },
            { name: '在线音乐', url: 'https://music.eooce.com/', description: '免费在线音乐播放', icon: '' },
            { name: '视频下载', url: 'https://tubedown.cn/', description: '通用视频下载工具', icon: '' },
            { name: '星空音乐下载', url: 'https://www.vh.hk/', description: '音乐下载工具', icon: '' },
            { name: '快手', url: 'https://www.kuaishou.com/', description: '短视频分享平台', icon: 'https://www.kuaishou.com/favicon.ico' },
            { name: '抖音', url: 'https://www.douyin.com/', description: '国内短视频平台', icon: 'https://www.douyin.com/favicon.ico' },
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
            // 已移除 谷歌, 必应
            { name: '百度', url: 'https://baidu.com', description: '中文搜索引擎', icon: 'https://icons.duckduckgo.com/ip3/baidu.com.ico' },
        ],
    },
    {
        id: 'cat-6',
        category: '云计算',
        order: 5,
        links: [
             // 已移除 AWS, Azure, Oracle Cloud, IBM Cloud
            { name: '阿里云', url: 'https://www.aliyun.com/', description: '阿里巴巴云服务', icon: 'https://www.aliyun.com/favicon.ico' },
            { name: '腾讯云', url: 'https://cloud.tencent.com/', description: '腾讯云服务', icon: 'https://cloud.tencent.com/favicon.ico' },
            { name: '华为云', url: 'https://www.huaweicloud.com/', description: '华为云服务', icon: 'https://www.huaweicloud.com/favicon.ico' },
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
            { name: 'flexclip', url: 'https://www.flexclip.com/cn/ai/', description: 'AI 视频制作与编辑', icon: 'https://www.flexclip.com/cn/favicon.ico' },
            { name: 'Js混淆', url: 'https://obfuscator.io/', description: 'JavaScript 代码混淆器', icon: 'https://obfuscator.io/favicon.ico' },
            { name: '文件格式转换', url: 'https://convertio.co/zh/', description: '在线文件格式转换', icon: 'https://convertio.co/zh/favicon.ico' },
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
            { name: '在线代理', url: 'https://www.proxyshare.com/zh/proxysite', description: '免费在线代理服务', icon: 'https://www.proxyshare.com/favicon.ico' },
            { name: '免费网络代理', url: 'https://www.lumiproxy.com/zh-hans/online-proxy/proxysite/', description: '免费代理服务', icon: 'https://www.lumiproxy.com/lumiproxy-icon-16.png' },
        ],
    },
    {
        id: 'cat-9',
        category: '电商平台',
        order: 8,
        links: [
             // 已移除 亚马逊
            { name: '淘宝网', url: 'https://taobao.com', description: '国内大型综合购物网站', icon: 'https://www.taobao.com/favicon.ico' },
            { name: '京东商城', url: 'https://jd.com', description: '国内知名自营电商', icon: 'https://www.jd.com/favicon.ico' },
        ],
    },
];

// =========================================================================
// 核心数据选择逻辑
// =========================================================================

const APP_TITLE = IS_DOMESTIC_VERSION ? '极速导航网 (国内版)' : '极速导航网 (国际版)';
const EXTERNAL_ENGINES = IS_DOMESTIC_VERSION ? DOMESTIC_EXTERNAL_ENGINES : FULL_EXTERNAL_ENGINES;

// DEFAULT_NAV_DATA 必须使用 WORKING_NAV_DATA 来初始化状态和渲染首页。
const DEFAULT_NAV_DATA = IS_DOMESTIC_VERSION ? DOMESTIC_NAV_DATA : FULL_NAV_DATA;


// =========================================================================
// ⬇️ 其他组件逻辑 (保持不变) ⬇️
// =========================================================================

// 🔹 调试栏隐藏
const DebugBar = () => null;

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
    // hasError 状态就是对“访问返归数据”的判断结果
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        setHasError(false);
    }, [link.url, link.icon]);

    const imageUrl = useMemo(() => {
        // 1. 优先使用硬编码的 icon 字段 (例如 Base64 或管理员输入的 URL)
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
                // 图标加载失败，降级显示 Lucide 符号
                <FallbackIconComponent className="w-6 h-6 text-blue-500 dark:text-blue-400"/>
            ) : (
                <img 
                    src={imageUrl} 
                    alt={link.name} 
                    className="w-6 h-6 object-contain"
                    // 核心：图标加载失败 (访问受限，即“返归数据”失败)，触发降级
                    onError={() => setHasError(true)} 
                    loading="lazy"
                    style={{ 
                        width: '1.5rem', 
                        height: '1.5rem', 
                        objectFit: 'contain',
                        imageRendering: 'optimizeQuality' 
                    }}
                />
            )}
        </div>
    );
};

// 🔹 搜索布局组件 (使用 EXTERNAL_ENGINES)
const SearchLayout = ({ searchTerm, setSearchTerm }) => {
    const [engineIndex, setEngineIndex] = useState(0);
    const selectedEngine = EXTERNAL_ENGINES[engineIndex];

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchTerm.trim()) {
            window.open(`${selectedEngine.url}${encodeURIComponent(searchTerm)}`, '_blank');
        }
    };

    return (
        <div className="mb-8 pt-4">
            <form onSubmit={handleSearch} className="flex max-w-2xl mx-auto rounded-full shadow-lg overflow-hidden border-2 border-blue-500 dark:border-blue-400">
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={`搜索 ${selectedEngine.name}...`}
                    className="flex-grow p-3 text-lg focus:outline-none dark:bg-gray-700 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                />
                <div className="flex-shrink-0 flex items-center bg-white dark:bg-gray-800">
                    <button type="submit" className="p-3 bg-blue-500 hover:bg-blue-600 text-white transition-colors h-full flex items-center">
                        <Search className="w-6 h-6" />
                    </button>
                    <div className="flex border-l dark:border-gray-600">
                        {EXTERNAL_ENGINES.map((engine, index) => (
                            <button
                                key={engine.name}
                                type="button"
                                onClick={() => setEngineIndex(index)}
                                className={`p-2 transition-colors ${
                                    index === engineIndex
                                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200'
                                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                                }`}
                                title={`切换到 ${engine.name}`}
                            >
                                {/* 搜索引擎图标使用 LinkIcon */}
                                <LinkIcon link={engine} />
                            </button>
                        ))}
                    </div>
                </div>
            </form>
        </div>
    );
};


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

// 🔹 链接表单 (保持不变)
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

// 🔹 管理面板 (保持不变，它将始终显示 DEFAULT_NAV_DATA 对应的数据)
const AdminPanel = ({ db, navData, fetchData }) => {
  const [newCategory, setNewCategory] = useState({ category: '', order: 0, links: [] });
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});
  const navCollection = collection(db, `artifacts/${APP_ID}/public/data/navData`);

  const handleAddCategory = async () => {
    if (!newCategory.category) return alert('请输入分类名称');
    const linksWithIcon = newCategory.links.map(link => ({...link, icon: link.icon || '' }));
    await addDoc(navCollection, {...newCategory, links: linksWithIcon});
    setNewCategory({ category: '', order: 0, links: [] });
    fetchData();
  };
  const startEdit = (item) => { 
    const linksWithIcon = item.links ? item.links.map(link => ({...link, icon: link.icon || '' })) : [];
    setEditId(item.id); 
    setEditData({...item, links: linksWithIcon}); 
  };
  const saveEdit = async () => { 
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
      <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">管理员面板 ({APP_TITLE} 当前数据)</h3>
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

// 🔹 首页组件 (使用 APP_TITLE 和 EXTERNAL_ENGINES)
// 🔥 修复点：移除 { db, auth } props，避免与组件内部的 const 声明冲突。
const HomePage = () => { 
    const [theme, setTheme] = useState('light');
    const [navData, setNavData] = useState(DEFAULT_NAV_DATA); 
    const [searchTerm, setSearchTerm] = useState('');
    const [user, setUser] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [loginError, setLoginError] = useState('');
    const [currentPage, setCurrentPage] = useState('home'); 

    // Firebase App 初始化 
    const firebaseConfig = {
      // 您的 Firebase 配置...
    };
    const app = useMemo(() => {
        try {
            // 尝试初始化 Firebase
            return initializeApp(firebaseConfig);
        } catch (e) {
            console.error("Firebase already initialized or config error:", e);
            return null;
        }
    }, []);

    // 正确的 db 和 auth 声明，使用本地 app 变量
    const db = app ? getFirestore(app) : null;
    const auth = app ? getAuth(app) : null;


    useEffect(() => {
        // 主题设置逻辑
        const localTheme = localStorage.getItem('theme');
        if (localTheme) {
            setTheme(localTheme);
            document.documentElement.classList.toggle('dark', localTheme === 'dark');
        } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            setTheme('dark');
            document.documentElement.classList.add('dark');
        }
    }, []);

    useEffect(() => {
        if (!auth) return;
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            // 检查是否为管理员 UID
            setIsAdmin(currentUser && currentUser.uid === ADMIN_USER_ID);
        });
        return () => unsubscribe();
    }, [auth]);

    // Firestore 数据获取 (关键：Firebase 数据会覆盖硬编码的 DEFAULT_NAV_DATA)
    const fetchData = () => {
        if (!db) {
             setNavData(DEFAULT_NAV_DATA.sort((a, b) => a.order - b.order));
             return () => {};
        }
        const navCollection = collection(db, `artifacts/${APP_ID}/public/data/navData`);
        const unsubscribe = onSnapshot(navCollection, (snapshot) => {
            let data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            // 排序并更新状态
            setNavData(data.sort((a, b) => a.order - b.order));

        }, (error) => {
            console.error("Error fetching Firestore data, using default data:", error);
            // 失败时，使用当前版本对应的硬编码数据
            setNavData(DEFAULT_NAV_DATA.sort((a, b) => a.order - b.order));
        });
        return () => unsubscribe();
    };

    useEffect(() => {
        const cleanup = fetchData();
        return cleanup;
    }, [db]);


    const handleLogin = async (email, password) => {
        setLoginError('');
        try {
            await signInWithEmailAndPassword(auth, email, password);
            setShowLoginModal(false);
        } catch (error) {
            console.error("Login failed:", error);
            setLoginError('登录失败：邮箱或密码错误，或用户不是管理员。');
        }
    };

    const handleToggleTheme = () => {
        setTheme(prev => {
            const newTheme = prev === 'light' ? 'dark' : 'light';
            localStorage.setItem('theme', newTheme);
            document.documentElement.classList.toggle('dark', newTheme === 'dark');
            return newTheme;
        });
    };

    const filteredNavData = useMemo(() => {
        if (!searchTerm) {
            return navData;
        }
        const lowerSearchTerm = searchTerm.toLowerCase();
        return navData
            .map(category => ({
                ...category,
                links: category.links.filter(link =>
                    link.name.toLowerCase().includes(lowerSearchTerm) ||
                    link.description.toLowerCase().includes(lowerSearchTerm)
                )
            }))
            .filter(category => category.links.length > 0);
    }, [navData, searchTerm]);


    return (
        <div className={`min-h-screen ${theme === 'dark' ? 'dark' : ''}`}>
            <div className="bg-gray-100 dark:bg-gray-900 transition-colors duration-300 min-h-screen pt-4">
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

                        {/* 登录/退出按钮 */}
                        {!user && (
                            <button 
                                onClick={() => setShowLoginModal(true)} 
                                className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-green-500 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
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
                <SearchLayout searchTerm={searchTerm} setSearchTerm={setSearchTerm}/>
                
                {/* 核心内容渲染 */}
                {/* 注意：AdminPanel 仍然需要 db 和 fetchData prop */}
                {isAdmin ? (
                    <AdminPanel db={db} navData={navData} fetchData={fetchData} />
                ) : (
                    currentPage === 'home' ? (
                        <PublicNav navData={filteredNavData} searchTerm={searchTerm} />
                    ) : currentPage === 'about' ? (
                        <AboutPage /> // 假设 AboutPage 存在
                    ) : currentPage === 'disclaimer' ? (
                        <DisclaimerPage /> // 假设 DisclaimerPage 存在
                    ) : (
                        <PublicNav navData={filteredNavData} searchTerm={searchTerm} />
                    )
                )}
              </div>
            </div>
            
            <Footer setCurrentPage={setCurrentPage} appTitle={APP_TITLE} />
            {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} onLogin={handleLogin} error={loginError} />}
        </div>
    );
};

// 🔹 页脚组件
const Footer = ({ setCurrentPage, appTitle }) => {
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
              {appTitle}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              © {currentYear} 极速导航网. 保留所有权利.
            </p>
          </div>

          <div className="flex space-x-4 text-sm text-gray-600 dark:text-gray-400">
            {footerLinks.map((link) => (
              <button 
                key={link.name}
                onClick={link.action} 
                className="hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
              >
                {link.name}
              </button>
            ))}
          </div>

        </div>
      </div>
    </footer>
  );
};

// 🔹 占位页面
const AboutPage = () => <div className="p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg min-h-[50vh]"><h2 className="text-2xl font-bold mb-4">关于本站</h2><p className="text-gray-600 dark:text-gray-300">本站旨在提供一个极简、快速、专注于国内优秀资源的导航平台。</p></div>;
const DisclaimerPage = () => <div className="p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg min-h-[50vh]"><h2 className="text-2xl font-bold mb-4">免责声明</h2><p className="text-gray-600 dark:text-gray-300">本站所有链接均收集于网络，仅供学习交流使用，本站不对其内容进行担保。所有内容最终解释权归本站所有。</p></div>;


// 默认导出主应用组件
export default HomePage;