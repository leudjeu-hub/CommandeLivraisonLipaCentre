import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import CataloguePage from './pages/CataloguePage';
import DeliveryPage from './pages/DeliveryPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';

// Connexion, compte et gestion : chargées à la demande (les visiteurs qui commandent ne les téléchargent pas)
const AdminPage = lazy(() => import('./pages/AdminPage'));
const AuthPage = lazy(() => import('./pages/AuthPage'));
const AccountPage = lazy(() => import('./pages/AccountPage'));

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="catalogue" element={<CataloguePage />} />
        <Route path="livraison" element={<DeliveryPage />} />
        <Route path="panier" element={<CartPage />} />
        <Route path="commander" element={<CheckoutPage />} />
        <Route path="gestion" element={<Suspense><AdminPage /></Suspense>} />
        <Route path="connexion" element={<Suspense><AuthPage mode="login" /></Suspense>} />
        <Route path="inscription" element={<Suspense><AuthPage mode="register" /></Suspense>} />
        <Route path="compte" element={<Suspense><AccountPage /></Suspense>} />
      </Route>
    </Routes>
  );
}
