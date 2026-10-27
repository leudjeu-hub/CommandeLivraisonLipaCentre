import { Suspense, useEffect } from 'react';
import { Outlet, useLocation, useNavigationType } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Box, CircularProgress } from '@mui/material';
import Header from './Header';
import Footer from './Footer';
import Toast from './Toast';

// Titre de l'onglet (et des résultats de recherche) propre à chaque page
const TITLES: Record<string, string> = {
  '/': 'seo.home',
  '/catalogue': 'seo.catalogue',
  '/fournitures-scolaires': 'seo.catScolaire',
  '/fournitures-de-bureau': 'seo.catBureau',
  '/livres-scolaires': 'seo.catLivres',
  '/livraison': 'seo.delivery',
  '/panier': 'seo.cart',
  '/confidentialite': 'seo.privacy',
};

export default function Layout() {
  const { t } = useTranslation();
  const { pathname, search } = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    const key = pathname === '/commander' ? (new URLSearchParams(search).get('type') === 'quote' ? 'seo.quote' : 'seo.order') : TITLES[pathname] ?? 'seo.other';
    document.title = t(key);
  }, [pathname, search, t]);

  // Nouvelle page : on repart du haut (sinon le formulaire de devis s'ouvrait sur son pied de page,
  // à la hauteur où l'on avait cliqué sur l'accueil). Le bouton Retour garde la position du navigateur.
  useEffect(() => {
    if (navigationType !== 'POP') window.scrollTo(0, 0);
  }, [pathname, navigationType]);

  return (
    <>
      {/* Lien d'évitement (WCAG 2.4.1) : invisible jusqu'à la première tabulation */}
      <Box
        component="a"
        href="#contenu"
        onClick={(e: React.MouseEvent) => {
          e.preventDefault();
          document.getElementById('contenu')?.focus();
        }}
        sx={{
          position: 'absolute', left: 8, top: -64, zIndex: 1300, px: 2, py: 1.25, borderRadius: 1,
          bgcolor: '#fff', color: 'primary.main', fontWeight: 700, textDecoration: 'none',
          '&:focus': { top: 8 },
        }}
      >
        {t('nav.skip')}
      </Box>
      <Header />
      {/* Page chargée à part (voir App.tsx) : en attendant, un indicateur sur toute la hauteur de l'écran,
          et le pied de page n'arrive qu'avec la page. Sinon il s'affiche en haut puis saute vers le bas
          (décalage de mise en page, CLS). */}
      <Suspense fallback={<Box component="main" id="contenu" tabIndex={-1} sx={{ display: 'grid', placeItems: 'center', minHeight: '100vh', '&:focus': { outline: 'none' } }}><CircularProgress aria-label="…" /></Box>}>
        <Box component="main" id="contenu" tabIndex={-1} sx={{ '&:focus': { outline: 'none' } }}>
          <Outlet />
        </Box>
        <Footer />
      </Suspense>
      <Toast />
    </>
  );
}
