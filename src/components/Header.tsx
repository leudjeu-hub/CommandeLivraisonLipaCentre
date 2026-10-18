import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AppBar, Toolbar, IconButton, Button, Drawer, List, ListItem, ListItemText, Badge, useMediaQuery, useTheme } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { useCart } from '../context/CartContext';

export default function Header() {
  const { t, i18n } = useTranslation();
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = useState(false);

  const toggleLang = () => {
    const next = i18n.language === 'fr' ? 'en' : 'fr';
    i18n.changeLanguage(next);
    localStorage.setItem('centre-lang', next);
  };

  const navLinks = [
    { to: '/catalogue', label: t('nav.catalogue') },
    { to: '/livraison', label: t('nav.delivery') },
  ];

  return (
    <AppBar position="sticky" color="primary" elevation={0}>
      <Toolbar>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'inherit', flexGrow: 1 }}>
          <img src="/img/logo.svg" alt="LIPACE" width={120} height={32} />
        </Link>

        {!isMobile && (
          <>
            {navLinks.map((l) => (
              <Button key={l.to} color="inherit" component={Link} to={l.to}>{l.label}</Button>
            ))}
            <Button color="inherit" onClick={toggleLang}>
              {i18n.language === 'fr' ? 'English' : 'Français'}
            </Button>
            <IconButton color="inherit" onClick={() => navigate('/panier')} aria-label={t('nav.cart')}>
              <Badge badgeContent={totalItems} color="secondary">
                <ShoppingCartIcon />
              </Badge>
            </IconButton>
          </>
        )}

        {isMobile && (
          <>
            <IconButton color="inherit" onClick={() => navigate('/panier')} aria-label={t('nav.cart')}>
              <Badge badgeContent={totalItems} color="secondary">
                <ShoppingCartIcon />
              </Badge>
            </IconButton>
            <IconButton color="inherit" onClick={() => setDrawerOpen(true)} aria-label="Menu">
              <MenuIcon />
            </IconButton>
            <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
              <List>
                {navLinks.map((l) => (
                  <ListItem key={l.to} component={Link} to={l.to} onClick={() => setDrawerOpen(false)}>
                    <ListItemText primary={l.label} />
                  </ListItem>
                ))}
                <ListItem button onClick={toggleLang}>
                  <ListItemText primary={i18n.language === 'fr' ? 'English' : 'Français'} />
                </ListItem>
              </List>
            </Drawer>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
}
