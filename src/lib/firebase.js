/**
 * Firebase 初始化設定
 * 
 * 請先複製 .env.example 為 .env.local 並填入你的 Firebase 設定
 * 取得方式：https://console.firebase.google.com/ → 專案設定 → 你的應用程式 → Web 應用程式
 */

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, getDoc, doc, setDoc, updateDoc, deleteDoc, query, where, orderBy, onSnapshot, serverTimestamp, Timestamp } from 'firebase/firestore';

// Firebase 設定（從環境變數讀取）
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);

// 導出認證相關
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();

/**
 * 用 Google 帳戶登入
 * @returns {Promise<User>} 用戶資料
 */
export const signInWithGoogle = async () => {
  const result = await signInWithPopup(auth, provider);
  // 登入成功後，建立或更新用戶文檔
  const userRef = doc(db, 'users', result.user.uid);
  const userSnap = await getDoc(userRef);
  
  if (!userSnap.exists()) {
    // 新用戶，建立用戶文檔
    await setDoc(userRef, {
      displayName: result.user.displayName || '用戶',
      email: result.user.email,
      createdAt: serverTimestamp(),
    });
  }
  
  return result.user;
};

/**
 * 登出
 * @returns {Promise<void>}
 */
export const logOut = async () => {
  await signOut(auth);
};

// 導出 Firestore
export const db = getFirestore(app);

/**
 * Firestore 工具函數
 */

// === 用戶相關 ===

/**
 * 取得用戶設定
 * @param {string} userId
 * @returns {Promise<Object|null>}
 */
export const getUserSettings = async (userId) => {
  const settingsRef = doc(db, 'users', userId, 'settings', 'prefs');
  const snap = await getDoc(settingsRef);
  return snap.exists() ? snap.data() : null;
};

/**
 * 儲存用戶設定
 * @param {string} userId
 * @param {Object} settings
 */
export const saveUserSettings = async (userId, settings) => {
  const settingsRef = doc(db, 'users', userId, 'settings', 'prefs');
  await setDoc(settingsRef, settings, { merge: true });
};

// === 交易記錄相關 ===

/**
 * 新增交易記錄
 * @param {string} userId
 * @param {Object} data - { type, amount, category, note, date }
 * @returns {Promise<string>} 新記錄的 ID
 */
export const addTransaction = async (userId, data) => {
  const transactionsRef = collection(db, 'users', userId, 'transactions');
  const docRef = await addDoc(transactionsRef, {
    ...data,
    createdBy: userId,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};

/**
 * 取得指定月份的交易記錄
 * @param {string} userId
 * @param {number} year
 * @param {number} month (0-11)
 * @returns {Promise<Array>}
 */
export const getMonthlyTransactions = async (userId, year, month) => {
  const transactionsRef = collection(db, 'users', userId, 'transactions');
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0, 23, 59, 59);
  
  const q = query(
    transactionsRef,
    where('date', '>=', Timestamp.fromDate(startDate)),
    where('date', '<=', Timestamp.fromDate(endDate)),
    orderBy('date', 'desc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

/**
 * 刪除交易記錄
 * @param {string} userId
 * @param {string} transactionId
 */
export const deleteTransaction = async (userId, transactionId) => {
  const docRef = doc(db, 'users', userId, 'transactions', transactionId);
  await deleteDoc(docRef);
};

/**
 * 取得所有交易記錄（用於分帳）
 * @param {string} userId
 * @returns {Promise<Array>}
 */
export const getAllTransactions = async (userId) => {
  const transactionsRef = collection(db, 'users', userId, 'transactions');
  const q = query(transactionsRef, orderBy('date', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

/**
 * 即時監聽月度交易（用於 Dashboard 實時更新）
 * @param {string} userId
 * @param {number} year
 * @param {number} month
 * @param {Function} callback
 * @returns {Function} 取消訂閱函數
 */
export const subscribeToMonthlyTransactions = (userId, year, month, callback) => {
  const transactionsRef = collection(db, 'users', userId, 'transactions');
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0, 23, 59, 59);
  
  const q = query(
    transactionsRef,
    where('date', '>=', Timestamp.fromDate(startDate)),
    where('date', '<=', Timestamp.fromDate(endDate)),
    orderBy('date', 'desc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const transactions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(transactions);
  });
};

// === 分帳相關 ===

/**
 * 標記分帳結清
 * @param {string} userId
 * @param {string} recordId
 * @param {boolean} settled
 */
export const markSettled = async (userId, recordId, settled) => {
  const recordRef = doc(db, 'users', userId, 'settlements', recordId);
  await setDoc(recordRef, { settled, settledAt: serverTimestamp() }, { merge: true });
};

// 導出認證狀態監聽
export { onAuthStateChanged };
