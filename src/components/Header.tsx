import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AppBar, Toolbar, IconButton, Button, Drawer, List, ListItemButton, ListItemText, Badge, useMediaQuery, useTheme } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { canManageHours } from '../data/authApi';

export default function Header() {
  const { t, i18n } = useTranslation();
  const { totalItems } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { pathname } = useLocation();

  // Page active : lien mis en évidence (gras + trait blanc) et annoncé aux lecteurs d'écran
  const isActive = (to: string) => pathname === to || pathname.startsWith(to + '/');
  const current = (to: string) => (isActive(to) ? ('page' as const) : undefined);
  const activeSx = (to: string) =>
    isActive(to) ? { fontWeight: 700, boxShadow: 'inset 0 -3px 0 currentColor', borderRadius: 0 } : {};

  const toggleLang = () => {
    const next = i18n.language === 'fr' ? 'en' : 'fr';
    i18n.changeLanguage(next);
    localStorage.setItem('centre-lang', next);
  };

  const navLinks = [
    { to: '/catalogue', label: t('nav.catalogue') },
    { to: '/livraison', label: t('nav.delivery') },
    // Gestion pour les administrateurs et les responsables (heures) ; « Mon compte » si connecté, sinon « Connexion »
    ...(user && canManageHours(user.role) ? [{ to: '/gestion', label: t('nav.admin') }] : []),
    user ? { to: '/compte', label: t('nav.account') } : { to: '/connexion', label: t('nav.login') },
  ];

  return (
    <AppBar position="sticky" color="primary" elevation={0}>
      <Toolbar>
        {/* Logo à mot-symbole blanc : la version d'origine (bleu marine) est illisible sur le vert */}
        <Link to="/" aria-label={t('brand.name')} style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'inherit', flexGrow: 1, minHeight: 44 }}>
          <img src={`${import.meta.env.BASE_URL}img/logo-clair.svg`} alt="" width={138} height={38} />
        </Link>

        {!isMobile && (
          <>
            {navLinks.map((l) => (
              <Button key={l.to} color="inherit" component={Link} to={l.to} aria-current={current(l.to)} sx={activeSx(l.to)}>
                {l.label}
              </Button>
            ))}
            <Button color="inherit" onClick={toggleLang}>
              {i18n.language === 'fr' ? 'English' : 'Français'}
            </Button>
            <IconButton color="inherit" onClick={() => navigate('/panier')} aria-label={t('nav.cart')} aria-current={current('/panier')} sx={activeSx('/panier')}>
              <Badge badgeContent={totalItems} color="secondary">
                <ShoppingCartIcon />
              </Badge>
            </IconButton>
          </>
        )}

        {isMobile && (
          <>
            <IconButton color="inherit" onClick={() => navigate('/panier')} aria-label={t('nav.cart')} aria-current={current('/panier')} sx={activeSx('/panier')}>
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
                  <ListItemButton
                    key={l.to}
                    component={Link}
                    to={l.to}
                    selected={isActive(l.to)}
                    aria-current={current(l.to)}
                    onClick={() => setDrawerOpen(false)}
                  >
                    <ListItemText primary={l.label} primaryTypographyProps={{ fontWeight: isActive(l.to) ? 700 : 400 }} />
                  </ListItemButton>
                ))}
                <ListItemButton onClick={toggleLang}>
                  <ListItemText primary={i18n.language === 'fr' ? 'English' : 'Français'} />
                </ListItemButton>
              </List>
            </Drawer>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
}
