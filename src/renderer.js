import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import './index.css';

window.addEventListener('error', (event) => {
  console.error('[uncaught renderer error]', event.error || event.message);
});
window.addEventListener('unhandledrejection', (event) => {
  console.error('[unhandled renderer rejection]', event.reason);
});

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
} else {
  const div = document.createElement('div');
  div.id = 'root';
  document.body.appendChild(div);
  const root = createRoot(div);
  root.render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}

