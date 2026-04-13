import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import ErrorBoundary from './components/ErrorBoundary'

// Force unregister service workers to clear broken cache state permanently
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    let unregistering = false;
    for (let registration of registrations) {
      registration.unregister();
      unregistering = true;
    }
    if (unregistering) {
      caches.keys().then(names => {
        for (let name of names) caches.delete(name);
      }).then(() => window.location.reload());
    }
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
)