import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ClerkProvider } from '@clerk/clerk-react'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

const root = createRoot(document.getElementById('root'));

if (!PUBLISHABLE_KEY) {
  root.render(
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#121212', color: '#fff', textAlign: 'center', padding: '2rem' }}>
      <h1 style={{ color: '#D4AF37', fontSize: '2rem', marginBottom: '1rem' }}>Configuration Missing</h1>
      <p>Please ensure <code>VITE_CLERK_PUBLISHABLE_KEY</code> is set in your <code>.env.local</code> file.</p>
    </div>
  );
} else {
  root.render(
    <StrictMode>
      <ClerkProvider 
        publishableKey={PUBLISHABLE_KEY}
        appearance={{
          variables: {
            colorPrimary: '#D4AF37',
            colorBackground: '#121212',
            colorText: '#E0E0E0',
            colorInputBackground: '#1a1a1a',
            colorInputText: '#F9F9F9',
            fontFamily: 'Inter, sans-serif'
          }
        }}
      >
        <App />
      </ClerkProvider>
    </StrictMode>
  );
}
