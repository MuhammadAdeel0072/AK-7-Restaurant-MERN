import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ClerkProvider } from '@clerk/clerk-react'
import { ThemeProvider } from './context/ThemeContext'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

const root = createRoot(document.getElementById('root'));

if (!PUBLISHABLE_KEY) {
  root.render(
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-center px-4">
      <h1 className="text-3xl font-bold text-red-600 mb-4">Configuration Missing</h1>
      <p className="text-gray-700">
        The application requires a Clerk publishable key to function. 
        Please ensure <code className="bg-gray-200 px-2 py-1 rounded">VITE_CLERK_PUBLISHABLE_KEY</code> is set in your <code className="bg-gray-200 px-2 py-1 rounded">.env.local</code> file.
      </p>
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
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </ClerkProvider>
    </StrictMode>
  );
}
