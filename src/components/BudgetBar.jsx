/**
 * BudgetBar 元件
 * 
 * 顯示預算進度條
 */

/**
 * BudgetBar 元件
 * @param {Object} props
 * @param {string} props.title - 預算分類名稱（如 🍽️ 飲食）
 * @param {number} props.spent - 已花費金額
 * @param {number} props.total - 預算總額
 */
export default function BudgetBar({ title, spent, total }) {
  const percentage = total > 0 ? Math.min((spent / total) * 100, 100) : 0;
  const isWarning = percentage >= 80;
  
  return (
    <div className="budget-section">
      <div className="budget-header">
        <span className="budget-title">{title}</span>
        <span className="budget-amount">
          HK${spent.toLocaleString('zh-HK')} / HK${total.toLocaleString('zh-HK')}
        </span>
      </div>
      <div className="budget-bar">
        <div 
          className={`budget-fill ${isWarning ? 'warning' : ''}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
