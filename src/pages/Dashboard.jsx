/**
 * 首頁（儀表板）
 * 
 * 顯示：
 * - 月度收支概覽
 * - 預算進度
 * - 最近交易記錄
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../lib/firebase.js';
import { subscribeToMonthlyTransactions, deleteTransaction } from '../lib/firebase.js';
import TabBar from '../components/TabBar.jsx';
import TransactionItem from '../components/TransactionItem.jsx';
import BudgetBar from '../components/BudgetBar.jsx';
import './Dashboard.css';

const MONTH_NAMES = [
  '1月', '2月', '3月', '4月', '5月', '6月',
  '7月', '8月', '9月', '10月', '11月', '12月'
];

// 預設預算設定（每個類別）
const DEFAULT_BUDGETS = {
  food: 10000,
  transport: 3000,
  shopping: 5000,
  rent: 0,
  medical: 2000,
  entertainment: 2000,
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(auth.currentUser);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ income: 0, expense: 0, balance: 0 });
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  // 訂閱即時交易更新
  useEffect(() => {
    if (!user) return;
    
    setLoading(true);
    const unsubscribe = subscribeToMonthlyTransactions(user.uid, year, month, (data) => {
      setTransactions(data);
      setLoading(false);
      calculateSummary(data);
    });
    
    return () => unsubscribe();
  }, [user, year, month]);
  
  // 計算收支概覽
  const calculateSummary = (txns) => {
    let income = 0;
    let expense = 0;
    
    txns.forEach(t => {
      if (t.type === 'income') {
        income += Number(t.amount);
      } else {
        expense += Number(t.amount);
      }
    });
    
    setSummary({
      income,
      expense,
      balance: income - expense,
    });
  };
  
  // 切換月份
  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };
  
  const nextMonth = () => {
    const now = new Date();
    const next = new Date(year, month + 1, 1);
    if (next <= now) {
      setCurrentDate(next);
    }
  };
  
  // 刪除交易
  const handleDelete = async (id) => {
    try {
      await deleteTransaction(user.uid, id);
    } catch (err) {
      console.error('刪除失敗：', err);
    }
  };
  
  // 計算各類別支出（用於預算進度）
  const calculateCategorySpending = () => {
    const spending = {};
    transactions.forEach(t => {
      if (t.type === 'expense') {
        spending[t.category] = (spending[t.category] || 0) + Number(t.amount);
      }
    });
    return spending;
  };
  
  const spending = calculateCategorySpending();
  const canGoNext = () => {
    const next = new Date(year, month + 1, 1);
    return next <= new Date();
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
          <span className="header-title">👋 你好啊！</span>
          <div className="avatar">
            {user.photoURL ? (
              <img src={user.photoURL} alt={user.displayName} />
            ) : (
              <span>{user.displayName?.charAt(0) || '用'}</span>
            )}
          </div>
        </div>
        <div className="month-selector">
          <button onClick={prevMonth}>‹</button>
          <span>{year}年{MONTH_NAMES[month]}</span>
          <button onClick={nextMonth} disabled={!canGoNext()}>›</button>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card income">
          <div className="summary-label">收入</div>
          <div className="summary-value income">
            + HK${summary.income.toLocaleString('zh-HK')}
          </div>
        </div>
        <div className="summary-card expense">
          <div className="summary-label">支出</div>
          <div className="summary-value expense">
            - HK${summary.expense.toLocaleString('zh-HK')}
          </div>
        </div>
        <div className="summary-card balance">
          <div className="summary-label">本月結餘</div>
          <div className="summary-value">
            {summary.balance >= 0 ? '+' : '-'} HK${Math.abs(summary.balance).toLocaleString('zh-HK')}
          </div>
        </div>
      </div>
      
      {/* Budget Progress */}
      {Object.entries(DEFAULT_BUDGETS).map(([cat, budget]) => {
        if (budget <= 0) return null;
        const spent = spending[cat] || 0;
        const labels = {
          food: '🍽️ 飲食',
          transport: '🚇 交通',
          shopping: '🛒 購物',
          rent: '🏠 屋租',
          medical: '🏥 醫療',
          entertainment: '🎮 娛樂',
        };
        return (
          <BudgetBar 
            key={cat}
            title={labels[cat] || cat}
            spent={spent}
            total={budget}
          />
        );
      })}
      
      {/* Recent Transactions */}
      <div className="transactions-section">
        <div className="section-header">
          <span className="section-title">📋 最近的記錄</span>
          <button className="see-all" onClick={() => navigate('/charts')}>查看全部</button>
        </div>
        
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <span className="loading-text">載入中...</span>
          </div>
        ) : transactions.length === 0 ? (
          <div className="empty-state">
            <div className="icon">📝</div>
            <div className="title">暫無記錄</div>
            <div className="desc">點擊下方 + 按鈕新增第一筆記錄吧！</div>
          </div>
        ) : (
          <div className="transaction-list">
            {transactions.slice(0, 10).map(txn => (
              <TransactionItem
                key={txn.id}
                transaction={txn}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* FAB */}
      <button className="fab" onClick={() => navigate('/add')}>+</button>
      
      {/* Tab Bar */}
      <TabBar />
    </div>
  );
}
