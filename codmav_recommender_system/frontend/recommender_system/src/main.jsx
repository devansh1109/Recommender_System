import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const container = document.getElementById('root');
const root = createRoot(container);

// Use root.render to render your application
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
