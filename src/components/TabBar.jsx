/**
 * TabBar 元件
 * 
 * 底部導航欄
 */

import { useNavigate, useLocation } from 'react-router-dom';

/**
 * TabBar 元件
 * @param {Object} props
 * @param {boolean} props.hideAdd - 是否隱藏中間的「新增」按鈕
 */
export default function TabBar({ hideAdd = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  
  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };
  
  return (
    <div className="tab-bar">
      <button className={`tab-item ${isActive('/dashboard') ? 'active' : ''}`} onClick={() => navigate('/dashboard')}>
        <span className="icon">🏠</span>
        <span>首頁</span>
      </button>
      
      <button className={`tab-item ${isActive('/charts') ? 'active' : ''}`} onClick={() => navigate('/charts')}>
        <span className="icon">📊</span>
        <span>圖表</span>
      </button>
      
      {!hideAdd && (
        <button className="tab-item add" onClick={() => navigate('/add')}>
          <span className="icon">+</span>
        </button>
      )}
      
      <button className={`tab-item ${isActive('/settle') ? 'active' : ''}`} onClick={() => navigate('/settle')}>
        <span className="icon">🔄</span>
        <span>分帳</span>
      </button>
      
      <button className={`tab-item ${isActive('/settings') ? 'active' : ''}`} onClick={() => navigate('/settings')}>
        <span className="icon">⚙️</span>
        <span>設定</span>
      </button>
    </div>
  );
}
