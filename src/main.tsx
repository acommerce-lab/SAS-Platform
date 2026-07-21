import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Define global handlers for Google Maps auth failure and script errors early
if (typeof window !== 'undefined') {
  (window as any).gm_authFailure = () => {
    console.warn("Google Maps API Authentication Failed (ApiTargetBlockedMapError). Switching to high-fidelity independent offline map mode globally.");
    (window as any).hasGoogleMapsAuthError = true;
    window.dispatchEvent(new CustomEvent('google-maps-auth-failure'));
  };

  // Gracefully suppress Google Maps script errors from crashing/triggering error screens
  window.addEventListener('error', (event) => {
    const errorMsg = event.message || '';
    const errorSrc = event.filename || '';
    
    const isGoogleMapsError = 
      errorMsg.includes('google') || 
      errorMsg.includes('ApiTargetBlockedMapError') ||
      errorSrc.includes('maps.googleapis.com') ||
      errorMsg === 'Script error.'; // Cross-origin script error from loading Google Maps
      
    if (isGoogleMapsError) {
      console.warn('Suppressing Google Maps related error/Script error:', errorMsg, 'from', errorSrc);
      event.preventDefault();
      event.stopPropagation();
      (window as any).hasGoogleMapsAuthError = true;
      window.dispatchEvent(new CustomEvent('google-maps-auth-failure'));
    }
  }, true); // Use capture phase to catch it early
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

