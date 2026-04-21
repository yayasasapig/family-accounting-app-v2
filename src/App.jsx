/**
 * App 主元件
 * 
 * 路由設定：
 * - /login - 登入頁
 * - /dashboard - 首頁
 * - /add - 新增記帳
 * - /charts - 圖表
 * - /settle - 分帳
 * - /settings - 設定
 */

import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './lib/firebase.js';

import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import AddTransaction from './pages/AddTransaction.jsx';
import Charts from './pages/Charts.jsx';
import Settle from './pages/Settle.jsx';
import Settings from './pages/Settings.jsx';

/**
 * 需要登入的路由包裝元件
 */
function RequireAuth({ children }) {
  const [user, setUser] = useState(auth.currentUser);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);
  
  if (loading) {
    return (
      <div className="loading-container" style={{ minHeight: '100vh' }}>
        <div className="loading-spinner"></div>
        <span className="loading-text">載入中...</span>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
}

/**
 * 已經登入就跳轉首頁
 */
function AlreadyAuth({ children }) {
  const [user, setUser] = useState(auth.currentUser);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);
  
  if (loading) {
    return (
      <div className="loading-container" style={{ minHeight: '100vh' }}>
        <div className="loading-spinner"></div>
        <span className="loading-text">載入中...</span>
      </div>
    );
  }
  
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
}

/**
 * 主路由元件
 */
function AppRoutes() {
  return (
    <Routes>
      <Route 
        path="/login" 
        element={
          <AlreadyAuth>
            <Login />
          </AlreadyAuth>
        } 
      />
      <Route 
        path="/dashboard" 
        element={
          <RequireAuth>
            <Dashboard />
          </RequireAuth>
        } 
      />
      <Route 
        path="/add" 
        element={
          <RequireAuth>
            <AddTransaction />
          </RequireAuth>
        } 
      />
      <Route 
        path="/charts" 
        element={
          <RequireAuth>
            <Charts />
          </RequireAuth>
        } 
      />
      <Route 
        path="/settle" 
        element={
          <RequireAuth>
            <Settle />
          </RequireAuth>
        } 
      />
      <Route 
        path="/settings" 
        element={
          <RequireAuth>
            <Settings />
          </RequireAuth>
        } 
      />
      {/* 預設路由：已登入→首頁，未登入→登入 */}
      <Route 
        path="/" 
        element={
          <RequireAuth>
            <Dashboard />
          </RequireAuth>
        } 
      />
      {/* 404 */}
      <Route 
        path="*" 
        element={<Navigate to="/" replace />} 
      />
    </Routes>
  );
}

/**
 * App 根元件
 */
export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
