import React, { useEffect, useState } from "react";
import { db, auth } from "./firebase"; // 请确保已初始化
import { collection, getDocs, addDoc, doc, deleteDoc, updateDoc } from "firebase/firestore";

const ADMIN_USER_ID = '6UiUdmPna4RJb2hNBoXhx3XCTFN2';
const appId = 'default-app-id';

export default function AdminPanel() {
  const [dataList, setDataList] = useState([]);
  const [newData, setNewData] = useState({ category: "", order: 0, links: [] });
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});

  const navCollection = collection(db, `artifacts/${appId}/public/data/navData`);
  const isAdmin = auth.currentUser?.uid === 6UiUdmPna4RJb2hNBoXhx3XCTFN2;

  const fetchData = async () => {
    const snapshot = await getDocs(navCollection);
    const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setDataList(list);
  };

  useEffect(() => {
    if (isAdmin) fetchData();
  }, [isAdmin]);

  const handleAdd = async () => {
    if (!newData.category) return alert("请输入 category");
    await addDoc(navCollection, newData);
    setNewData({ category: "", order: 0, links: [] });
    fetchData();
  };

  const handleDelete = async (id) => {
    const docRef = doc(db, `artifacts/${appId}/public/data/navData`, id);
    await deleteDoc(docRef);
    fetchData();
  };

  const startEdit = (item) => {
    setEditId(item.id);
    setEditData({ category: item.category, order: item.order, links: item.links });
  };

  const saveEdit = async () => {
    const docRef = doc(db, `artifacts/${appId}/public/data/navData`, editId);
    await updateDoc(docRef, editData);
    setEditId(null);
    fetchData();
  };

  if (!isAdmin) return <div className="p-4 text-red-500">你不是管理员</div>;

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold mb-4">管理面板</h2>

      {/* 新增数据表单 */}
      <div className="flex space-x-2 mb-4">
        <input
          className="border p-2 rounded flex-1"
          placeholder="Category"
          value={newData.category}
          onChange={e => setNewData({ ...newData, category: e.target.value })}
        />
        <input
          type="number"
          className="border p-2 rounded w-24"
          placeholder="Order"
          value={newData.order}
          onChange={e => setNewData({ ...newData, order: Number(e.target.value) })}
        />
        <input
          className="border p-2 rounded flex-1"
          placeholder="Links (comma-separated)"
          value={newData.links.join(",")}
          onChange={e => setNewData({ ...newData, links: e.target.value.split(",") })}
        />
        <button
          onClick={handleAdd}
          className="bg-blue-500 text-white px-4 rounded hover:bg-blue-600"
        >
          新增
        </button>
      </div>

      {/* 数据列表 */}
      <div className="overflow-x-auto">
        <table className="min-w-full table-auto border-collapse border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2">ID</th>
              <th className="border p-2">Category</th>
              <th className="border p-2">Order</th>
              <th className="border p-2">Links</th>
              <th className="border p-2">操作</th>
            </tr>
          </thead>
          <tbody>
            {dataList.map(item => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="border p-2">{item.id}</td>
                {editId === item.id ? (
                  <>
                    <td className="border p-2">
                      <input
                        className="border p-1 rounded w-full"
                        value={editData.category}
                        onChange={e => setEditData({ ...editData, category: e.target.value })}
                      />
                    </td>
                    <td className="border p-2">
                      <input
                        type="number"
                        className="border p-1 rounded w-full"
                        value={editData.order}
                        onChange={e => setEditData({ ...editData, order: Number(e.target.value) })}
                      />
                    </td>
                    <td className="border p-2">
                      <input
                        className="border p-1 rounded w-full"
                        value={editData.links.join(",")}
                        onChange={e => setEditData({ ...editData, links: e.target.value.split(",") })}
                      />
                    </td>
                    <td className="border p-2 flex space-x-2">
                      <button
                        onClick={saveEdit}
                        className="bg-green-500 text-white px-2 rounded hover:bg-green-600"
                      >
                        保存
                      </button>
                      <button
                        onClick={() => setEditId(null)}
                        className="bg-gray-400 text-white px-2 rounded hover:bg-gray-500"
                      >
                        取消
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="border p-2">{item.category}</td>
                    <td className="border p-2">{item.order}</td>
                    <td className="border p-2">{(item.links || []).join(",")}</td>
                    <td className="border p-2 flex space-x-2">
                      <button
                        onClick={() => startEdit(item)}
                        className="bg-yellow-400 text-white px-2 rounded hover:bg-yellow-500"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="bg-red-500 text-white px-2 rounded hover:bg-red-600"
                      >
                        删除
                      </button>
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
}
