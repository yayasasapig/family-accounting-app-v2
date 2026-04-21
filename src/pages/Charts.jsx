/**
 * 圖表頁面
 * 
 * 顯示：
 * - 月份甜甜圈圖（支出分佈）
 * - 月份柱狀圖（每日支出）
 * - 月份切換
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../lib/firebase.js';
import { getMonthlyTransactions } from '../lib/firebase.js';
import TabBar from '../components/TabBar.jsx';
import './Charts.css';

const MONTH_NAMES = [
  '1月', '2月', '3月', '4月', '5月', '6月',
  '7月', '8月', '9月', '10月', '11月', '12月'
];

const CATEGORY_COLORS = {
  food: '#F59E0B',
  transport: '#3B82F6',
  shopping: '#EC4899',
  rent: '#8B5CF6',
  medical: '#EF4444',
  entertainment: '#A855F7',
  salary: '#22C55E',
  other: '#6B7280',
};

const CATEGORY_LABELS = {
  food: '🍽️ 餐飲',
  transport: '🚇 交通',
  shopping: '🛒 購物',
  rent: '🏠 屋租',
  medical: '🏥 醫療',
  entertainment: '🎮 娛樂',
  salary: '💰 薪酬',
  other: '📦 其他',
};

/**
 * 甜甜圈圖組件（CSS/SVG 实现）
 */
function DonutChart({ data, total }) {
  if (!data || data.length === 0 || total === 0) {
    return (
      <div className="donut-empty">
        <span>暫無數據</span>
      </div>
    );
  }
  
  let currentAngle = -90; // 從頂部開始
  const paths = [];
  
  data.forEach((item) => {
    const percentage = item.value / total;
    const angle = percentage * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    
    // 計算扇形路徑
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    
    const x1 = 50 + 40 * Math.cos(startRad);
    const y1 = 50 + 40 * Math.sin(startRad);
    const x2 = 50 + 40 * Math.cos(endRad);
    const y2 = 50 + 40 * Math.sin(endRad);
    
    const largeArc = angle > 180 ? 1 : 0;
    
    paths.push(
      <path
        key={item.category}
        d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`}
        fill={CATEGORY_COLORS[item.category] || '#6B7280'}
      />
    );
    
    currentAngle = endAngle;
  });
  
  return (
    <div className="donut-chart">
      <svg viewBox="0 0 100 100" className="donut-svg">
        {paths}
        <circle cx="50" cy="50" r="25" fill="white" />
      </svg>
      <div className="donut-center">
        <div className="donut-total-label">總支出</div>
        <div className="donut-total-value">HK${total.toLocaleString('zh-HK')}</div>
      </div>
    </div>
  );
}

/**
 * 柱狀圖組件
 */
function BarChart({ data, maxValue }) {
  if (!data || data.length === 0) {
    return (
      <div className="bar-empty">
        <span>暫無數據</span>
      </div>
    );
  }
  
  return (
    <div className="bar-chart">
      {data.map((item, index) => {
        const height = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
        return (
          <div key={index} className="bar-item">
            <div 
              className="bar-fill"
              style={{ height: `${Math.max(height, 2)}%` }}
              title={`${item.date}：HK$${item.value.toLocaleString('zh-HK')}`}
            />
            <span className="bar-label">{item.date}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function Charts() {
  const navigate = useNavigate();
  const user = auth.currentUser;
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  // 讀取月度交易
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        const data = await getMonthlyTransactions(user.uid, year, month);
        setTransactions(data);
      } catch (err) {
        console.error('讀取失敗：', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user, year, month]);
  
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
  
  // 計算支出分佈（用於甜甜圈圖）
  const calculateCategoryData = () => {
    const categoryTotals = {};
    let totalExpense = 0;
    
    transactions.forEach(t => {
      if (t.type === 'expense') {
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + Number(t.amount);
        totalExpense += Number(t.amount);
      }
    });
    
    const data = Object.entries(categoryTotals)
      .map(([category, value]) => ({ category, value }))
      .sort((a, b) => b.value - a.value);
    
    return { data, total: totalExpense };
  };
  
  // 計算每日支出（用於柱狀圖）
  const calculateDailyData = () => {
    const dailyTotals = {};
    
    transactions.forEach(t => {
      if (t.type === 'expense') {
        const d = t.date?.toDate ? t.date.toDate() : new Date(t.date);
        const dateKey = d.getDate().toString();
        dailyTotals[dateKey] = (dailyTotals[dateKey] || 0) + Number(t.amount);
      }
    });
    
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const data = [];
    let maxValue = 0;
    
    for (let i = 1; i <= daysInMonth; i++) {
      const value = dailyTotals[i.toString()] || 0;
      data.push({ date: `${i}日`, value });
      maxValue = Math.max(maxValue, value);
    }
    
    return { data, maxValue };
  };
  
  const { data: categoryData, total: totalExpense } = calculateCategoryData();
  const { data: dailyData, maxValue: maxDailyValue } = calculateDailyData();
  
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
          <span className="header-title">📊 統計圖表</span>
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
      
      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <span className="loading-text">載入中...</span>
        </div>
      ) : (
        <>
          {/* Donut Chart - 支出分佈 */}
          <div className="chart-section">
            <div className="chart-card">
              <div className="chart-title">💳 支出分佈</div>
              <DonutChart data={categoryData} total={totalExpense} />
              
              {/* Legend */}
              <div className="donut-legend">
                {categoryData.map(({ category, value }) => (
                  <div key={category} className="legend-item">
                    <span 
                      className="legend-color"
                      style={{ background: CATEGORY_COLORS[category] || '#6B7280' }}
                    />
                    <span className="legend-label">{CATEGORY_LABELS[category] || category}</span>
                    <span className="legend-value">HK${value.toLocaleString('zh-HK')}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Bar Chart - 每日支出 */}
          <div className="chart-section">
            <div className="chart-card">
              <div className="chart-title">📅 每日支出</div>
              <BarChart data={dailyData} maxValue={maxDailyValue} />
            </div>
          </div>
          
          {/* 收支總結 */}
          <div className="summary-section">
            <div className="summary-row">
              <span className="summary-label">💰 總收入</span>
              <span className="summary-value income">
                HK${transactions
                  .filter(t => t.type === 'income')
                  .reduce((sum, t) => sum + Number(t.amount), 0)
                  .toLocaleString('zh-HK')}
              </span>
            </div>
            <div className="summary-row">
              <span className="summary-label">💸 總支出</span>
              <span className="summary-value expense">
                HK${totalExpense.toLocaleString('zh-HK')}
              </span>
            </div>
            <div className="summary-row total">
              <span className="summary-label">📊 本月結餘</span>
              <span className={`summary-value ${totalExpense > 0 ? 'expense' : 'income'}`}>
                {totalExpense > 0 ? '-' : '+'}HK${Math.abs(
                  transactions
                    .filter(t => t.type === 'income')
                    .reduce((sum, t) => sum + Number(t.amount), 0) - totalExpense
                ).toLocaleString('zh-HK')}
              </span>
            </div>
          </div>
        </>
      )}
      
      {/* Tab Bar */}
      <TabBar hideAdd />
    </div>
  );
}
