import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { YouVersionProvider } from '@youversion/platform-react-ui';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <YouVersionProvider appKey={import.meta.env.VITE_YOUVERSION_APP_KEY || "DUMMY_APP_KEY"} theme="light">
      <App />
    </YouVersionProvider>
  </React.StrictMode>
);