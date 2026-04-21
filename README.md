# 🏠 家庭記帳 App - Firebase 版本

香港兩公婆家庭記帳 Web App，使用 React + Firebase 開發，真係可以運作！

## ✨ 功能特色

- 🔐 **Google 登入** - 簡單安全嘅認證方式
- 📊 **儀表板** - 一眼看清楚每月收支
- ➕ **快速記帳** - 語音輸入，自動辨識類別
- 📈 **統計圖表** - 甜甜圈圖 + 柱狀圖分析
- 💑 **分帳功能** - 清楚顯示邊個墊多咗
- ⚙️ **個人設定** - 預算、伴侶共享設定
- 📱 **手機優先** - 完美適配移動端

## 🚀 快速開始

### 1. 安裝依賴

```bash
npm install
```

### 2. 設定 Firebase

#### 步驟 A：創建 Firebase 專案

1. 去 [Firebase Console](https://console.firebase.google.com/)
2. 點擊「新增專案」→ 輸入專案名稱 → 跟指示完成
3. 建立專案後，進入「專案設定」

#### 步驟 B：開啟Authentication

1. 左側選單 →「Authentication」→「開始使用」
2. 在「Sign-in method」分頁
3. 點擊「Google」→ 開關「啟用」
4. 選擇專案電子郵件支援 →「儲存」

#### 步驟 C：創建 Firestore Database

1. 左側選單 →「Firestore Database」→「建立資料庫」
2. 選擇「測試模式」開始（之後可以改規則）
3. 選擇靠近的位置（如：香港 → asia-east1）

#### 步驟 D：取得 Firebase 設定

1. 去「專案設定」（頁面頂部齒輪圖示）
2. 向下捲動到「你的應用程式」
3. 點擊「</>」Web 應用程式圖示
4. 註冊應用程式（輸入暱稱）
5. 複製 `firebaseConfig` 物件

#### 步驟 E：設定環境變數

```bash
# 複製範例檔案
cp .env.example .env.local

# 編輯 .env.local，填入你的 Firebase 設定
```

```env
VITE_FIREBASE_API_KEY=你的API_KEY
VITE_FIREBASE_AUTH_DOMAIN=你的AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID=你的PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET=你的STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID=你的MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID=你的APP_ID
```

### 3. 啟動開發伺服器

```bash
npm run dev
```

打開瀏覽器訪問 `http://localhost:5173`

## 📁 專案結構

```
family-accounting-app-firebase/
├── src/
│   ├── components/          # 可重用元件
│   │   ├── TabBar.jsx       # 底部導航
│   │   ├── TransactionItem.jsx  # 交易列表項目
│   │   ├── BudgetBar.jsx    # 預算進度條
│   │   └── CategoryIcon.jsx # 類別 Emoji 圖示
│   ├── pages/               # 頁面元件
│   │   ├── Login.jsx        # 登入頁
│   │   ├── Dashboard.jsx    # 首頁
│   │   ├── AddTransaction.jsx  # 新增記帳
│   │   ├── Charts.jsx       # 圖表頁
│   │   ├── Settle.jsx      # 分帳頁
│   │   └── Settings.jsx    # 設定頁
│   ├── lib/
│   │   └── firebase.js      # Firebase 初始化及工具函數
│   ├── App.jsx              # 主應用元件
│   ├── App.css              # 全域樣式
│   └── main.jsx             # 入口點
├── .env.example             # 環境變數範例
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

## 🗄️ Firestore 資料結構

```
users/{userId}
  - displayName: string
  - email: string

users/{userId}/transactions/{transactionId}
  - type: "income" | "expense"
  - amount: number
  - category: string
  - note: string
  - date: timestamp
  - createdBy: string (userId)

users/{userId}/settings/prefs
  - monthlyBudget: number
  - partnerEmail: string
```

## 🎨 設計規範

- **主色**：#FF8A5B（橙）
- **收入綠**：#22C55E
- **支出紅**：#EF4444
- **深夜藍**：#1A2B4A
- **圓角卡片**：16px
- **Tab Bar**：底部固定

## 🌐 部署到 Vercel（免費）

### 方法一：GitHub 部署（推薦）

1. 將專案推送到 GitHub
2. 去 [Vercel](https://vercel.com/)
3. 用 GitHub 帳戶登入
4. 點「New Project」→ 選擇你的 repo
5. Framework 選「Vite」
6. 點「Environment Variables」
7. 添加所有 `VITE_FIREBASE_*` 環境變數
8. 點「Deploy」

### 方法二：Vercel CLI

```bash
npm i -g vercel
vercel
```

### ⚠️ 重要：Firestore 安全規則

完成部署後，記得更新 Firestore 安全規則：

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      match /transactions/{transactionId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      
      match /settings/prefs {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

在 Firebase Console → Firestore → 規則，貼上以上規則並發布。

## 🛠️ 技術棧

- **React 18** - UI 框架
- **React Router 6** - 路由
- **Firebase 10** - 後端（Auth + Firestore）
- **Vite** - 構建工具
- **Vercel** - 部署平台

## 📝 開發備註

- 所有代碼使用繁體中文註釋
- 語音輸入支援 Chrome/Edge（需要 HTTPS 或 localhost）
- 推薦使用 Node.js 18+

## 📄 License

MIT License - 用得開心！
