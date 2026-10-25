import { Suspense, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Box, CircularProgress } from '@mui/material';
import Header from './Header';
import Footer from './Footer';
import Toast from './Toast';

// Titre de l'onglet (et des résultats de recherche) propre à chaque page
const TITLES: Record<string, string> = {
  '/': 'seo.home',
  '/catalogue': 'seo.catalogue',
  '/livraison': 'seo.delivery',
  '/panier': 'seo.cart',
};

export default function Layout() {
  const { t } = useTranslation();
  const { pathname, search } = useLocation();

  useEffect(() => {
    const key = pathname === '/commander' ? (new URLSearchParams(search).get('type') === 'quote' ? 'seo.quote' : 'seo.order') : TITLES[pathname] ?? 'seo.other';
    document.title = t(key);
  }, [pathname, search, t]);

  return (
    <>
      <Header />
      {/* Page chargée à part (voir App.tsx) : en attendant, un indicateur sur toute la hauteur de l'écran,
          et le pied de page n'arrive qu'avec la page. Sinon il s'affiche en haut puis saute vers le bas
          (décalage de mise en page, CLS). */}
      <Suspense fallback={<Box sx={{ display: 'grid', placeItems: 'center', minHeight: '100vh' }}><CircularProgress aria-label="…" /></Box>}>
        <main>
          <Outlet />
        </main>
        <Footer />
      </Suspense>
      <Toast />
    </>
  );
}
