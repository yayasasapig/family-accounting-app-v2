/**
 * 設定頁面
 * 
 * 功能：
 * - 每月預算設定
 * - 伴侶 Email 設定
 * - 登出
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, logOut, getUserSettings, saveUserSettings } from '../lib/firebase.js';
import TabBar from '../components/TabBar.jsx';
import './Settings.css';

export default function Settings() {
  const navigate = useNavigate();
  const user = auth.currentUser;
  
  const [monthlyBudget, setMonthlyBudget] = useState(20000);
  const [partnerEmail, setPartnerEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  
  // 讀取設定
  useEffect(() => {
    const fetchSettings = async () => {
      if (!user) return;
      
      try {
        const settings = await getUserSettings(user.uid);
        if (settings) {
          setMonthlyBudget(settings.monthlyBudget || 20000);
          setPartnerEmail(settings.partnerEmail || '');
        }
      } catch (err) {
        console.error('讀取設定失敗：', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSettings();
  }, [user]);
  
  // 顯示 Toast
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };
  
  // 儲存設定
  const handleSave = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      await saveUserSettings(user.uid, {
        monthlyBudget: Number(monthlyBudget),
        partnerEmail: partnerEmail.trim(),
      });
      showToast('✅ 設定已儲存');
    } catch (err) {
      console.error('儲存失敗：', err);
      showToast('❌ 儲存失敗');
    } finally {
      setSaving(false);
    }
  };
  
  // 登出
  const handleLogout = async () => {
    if (!window.confirm('確定要登出嗎？')) return;
    
    try {
      await logOut();
      navigate('/login');
    } catch (err) {
      console.error('登出失敗：', err);
    }
  };
  
  if (!user) {
    navigate('/login');
    return null;
  }
  
  return (
    <div className="page-container">
      {/* Header */}
      <div className="header">
        <div className="header-top">
          <span className="header-title">⚙️ 設定</span>
          <div className="avatar">
            {user.photoURL ? (
              <img src={user.photoURL} alt={user.displayName} />
            ) : (
              <span>{user.displayName?.charAt(0) || '用'}</span>
            )}
          </div>
        </div>
      </div>
      
      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <span className="loading-text">載入中...</span>
        </div>
      ) : (
        <>
          {/* User Info */}
          <div className="settings-card">
            <div className="user-info">
              <div className="user-avatar-large">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName} />
                ) : (
                  <span>{user.displayName?.charAt(0) || '用'}</span>
                )}
              </div>
              <div className="user-details">
                <div className="user-name">{user.displayName || '用戶'}</div>
                <div className="user-email">{user.email}</div>
              </div>
            </div>
          </div>
          
          {/* Budget Settings */}
          <div className="settings-card">
            <div className="settings-title">💰 預算設定</div>
            
            <div className="setting-item">
              <label className="setting-label">每月預算</label>
              <div className="setting-input-group">
                <span className="input-prefix">HK$</span>
                <input
                  type="number"
                  className="setting-input"
                  value={monthlyBudget}
                  onChange={(e) => setMonthlyBudget(e.target.value)}
                  min="0"
                  step="1000"
                />
              </div>
            </div>
            
            <p className="setting-hint">
              設定每月支出上限，超出時首頁會顯示警告
            </p>
          </div>
          
          {/* Partner Settings */}
          <div className="settings-card">
            <div className="settings-title">💑 共享設定</div>
            
            <div className="setting-item">
              <label className="setting-label">伴侶 Email</label>
              <input
                type="email"
                className="setting-input-full"
                value={partnerEmail}
                onChange={(e) => setPartnerEmail(e.target.value)}
                placeholder="partner@example.com"
              />
            </div>
            
            <p className="setting-hint">
              填入伴侶的 Google Email，可更準確地在「分帳」頁面追蹤雙方支出
            </p>
          </div>
          
          {/* Save Button */}
          <div className="settings-actions">
            <button 
              className="save-btn"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? '儲存中...' : '💾 儲存設定'}
            </button>
          </div>
          
          {/* Logout */}
          <div className="settings-card danger-zone">
            <div className="settings-title">🚪 帳戶</div>
            <button className="logout-btn" onClick={handleLogout}>
              登出帳戶
            </button>
          </div>
          
          {/* App Info */}
          <div className="app-info">
            <p>🏠 家庭記帳 App</p>
            <p>版本 2.0 - Firebase Edition</p>
            <p className="copyright">Made with ❤️ for Hong Kong families</p>
          </div>
        </>
      )}
      
      {/* Toast */}
      <div className={`toast ${toast ? 'show' : ''}`}>{toast}</div>
      
      {/* Tab Bar */}
      <TabBar hideAdd />
    </div>
  );
}
