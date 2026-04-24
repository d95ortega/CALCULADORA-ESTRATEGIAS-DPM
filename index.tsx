
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';

console.log("INDEX: Initializing React...");
const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error("INDEX: Could not find root element");
  throw new Error("Could not find root element to mount to");
}

console.log("INDEX: Creating React root...");
const root = ReactDOM.createRoot(rootElement);
console.log("INDEX: Rendering App component...");
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
console.log("INDEX: Render call completed.");
