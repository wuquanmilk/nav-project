import React, { useState, useEffect } from 'react';
import { getFirestore, collection, onSnapshot } from "firebase/firestore";
// 导入其他您需要的组件，例如：
// import NavList from './components/NavList'; 
// import AdminPanel from './components/AdminPanel';
// import Header from './components/Header';


// 🔹 异步获取备用数据函数 (兼容性增强版)
const fetchFallbackData = async (setNavData) => {
    // 🚨 检查点 1: 确认函数被调用
    console.log("Attempting to fetch fallback data...");
    
    // 尝试的路径列表：从根目录到相对路径
    const possiblePaths = [
        '/fallback-data.json',
        './fallback-data.json',
        `${window.location.origin}/fallback-data.json` 
    ];

    for (const path of possiblePaths) {
        try {
            // 🚨 检查点 2: 确认路径尝试
            console.log(`Trying path: ${path}`);
            const response = await fetch(path);
            
            if (response.ok) {
                const fallbackData = await response.json();
                fallbackData.sort((a, b) => (a.order || 0) - (b.order || 0));
                setNavData(fallbackData);
                // 🚨 检查点 3: JSON 文件加载成功
                console.log(`Successfully loaded data from: ${path}`);
                return; // 成功后退出循环
            }
        } catch (error) {
            // 忽略网络错误或 JSON 解析错误，继续尝试下一个路径
            console.warn(`Failed to fetch or parse JSON from ${path}. Trying next path.`, error);
        }
    }

    // 所有路径都尝试失败
    console.error("All attempts to load fallback data failed. Displaying empty site.");
    setNavData([]); 
};


function App() {
  const [navData, setNavData] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false); // 假设您有管理员状态
  const [isFirebaseConnected, setIsFirebaseConnected] = useState(false);
  const db = getFirestore(); // 确保您的 Firebase/Firestore 已正确初始化

  useEffect(() => {
    const navCol = collection(db, 'nav');

    // 🔔 订阅 Firebase 实时更新
    const unsub = onSnapshot(navCol, 
      // 成功回调 (Callback 1)
      snapshot => {
        const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        data.sort((a, b) => (a.order || 0) - (b.order || 0));
        
        // 只有在数据非空或管理员模式下才更新数据并标记连接成功
        if (data.length > 0 || isAdmin) { 
            setNavData(data);
            setIsFirebaseConnected(true); 
            console.log("Successfully loaded data from Firebase.");
        }
      }, 
      // 🚀 错误回调 (Callback 2: Firebase 连接失败时触发此逻辑)
      (error) => {
        // 明确捕获 Firebase 连接失败的错误
        console.warn("Firebase connection failed or blocked. Using fallback strategy.", error.message);
        setIsFirebaseConnected(false);

        // 🚨 关键：调用降级函数
        fetchFallbackData(setNavData);
      }
    );

    return () => unsub();
  }, [db, isAdmin]); // 依赖项

  
  return (
    <div className="App">
      {/* 假设这是您的主渲染组件，它使用 navData */}
      {/* <Header isConnected={isFirebaseConnected} /> */}
      {/* <NavList data={navData} /> */}

      {navData.length === 0 && !isFirebaseConnected && (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          无法连接到数据库，且未加载备用数据。请检查文件路径和控制台错误。
        </div>
      )}

      {/* 假设这是您的 Admin Panel 组件 */}
      {/* {isAdmin && <AdminPanel db={db} />} */}
    </div>
  );
}

export default App;