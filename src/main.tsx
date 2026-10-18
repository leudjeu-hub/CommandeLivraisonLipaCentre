import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import App from './App';
import { CartProvider } from './context/CartContext';
import './i18n';

const theme = createTheme({
  palette: {
    primary: { main: '#153e35' },
    secondary: { main: '#9b6631' },
    background: { default: '#f7f4ec', paper: '#ffffff' },
    text: { primary: '#1a2e28', secondary: '#67736b' },
  },
  typography: {
    fontFamily: 'Arial, sans-serif',
    h1: { fontFamily: 'Georgia, serif' },
    h2: { fontFamily: 'Georgia, serif' },
    h3: { fontFamily: 'Georgia, serif' },
  },
  shape: { borderRadius: 8 },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <CartProvider>
          <App />
        </CartProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
