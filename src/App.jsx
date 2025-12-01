import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  signInAnonymously,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  onSnapshot,
  doc,
  addDoc,
  deleteDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { ExternalLink, X, Edit3, Trash2, Moon, Sun } from 'lucide-react';

// 🔹 请替换为你的管理员 UID
const ADMIN_USER_ID = '6UiUdmPna4RJb2hNBoXhx3XCTFN2';
const APP_ID = 'default-app-id'; // 默认 appId，可根据你实际修改

// 🔹 调试栏组件
const DebugBar = ({ userId, isAdmin }) => (
  <div style={{
    backgroundColor: '#fff3cd',
    color: '#856404',
    padding: '10px',
    fontSize: '12px',
    fontFamily: 'monospace',
    wordBreak: 'break-all',
  }}>
    <strong>🔧 调试信息:</strong><br/>
    当前用户 UID: <strong>{userId || '未登录'}</strong><br/>
    当前权限: <strong>{isAdmin ? '✅ 管理员' : '❌ 访客'}</strong>
  </div>
);

// 🔹 链接卡片组件
const LinkCard = ({ link, isAdmin, onEdit, onDelete }) => {
  const faviconUrl = useMemo(() => {
    try {
      const urlObj = new URL(link.icon || link.url);
      return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=64`;
    } catch (e) {
      return 'https://placehold.co/40x40/ccc/000?text=L';
    }
  }, [link.icon, link.url]);

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg flex flex-col h-full border border-gray-100 dark:border-gray-700">
      <a href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-4 flex-grow">
        <div className="flex-shrink-0 w-10 h-10 rounded-lg overflow-hidden border bg-gray-50 dark:bg-gray-700 flex items-center justify-center">
          <img src={faviconUrl} alt={link.name} className="w-full h-full object-cover" />
        </div>
        <div className="min-w-0 flex-grow">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">{link.name}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5">{link.description}</p>
        </div>
        <ExternalLink className="w-4 h-4 text-gray-400 dark:text-gray-500" />
      </a>

      {isAdmin && (
        <div className="flex justify-end space-x-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
          <button onClick={() => onEdit(link)} className="p-1.5 rounded-full text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900">
            <Edit3 className="w-5 h-5" />
          </button>
          <button onClick={() => onDelete(link.id)} className="p-1.5 rounded-full text-red-500 hover:bg-red-100 dark:hover:bg-red-900">
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};

// 🔹 公共导航组件
const PublicNav = ({ navData }) => (
  <div className="space-y-8">
    {navData.map(cat => (
      <div key={cat.id || cat.category} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm">
        <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white border-l-4 border-blue-500 pl-3">{cat.category}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {cat.links?.map(link => <LinkCard key={link.id} link={link} isAdmin={false} />)}
        </div>
      </div>
    ))}
  </div>
);

// 🔹 管理面板组件
const AdminPanel = ({ db, navData, fetchData }) => {
  const [newData, setNewData] = useState({ category: '', order: 0, links: [] });
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});

  const navCollection = collection(db, `artifacts/${APP_ID}/public/data/navData`);

  const handleAdd = async () => {
    if (!newData.category) return alert('请输入分类名称');
    await addDoc(navCollection, newData);
    setNewData({ category: '', order: 0, links: [] });
    fetchData();
  };

  const handleDelete = async (id) => {
    await deleteDoc(doc(db, `artifacts/${APP_ID}/public/data/navData`, id));
    fetchData();
  };

  const startEdit = (item) => {
    setEditId(item.id);
    setEditData({ category: item.category, order: item.order, links: item.links });
  };

  const saveEdit = async () => {
    await updateDoc(doc(db, `artifacts/${APP_ID}/public/data/navData`, editId), editData);
    setEditId(null);
    fetchData();
  };

  return (
    <div className="mt-6 p-4 border rounded bg-gray-50 dark:bg-gray-800">
      <h3 className="text-xl font-bold mb-2">管理员面板 (CRUD)</h3>

      {/* 新增 */}
      <div className="flex space-x-2 mb-4">
        <input
          className="border p-2 rounded flex-1"
          placeholder="分类名"
          value={newData.category}
          onChange={(e) => setNewData({ ...newData, category: e.target.value })}
        />
        <input
          type="number"
          className="border p-2 rounded w-24"
          placeholder="排序"
          value={newData.order}
          onChange={(e) => setNewData({ ...newData, order: Number(e.target.value) })}
        />
        <input
          className="border p-2 rounded flex-1"
          placeholder="链接名,url,描述 (用逗号分隔多条)"
          value={newData.links.map(l => `${l.name},${l.url},${l.description}`).join(';')}
          onChange={(e) => {
            const arr = e.target.value.split(';').map(str => {
              const [name, url, description] = str.split(',');
              return { name, url, description };
            });
            setNewData({ ...newData, links: arr });
          }}
        />
        <button onClick={handleAdd} className="bg-blue-500 text-white px-4 rounded hover:bg-blue-600">新增</button>
      </div>

      {/* 数据列表 */}
      <div className="overflow-x-auto">
        <table className="min-w-full table-auto border-collapse border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2">ID</th>
              <th className="border p-2">分类</th>
              <th className="border p-2">排序</th>
              <th className="border p-2">链接</th>
              <th className="border p-2">操作</th>
            </tr>
          </thead>
          <tbody>
            {navData.map(item => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="border p-2">{item.id}</td>
                {editId === item.id ? (
                  <>
                    <td className="border p-2">
                      <input className="border p-1 rounded w-full"
                        value={editData.category}
                        onChange={(e) => setEditData({ ...editData, category: e.target.value })}
                      />
                    </td>
                    <td className="border p-2">
                      <input type="number" className="border p-1 rounded w-full"
                        value={editData.order}
                        onChange={(e) => setEditData({ ...editData, order: Number(e.target.value) })}
                      />
                    </td>
                    <td className="border p-2">
                      <input className="border p-1 rounded w-full"
                        value={editData.links.map(l => `${l.name},${l.url},${l.description}`).join(';')}
                        onChange={(e) => {
                          const arr = e.target.value.split(';').map(str => {
                            const [name, url, description] = str.split(',');
                            return { name, url, description };
                          });
                          setEditData({ ...editData, links: arr });
                        }}
                      />
                    </td>
                    <td className="border p-2 flex space-x-2">
                      <button onClick={saveEdit} className="bg-green-500 text-white px-2 rounded hover:bg-green-600">保存</button>
                      <button onClick={() => setEditId(null)} className="bg-gray-400 text-white px-2 rounded hover:bg-gray-500">取消</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="border p-2">{item.category}</td>
                    <td className="border p-2">{item.order}</td>
                    <td className="border p-2">{item.links.map(l => l.name).join(',')}</td>
                    <td className="border p-2 flex space-x-2">
                      <button onClick={() => startEdit(item)} className="bg-yellow-400 text-white px-2 rounded hover:bg-yellow-500">编辑</button>
                      <button onClick={() => handleDelete(item.id)} className="bg-red-500 text-white px-2 rounded hover:bg-red-600">删除</button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// 🔹 主应用
export default function App() {
  const [firebaseApp, setFirebaseApp] = useState(null);
  const [auth, setAuth] = useState(null);
  const [db, setDb] = useState(null);
  const [userId, setUserId] = useState(null);
  const [navData, setNavData] = useState([]);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
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
    setFirebaseApp(app);
    setAuth(_auth);
    setDb(_db);

    const unsubscribe = onAuthStateChanged(_auth, (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        signInAnonymously(_auth).catch(console.error);
        setUserId('anonymous');
      }
    });
    return unsubscribe;
  }, []);

  const isAdmin = userId === ADMIN_USER_ID;

  // 数据监听
  useEffect(() => {
    if (!db) return;
    const navCol = collection(db, `artifacts/${APP_ID}/public/data/navData`);
    const unsub = onSnapshot(navCol, snapshot => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => (a.order || 0) - (b.order || 0));
      setNavData(data);
    });
    return unsub;
  }, [db]);

  const fetchData = async () => {
    if (!db) return;
    const navCol = collection(db, `artifacts/${APP_ID}/public/data/navData`);
    const snapshot = await getDocs(navCol);
    const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    data.sort((a, b) => (a.order || 0) - (b.order || 0));
    setNavData(data);
  };

  return (
    <div className={`min-h-screen ${isDark ? 'dark bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <DebugBar userId={userId} isAdmin={isAdmin} />

      <div className="container mx-auto px-4 py-8">
        <header className="flex justify-between items-center mb-12">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">极速导航</h1>
          <div className="flex gap-4">
            <button onClick={() => setIsDark(!isDark)} className="p-2 rounded-full bg-gray-200 dark:bg-gray-700">
              {isDark ? <Sun className="w-5 h-5"/> : <Moon className="w-5 h-5"/>}
            </button>
            {isAdmin ? (
              <button onClick={() => signOut(auth)} className="text-red-500">退出管理</button>
            ) : null}
          </div>
        </header>

        {/* 公共导航主页或管理员面板 */}
        {isAdmin ? (
          <AdminPanel db={db} navData={navData} fetchData={fetchData} />
        ) : (
          <PublicNav navData={navData} />
        )}
      </div>
    </div>
  );
}
