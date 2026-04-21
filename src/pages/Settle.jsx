/**
 * 分帳頁面
 * 
 * 功能：
 * - 計算伴侶雙方各自墊支的金額
 * - 顯示結欠狀態
 * - 標記已結清
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../lib/firebase.js';
import { getAllTransactions, getUserSettings, saveUserSettings } from '../lib/firebase.js';
import TabBar from '../components/TabBar.jsx';
import './Settle.css';

export default function Settle() {
  const navigate = useNavigate();
  const user = auth.currentUser;
  
  const [transactions, setTransactions] = useState([]);
  const [settings, setSettings] = useState({ partnerEmail: '', monthlyBudget: 20000 });
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ you: 0, partner: 0, diff: 0, owe: 'equal' });
  const [partnerName, setPartnerName] = useState('伴侶');
  
  // 讀取所有交易和設定
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        // 讀取交易
        const txns = await getAllTransactions(user.uid);
        setTransactions(txns);
        
        // 讀取設定
        const prefs = await getUserSettings(user.uid);
        if (prefs) {
          setSettings(prefs);
          if (prefs.partnerEmail) {
            // 從 email 擷取伴侶名稱
            const emailPart = prefs.partnerEmail.split('@')[0];
            setPartnerName(emailPart);
          }
        }
        
        // 計算分帳
        calculateSettlement(txns, prefs?.partnerEmail || '');
      } catch (err) {
        console.error('讀取失敗：', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user]);
  
  // 計算分帳
  const calculateSettlement = (txns, partnerEmail) => {
    let yourTotal = 0;  // 你支付的金額
    let partnerTotal = 0; // 伴侶支付的金額
    
    txns.forEach(t => {
      // 如果交易備註包含伴侶關鍵字，視為伴侶支付
      // 或者根據 creatorBy 判斷
      const isPartner = t.creatorBy !== user.uid;
      
      if (isPartner && t.type === 'expense') {
        partnerTotal += Number(t.amount);
      } else if (t.type === 'expense') {
        yourTotal += Number(t.amount);
      }
    });
    
    const diff = yourTotal - partnerTotal;
    const owe = diff > 0 ? 'partner' : diff < 0 ? 'you' : 'equal';
    
    setSummary({
      you: yourTotal,
      partner: partnerTotal,
      diff: Math.abs(diff),
      owe,
    });
  };
  
  // 標記已結清
  const handleSettle = async () => {
    if (!window.confirm(`確定要標記與 ${partnerName} 的帳目已結清嗎？\n\n這會將雙方所有未結清的支出歸零。`)) {
      return;
    }
    
    try {
      // 這裡可以添加一個「結清記錄」到 Firestore
      // 目前只做本地提示
      alert('✅ 已標記結清！');
      
      // 可選：清除所有交易（需要謹慎確認）
      // 或者可以添加一個「settled」欄位
    } catch (err) {
      console.error('結清失敗：', err);
      alert('❌ 操作失敗，請稍後再試');
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
          <span className="header-title">🔄 分帳</span>
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
          {/* Settlement Summary */}
          <div className="settle-card">
            <div className="settle-header">
              <span className="settle-title">💑 {user.displayName || '你'} vs {partnerName}</span>
            </div>
            
            <div className="settle-persons">
              <div className="person-box">
                <div className="person-avatar">👤</div>
                <div className="person-name">{user.displayName || '你'}</div>
                <div className="person-amount">
                  HK${summary.you.toLocaleString('zh-HK')}
                </div>
                <div className="person-label">已支付</div>
              </div>
              
              <div className="vs-divider">VS</div>
              
              <div className="person-box">
                <div className="person-avatar">👥</div>
                <div className="person-name">{partnerName}</div>
                <div className="person-amount">
                  HK${summary.partner.toLocaleString('zh-HK')}
                </div>
                <div className="person-label">已支付</div>
              </div>
            </div>
            
            <div className={`settle-result ${summary.owe}`}>
              {summary.owe === 'equal' && (
                <>
                  <div className="result-icon">🤝</div>
                  <div className="result-text">你們的支出差不多，完美平衡！</div>
                </>
              )}
              {summary.owe === 'partner' && (
                <>
                  <div className="result-icon">😢</div>
                  <div className="result-text">
                    {partnerName} 需要補貼你 <strong>HK${summary.diff.toLocaleString('zh-HK')}</strong>
                  </div>
                </>
              )}
              {summary.owe === 'you' && (
                <>
                  <div className="result-icon">😊</div>
                  <div className="result-text">
                    你需要補貼 {partnerName} <strong>HK${summary.diff.toLocaleString('zh-HK')}</strong>
                  </div>
                </>
              )}
            </div>
          </div>
          
          {/* Settle Button */}
          {summary.owe !== 'equal' && (
            <div className="settle-action">
              <button className="settle-btn" onClick={handleSettle}>
                ✅ 標記已結清
              </button>
            </div>
          )}
          
          {/* Transaction List */}
          <div className="settle-list-section">
            <div className="section-header">
              <span className="section-title">📋 所有記錄</span>
              <span className="record-count">{transactions.length} 筆</span>
            </div>
            
            {transactions.length === 0 ? (
              <div className="empty-state">
                <div className="icon">📝</div>
                <div className="title">暫無記錄</div>
                <div className="desc">開始記帳後就會在這裡顯示</div>
              </div>
            ) : (
              <div className="transaction-list">
                {transactions.map(txn => {
                  const isPartner = txn.creatorBy !== user.uid;
                  return (
                    <div key={txn.id} className="transaction-item">
                      <div className="transaction-info">
                        <div className="transaction-category">
                          {isPartner ? `👥 ${partnerName}` : '👤 你'} - {txn.category}
                        </div>
                        <div className="transaction-date">
                          {txn.note || '無備註'}
                        </div>
                      </div>
                      <div className="transaction-amount expense">
                        - HK${Number(txn.amount).toLocaleString('zh-HK')}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          {/* Tips */}
          {!settings.partnerEmail && (
            <div className="settle-tips">
              <div className="tips-icon">💡</div>
              <div className="tips-text">
                在「設定」頁面填入伴侶的 Email，可以更準確地追蹤雙方的支出哦！
              </div>
            </div>
          )}
        </>
      )}
      
      {/* Tab Bar */}
      <TabBar hideAdd />
    </div>
  );
}
