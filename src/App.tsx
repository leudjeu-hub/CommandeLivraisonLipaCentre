import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import CataloguePage from './pages/CataloguePage';
import DeliveryPage from './pages/DeliveryPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';

// Gestion des articles : développement uniquement (l'API locale n'a pas d'authentification).
// En production, import.meta.env.DEV vaut false et la page est absente du build.
const AdminPage = import.meta.env.DEV ? lazy(() => import('./pages/AdminPage')) : null;

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
      </Route>
    </Routes>
  );
}
