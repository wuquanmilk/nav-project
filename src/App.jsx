import React, { useState, useMemo, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';  // 引入 Router 和 Route
import { Search } from 'lucide-react';

// 示例数据：导航链接及分类
const navData = {
    "AI/效率工具": [
        { id: 1, title: "ChatGPT", url: "https://chat.openai.com/", description: "强大的多模态语言模型" },
        { id: 2, title: "Claude AI", url: "https://claude.ai/", description: "Anthropic 的对话AI，擅长长文本处理" },
        { id: 3, title: "Midjourney", url: "https://www.midjourney.com/app/", description: "AI绘画和图像生成工具" },
        { id: 4, title: "Notion", url: "https://www.notion.so/", description: "一体化的笔记、项目管理和知识库" },
        { id: 5, title: "Perplexity", url: "https://www.perplexity.ai/", description: "基于AI的答案引擎和研究工具" },
    ],
    "前端开发": [
        { id: 6, title: "MDN Web Docs", url: "https://developer.mozilla.org/zh-CN/", description: "Web开发权威参考文档" },
        { id: 7, title: "React 官网", url: "https://react.dev/", description: "构建用户界面的JavaScript库" },
        { id: 8, title: "Tailwind CSS", url: "https://tailwindcss.com/", description: "实用至上 (Utility-First) CSS框架" },
        { id: 9, title: "GitHub", url: "https://github.com/", description: "全球最大的代码托管与协作平台" },
        { id: 10, title: "Vercel", url: "https://vercel.com/", description: "前端应用托管与部署服务" },
    ],
    "设计资源": [
        { id: 11, title: "Figma", url: "https://www.figma.com/", description: "协作式界面设计与原型工具" },
        { id: 12, title: "Unsplash", url: "https://unsplash.com/", description: "免费高分辨率图片资源库" },
        { id: 13, title: "Dribbble", url: "https://dribbble.com/", description: "设计师作品展示社区" },
        { id: 14, title: "Lucide Icons", url: "https://lucide.dev/", description: "开源、一致性强的矢量图标库" },
    ],
};

// 主应用组件
const App = () => {
    const [searchTerm, setSearchTerm] = useState('');

    // 过滤数据
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
    }, [searchTerm]);

    const displayData = searchTerm ? filteredNavData : navData;

    return (
        <Router>
            <Routes>
                {/* 路由部分 */}
                <Route path="/nav" element={
                    <div className="px-4 md:px-6 lg:px-8 max-w-7xl mx-auto">
                        {/* 搜索框 */}
                        <div className="pt-16 pb-10 flex justify-center w-full">
                            <div className="relative w-full max-w-3xl px-4">
                                <Search className="absolute left-7 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                                <input
                                    type="text"
                                    placeholder="搜索网站标题、描述或类别..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 text-lg border-2 border-indigo-300 dark:border-indigo-700 rounded-full focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:text-white shadow-xl transition duration-200"
                                />
                                {searchTerm && (
                                    <button
                                        onClick={() => setSearchTerm('')}
                                        className="absolute right-7 top-1/2 transform -translate-y-1/2 p-1 rounded-full text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 bg-gray-100 dark:bg-gray-700"
                                        title="清空搜索"
                                    >
                                        <Search className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* 分类和卡片展示 */}
                        {Object.keys(displayData).length === 0 && (
                            <div className="flex justify-center items-center h-64 text-gray-500 dark:text-gray-400">
                                没有找到与“{searchTerm}”相关的内容
                            </div>
                        )}

                        {Object.keys(displayData).sort().map(category => (
                            <div key={category} className="mb-12">
                                <h2 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-6">
                                    {category}
                                </h2>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-5">
                                    {displayData[category].map(link => (
                                        <a
                                            key={link.id}
                                            href={link.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="group block p-4 rounded-2xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700/60 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
                                        >
                                            <div className="w-10 h-10 mb-3 flex items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 font-bold text-lg">
                                                {link.title[0]?.toUpperCase()}
                                            </div>
                                            <p className="font-semibold text-gray-900 dark:text-white text-sm mb-1 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
                                                {link.title}
                                            </p>
                                            <p className="text-xs leading-snug text-gray-500 dark:text-gray-400 line-clamp-2">
                                                {link.description || link.url}
                                            </p>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                } />
                {/* 其他已有路由 */}
            </Routes>
        </Router>
    );
};

export default App;
