import React, { useEffect, useState } from "react";
import { db } from "./firebase";
import { collection, getDocs, orderBy, query } from "firebase/firestore";

const appId = "default-app-id";

export default function HomePage() {
  const [navList, setNavList] = useState([]);

  useEffect(() => {
    const fetchNav = async () => {
      const navCollection = collection(db, `artifacts/${appId}/public/data/navData`);
      const q = query(navCollection); // 如果有 order 字段，可以加 orderBy("order")
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNavList(list);
    };

    fetchNav();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">导航主页</h1>
      <ul className="space-y-2">
        {navList.map(item => (
          <li key={item.id}>
            <span className="font-bold">{item.category}: </span>
            {(item.links || []).map((link, idx) => (
              <a key={idx} href={link} className="text-blue-500 hover:underline mr-2">
                {link}
              </a>
            ))}
          </li>
        ))}
      </ul>
    </div>
  );
}
