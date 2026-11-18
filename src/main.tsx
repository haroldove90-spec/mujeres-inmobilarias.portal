import {createRoot} from 'react-dom/client';
import {registerSW} from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';

// Capture beforeinstallprompt early before React mounts
declare global {
  interface Window {
    __pwaDeferredPrompt?: Event | null;
  }
}

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  window.__pwaDeferredPrompt = e;
  window.dispatchEvent(new CustomEvent('pwa-prompt-ready'));
});

window.addEventListener('appinstalled', () => {
  window.__pwaDeferredPrompt = null;
  window.dispatchEvent(new CustomEvent('pwa-installed'));
});

registerSW({immediate: true});

createRoot(document.getElementById('root')!).render(<App />);
