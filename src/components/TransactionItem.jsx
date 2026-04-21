/**
 * TransactionItem 元件
 * 
 * 顯示單筆交易記錄
 */

import CategoryIcon from './CategoryIcon.jsx';

/**
 * 格式化日期
 * @param {Date|string} date
 * @returns {string}
 */
const formatDate = (date) => {
  const d = date?.toDate ? date.toDate() : new Date(date);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const dateOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  
  if (dateOnly.getTime() === today.getTime()) {
    return `今日 ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  }
  
  if (dateOnly.getTime() === yesterday.getTime()) {
    return `昨日 ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  }
  
  return `${d.getDate()}/${d.getMonth() + 1} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
};

/**
 * 格式化金額
 * @param {number} amount
 * @param {string} type - 'income' | 'expense'
 * @returns {string}
 */
const formatAmount = (amount, type) => {
  const prefix = type === 'income' ? '+' : '-';
  return `${prefix} HK$${amount.toLocaleString('zh-HK')}`;
};

/**
 * TransactionItem 元件
 * @param {Object} props
 * @param {Object} props.transaction - 交易資料
 * @param {Function} props.onClick - 點擊回調
 * @param {Function} props.onDelete - 刪除回調
 */
export default function TransactionItem({ transaction, onClick, onDelete }) {
  const { type, amount, category, note, date } = transaction;
  
  const handleLongPress = (e) => {
    e.preventDefault();
    if (onDelete && window.confirm('確定要刪除這筆記錄嗎？')) {
      onDelete(transaction.id);
    }
  };
  
  return (
    <div 
      className="transaction-item" 
      onClick={() => onClick && onClick(transaction)}
      onContextMenu={onDelete ? handleLongPress : undefined}
    >
      <CategoryIcon category={category} />
      <div className="transaction-info">
        <div className="transaction-category">
          {note || category}
        </div>
        <div className="transaction-date">
          {formatDate(date)}
        </div>
      </div>
      <div className={`transaction-amount ${type}`}>
        {formatAmount(amount, type)}
      </div>
    </div>
  );
}
