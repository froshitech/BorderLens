import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
} else {
  // If no root div exists, we create it
  const div = document.createElement('div');
  div.id = 'root';
  document.body.appendChild(div);
  const root = createRoot(div);
  root.render(<App />);
}
