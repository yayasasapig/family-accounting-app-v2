/**
 * 新增記帳頁面
 * 
 * 功能：
 * - 收入/支出切換
 * - 金額輸入
 * - 類別選擇
 * - 日期選擇
 * - 備註輸入
 * - 語音輸入（Web Speech API）
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../lib/firebase.js';
import { addTransaction } from '../lib/firebase.js';
import TabBar from '../components/TabBar.jsx';
import { CATEGORIES } from '../components/CategoryIcon.jsx';
import './AddTransaction.css';

export default function AddTransaction() {
  const navigate = useNavigate();
  const user = auth.currentUser;
  
  const [type, setType] = useState('expense'); // 'income' | 'expense'
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('food');
  const [date, setDate] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');
  
  // 語音識別狀態
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);
  
  // 初始化日期為今天
  useEffect(() => {
    const today = new Date();
    setDate(today.toISOString().split('T')[0]);
  }, []);
  
  // 檢查瀏覽器是否支援語音識別
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recog = new SpeechRecognition();
      recog.lang = 'zh-Hant-HK';
      recog.continuous = false;
      recog.interimResults = false;
      
      recog.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        processTranscript(transcript);
      };
      
      recog.onerror = (event) => {
        if (event.error !== 'no-speech') {
          showToast('❌ 語音辨識錯誤');
        }
        setIsListening(false);
      };
      
      recog.onend = () => {
        setIsListening(false);
      };
      
      setRecognition(recog);
    }
  }, []);
  
  // 處理語音輸入
  const processTranscript = (transcript) => {
    // 解析金額：「50蚊」、「50元」
    const amountMatch = transcript.match(/(\d+)[蚊元]?/);
    if (amountMatch && !amount) {
      setAmount(amountMatch[1]);
      showToast('💰 已自動填入金額');
    }
    
    // 解析類別關鍵字
    const categoryKeywords = {
      'food': ['茶餐廳', '午餐', '早餐', '晚飯', '食飯', '餐廳', '麥當勞', 'KFC'],
      'transport': ['港鐵', '地鐵', '巴士', '的士', 'Uber'],
      'shopping': ['Uniqlo', '網購', '淘寶', '超市', '惠康', '百佳'],
      'rent': ['租金', '屋租', '管理費'],
      'medical': ['醫院', '藥房', '醫療', '診所'],
      'entertainment': ['電影', '戲票', 'Netflix', 'Disney+'],
      'salary': ['人工', '薪水', '薪酬', '糧單'],
      'other': ['轉帳', '其他'],
    };
    
    for (const [cat, keywords] of Object.entries(categoryKeywords)) {
      for (const keyword of keywords) {
        if (transcript.includes(keyword)) {
          setCategory(cat);
          showToast('📂 已自動選擇類別');
          break;
        }
      }
    }
    
    // 設定備註（清理後的文字）
    let cleanedNote = transcript
      .replace(/\d+[蚊元]?/g, '')
      .replace(/午餐|早餐|晚飯|茶餐廳|餐廳/g, '')
      .trim();
    
    if (cleanedNote && !note) {
      setNote(cleanedNote);
    }
  };
  
  // 切換語音輸入
  const toggleVoice = () => {
    if (!recognition) {
      showToast('❌ 您的瀏覽器不支援語音輸入');
      return;
    }
    
    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
      setIsListening(true);
      showToast('🎤 請開始說話...');
    }
  };
  
  // 顯示 Toast
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };
  
  // 提交記錄
  const handleSubmit = async () => {
    if (!amount || Number(amount) <= 0) {
      showToast('❌ 請輸入金額');
      return;
    }
    
    setLoading(true);
    
    try {
      const dateTimestamp = new Date(date);
      dateTimestamp.setHours(12, 0, 0, 0);
      
      await addTransaction(user.uid, {
        type,
        amount: Number(amount),
        category,
        note: note.trim(),
        date: dateTimestamp,
      });
      
      showToast('✅ 記錄成功！');
      
      // 重置表單
      setAmount('');
      setNote('');
      setCategory('food');
      
      // 延遲跳轉
      setTimeout(() => navigate('/dashboard'), 1000);
    } catch (err) {
      console.error('儲存失敗：', err);
      showToast('❌ 儲存失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  };
  
  // 選擇類別
  const handleCategorySelect = (cat) => {
    setCategory(cat);
  };
  
  if (!user) {
    navigate('/login');
    return null;
  }
  
  return (
    <div className="page-container">
      {/* Header */}
      <div className="add-header">
        <button className="back-btn" onClick={() => navigate('/dashboard')}>←</button>
        <span className="header-title">新增記錄</span>
        <div style={{ width: 36 }}></div>
      </div>
      
      {/* Type Toggle */}
      <div className="type-toggle">
        <button 
          className={`toggle-btn income ${type === 'income' ? 'active' : ''}`}
          onClick={() => setType('income')}
        >
          💰 收入
        </button>
        <button 
          className={`toggle-btn expense ${type === 'expense' ? 'active' : ''}`}
          onClick={() => setType('expense')}
        >
          💸 支出
        </button>
      </div>
      
      {/* Amount Input */}
      <div className="amount-section">
        <div className="amount-label">輸入金額</div>
        <div className="amount-input-wrapper">
          <span className="currency">HK$</span>
          <input
            type="number"
            className="amount-input"
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputMode="decimal"
          />
        </div>
      </div>
      
      {/* Category Grid */}
      <div className="category-section">
        <div className="section-title">選擇類別</div>
        <div className="category-grid">
          {Object.entries(CATEGORIES).map(([key, { icon, label }]) => (
            <button
              key={key}
              className={`category-item ${category === key ? 'selected' : ''}`}
              onClick={() => handleCategorySelect(key)}
            >
              <span className="category-icon">{icon}</span>
              <span className="category-name">{label}</span>
            </button>
          ))}
        </div>
      </div>
      
      {/* Date Input */}
      <div className="date-section">
        <div className="input-group">
          <span className="input-icon">📅</span>
          <span className="input-label">日期</span>
          <input
            type="date"
            className="date-input"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
      </div>
      
      {/* Note Input */}
      <div className="note-section">
        <div className="section-title">備註</div>
        <div className="note-input-wrapper">
          <textarea
            className="note-input"
            placeholder="加入備註...（選填）"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <button 
            className={`voice-btn ${isListening ? 'listening' : ''}`}
            onClick={toggleVoice}
            type="button"
          >
            🎤
          </button>
        </div>
      </div>
      
      {/* Submit Button */}
      <div className="submit-section">
        <button 
          className="submit-btn"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? '儲存中...' : '✓ 確認記錄'}
        </button>
      </div>
      
      {/* Toast */}
      <div className={`toast ${toast ? 'show' : ''}`}>{toast}</div>
      
      {/* Tab Bar */}
      <TabBar hideAdd />
    </div>
  );
}
