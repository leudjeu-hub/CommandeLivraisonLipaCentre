import { lazy, Suspense, type ReactNode } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';

// Seul l'accueil est dans le fichier principal : les autres pages (et leurs composants MUI :
// champs, listes déroulantes, cases à cocher…) sont chargées à part, ce qui allège la première
// visite en 3G. Elles sont préchargées dès que la page est affichée (voir prefetch, plus bas).
const pages = {
  catalogue: () => import('./pages/CataloguePage'),
  delivery: () => import('./pages/DeliveryPage'),
  cart: () => import('./pages/CartPage'),
  checkout: () => import('./pages/CheckoutPage'),
  admin: () => import('./pages/AdminPage'),
  auth: () => import('./pages/AuthPage'),
  account: () => import('./pages/AccountPage'),
};
const CataloguePage = lazy(pages.catalogue);
const DeliveryPage = lazy(pages.delivery);
const CartPage = lazy(pages.cart);
const CheckoutPage = lazy(pages.checkout);
// Connexion, compte et gestion : jamais préchargées (les visiteurs qui commandent n'en ont pas besoin)
const AdminPage = lazy(pages.admin);
const AuthPage = lazy(pages.auth);
const AccountPage = lazy(pages.account);

// Pages du parcours de commande, téléchargées en arrière-plan une fois l'accueil affiché
function prefetch() {
  const run = () => [pages.catalogue, pages.cart, pages.checkout, pages.delivery].forEach((load) => load().catch(() => undefined));
  if ('requestIdleCallback' in window) window.requestIdleCallback(run, { timeout: 3000 });
  else setTimeout(run, 1500);
}
if (document.readyState === 'complete') prefetch();
else window.addEventListener('load', prefetch, { once: true });

const page = (element: ReactNode) => (
  <Suspense fallback={<Box sx={{ display: 'grid', placeItems: 'center', py: 10 }}><CircularProgress aria-label="…" /></Box>}>
    {element}
  </Suspense>
);

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="catalogue" element={page(<CataloguePage />)} />
        <Route path="livraison" element={page(<DeliveryPage />)} />
        <Route path="panier" element={page(<CartPage />)} />
        <Route path="commander" element={page(<CheckoutPage />)} />
        <Route path="gestion" element={page(<AdminPage />)} />
        <Route path="connexion" element={page(<AuthPage mode="login" />)} />
        <Route path="inscription" element={page(<AuthPage mode="register" />)} />
        <Route path="compte" element={page(<AccountPage />)} />
      </Route>
    </Routes>
  );
}
