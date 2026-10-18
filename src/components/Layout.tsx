import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import MapFab from './MapFab';
import Toast from './Toast';

export default function Layout() {
  return (
    <>
      <Header />
      <main>
        <Outlet />
      </main>
      <Footer />
      <MapFab />
      <Toast />
    </>
  );
}
