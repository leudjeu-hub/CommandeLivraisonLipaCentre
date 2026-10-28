import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import App from './App';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import './i18n';
import { theme } from './theme';
import { wakeApi } from './data/productsApi';

wakeApi();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* Base avec la barre finale : le lien vers l'accueil (logo) pointe vers …/CommandeLivraisonLipaCentre/,
        l'adresse canonique, et non vers la variante sans barre que GitHub Pages redirige (301) */}
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <CartProvider>
            <App />
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
