/**
 * CategoryIcon 元件
 * 
 * 根據類別顯示對應的 Emoji Icon 和背景顏色
 */

const CATEGORIES = {
  food: { icon: '🍜', label: '餐飲', bgClass: 'icon-food' },
  transport: { icon: '🚇', label: '交通', bgClass: 'icon-transport' },
  shopping: { icon: '🛒', label: '購物', bgClass: 'icon-shopping' },
  rent: { icon: '🏠', label: '屋租', bgClass: 'icon-rent' },
  medical: { icon: '🏥', label: '醫療', bgClass: 'icon-medical' },
  entertainment: { icon: '🎮', label: '娛樂', bgClass: 'icon-entertainment' },
  salary: { icon: '💰', label: '薪酬', bgClass: 'icon-salary' },
  other: { icon: '📦', label: '其他', bgClass: 'icon-other' },
};

/**
 * 取得類別資料
 * @param {string} category - 類別 key
 * @returns {Object} { icon, label, bgClass }
 */
export const getCategoryInfo = (category) => {
  return CATEGORIES[category] || CATEGORIES.other;
};

/**
 * CategoryIcon 元件
 * @param {Object} props
 * @param {string} props.category - 類別 key
 * @param {string} props.size - 'small' | 'normal' (預設 'normal')
 */
export default function CategoryIcon({ category, size = 'normal' }) {
  const info = getCategoryInfo(category);
  const sizeClass = size === 'small' ? 'transaction-icon-sm' : '';
  
  return (
    <div className={`transaction-icon ${info.bgClass} ${sizeClass}`}>
      {info.icon}
    </div>
  );
}

export { CATEGORIES };
