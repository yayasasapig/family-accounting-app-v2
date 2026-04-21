/**
 * 應用程式入口點
 * 
 * 家庭記帳 App - React + Firebase 版本
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './App.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
