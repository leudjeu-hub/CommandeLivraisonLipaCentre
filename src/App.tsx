import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import CataloguePage from './pages/CataloguePage';
import DeliveryPage from './pages/DeliveryPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="catalogue" element={<CataloguePage />} />
        <Route path="livraison" element={<DeliveryPage />} />
        <Route path="panier" element={<CartPage />} />
        <Route path="commander" element={<CheckoutPage />} />
      </Route>
    </Routes>
  );
}
