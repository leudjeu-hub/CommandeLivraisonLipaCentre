import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import CataloguePage from './pages/CataloguePage';
import DeliveryPage from './pages/DeliveryPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';

// Connexion, compte et gestion (articles, utilisateurs) : développement uniquement, car l'API
// ne tourne qu'en local pour l'instant. En production, import.meta.env.DEV vaut false et ces pages
// sont absentes du build.
const dev = import.meta.env.DEV;
const AdminPage = dev ? lazy(() => import('./pages/AdminPage')) : null;
const AuthPage = dev ? lazy(() => import('./pages/AuthPage')) : null;
const AccountPage = dev ? lazy(() => import('./pages/AccountPage')) : null;

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="catalogue" element={<CataloguePage />} />
        <Route path="livraison" element={<DeliveryPage />} />
        <Route path="panier" element={<CartPage />} />
        <Route path="commander" element={<CheckoutPage />} />
        {AdminPage && <Route path="gestion" element={<Suspense><AdminPage /></Suspense>} />}
        {AuthPage && <Route path="connexion" element={<Suspense><AuthPage mode="login" /></Suspense>} />}
        {AuthPage && <Route path="inscription" element={<Suspense><AuthPage mode="register" /></Suspense>} />}
        {AccountPage && <Route path="compte" element={<Suspense><AccountPage /></Suspense>} />}
      </Route>
    </Routes>
  );
}
