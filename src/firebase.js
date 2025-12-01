// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// ⚠️ 用你自己的 Firebase 配置替换下面内容
const firebaseConfig = {
  apiKey: "AIzaSyAlkYbLP4jW1P-XRJtCvC6id8GlIxxY8m4",
  authDomain: "wangzhandaohang.firebaseapp.com",
  projectId: "wangzhandaohang",
  storageBucket: "wangzhandaohang.firebasestorage.app",
  messagingSenderId: "169263636408",
  appId: "1:169263636408:web:ee3608652b2872a539b94d"
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
