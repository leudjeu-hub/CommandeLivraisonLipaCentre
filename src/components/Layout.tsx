import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
      <main>
        <Outlet />
      </main>
      <Footer />
      <Toast />
    </>
  );
}
