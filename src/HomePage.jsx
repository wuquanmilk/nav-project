import React, { useEffect, useState } from "react";
import { db } from "./firebase"; // 确保你有 firebase.js 初始化
import { collection, getDocs, query, orderBy } from "firebase/firestore";

const appId = "default-app-id";

export default function HomePage() {
  const [navList, setNavList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNav = async () => {
      try {
        const navCollection = collection(db, `artifacts/${appId}/public/data/navData`);
        // 按 order 排序，方便前端显示顺序
        const q = query(navCollection, orderBy("order", "asc"));
        const snapshot = await getDocs(q);
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setNavList(list);
      } catch (err) {
        console.error("获取导航数据失败:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchNav();
  }, []);

  if (loading) {
    return <div className="p-6">加载中...</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">导航主页</h1>
      {navList.length === 0 ? (
        <p className="text-gray-500">暂无导航数据</p>
      ) : (
        <ul className="space-y-4">
          {navList.map(item => (
            <li key={item.id} className="border rounded p-4 shadow-sm hover:shadow-md transition">
              <div className="mb-2">
                <span className="font-bold text-lg">{item.category}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {(item.links || []).map((link, idx) => (
                  <a
                    key={idx}
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline px-2 py-1 border rounded"
                  >
                    {link}
                  </a>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
