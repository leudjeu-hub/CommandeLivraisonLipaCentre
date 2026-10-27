import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AppBar, Toolbar, IconButton, Button, Drawer, List, ListItemButton, ListItemIcon, ListItemText, Badge, Box, Divider, useMediaQuery, useTheme } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import PhoneIcon from '@mui/icons-material/Phone';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { canManageHours } from '../data/authApi';
import { whatsappLink } from '../data/catalogue';
import { FOCUS_ON_DARK } from '../theme';

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
    try {
      localStorage.setItem('centre-lang', next);
    } catch {
      // stockage indisponible : la langue ne sera pas retenue
    }
  };

  // Nom de l'autre langue, prononcé dans cette langue par les lecteurs d'écran (WCAG 3.1.2)
  const otherLang = i18n.language === 'fr' ? 'en' : 'fr';

  // Client connecté : « Mes commandes » en plus du catalogue, et « Mon compte » à la place de « Votre compte »
  // (même page : les commandes y sont en tête), pour que le compte reste visible au même endroit
  const customer = user?.role === 'user';
  const navLinks = [
    { to: '/catalogue', label: t('nav.catalogue') },
    ...(customer ? [{ to: '/compte', label: t('nav.myOrders') }] : []),
    { to: '/livraison', label: t('nav.delivery') },
    // Gestion pour les administrateurs et les responsables (heures)
    ...(user && canManageHours(user.role) ? [{ to: '/gestion', label: t('nav.admin') }] : []),
    // « Votre compte » : la connexion si personne n'est connecté, sinon la page du compte
    { to: user ? '/compte' : '/connexion', label: t(user ? 'nav.myAccount' : 'nav.account') },
  ];

  // WhatsApp, le canal préféré de beaucoup de clients : toujours à portée de pouce
  const whatsappButton = (
    <IconButton color="inherit" href={whatsappLink()} target="_blank" rel="noopener" aria-label={t('nav.whatsapp')}>
      <WhatsAppIcon />
    </IconButton>
  );

  return (
    <AppBar position="sticky" color="primary" elevation={0}>
      <Toolbar>
        {/* Logo à mot-symbole blanc : le texte bleu marine du logo d'origine disparaîtrait sur le bandeau marine */}
        {/* Le lien a la taille du logo ; l'espace vide de la barre est un Box à part (sinon toute la barre
            ramenait à l'accueil et l'anneau de focus faisait la moitié de l'écran) */}
        <Link to="/" aria-label={t('brand.name')} style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'inherit', minHeight: 44 }}>
          <img src={`${import.meta.env.BASE_URL}img/logo-clair.svg`} alt="" width={138} height={38} />
        </Link>
        <Box sx={{ flexGrow: 1 }} />

        {!isMobile && (
          <>
            {navLinks.map((l) => (
              <Button key={l.to} color="inherit" component={Link} to={l.to} aria-current={current(l.to)} sx={activeSx(l.to)}>
                {l.label}
              </Button>
            ))}
            <Button color="inherit" onClick={toggleLang} lang={otherLang}>
              {i18n.language === 'fr' ? 'English' : 'Français'}
            </Button>
            {whatsappButton}
            <IconButton color="inherit" onClick={() => navigate('/panier')} aria-label={t('nav.cart')} aria-current={current('/panier')} sx={activeSx('/panier')}>
              <Badge badgeContent={totalItems} color="secondary">
                <ShoppingCartIcon />
              </Badge>
            </IconButton>
          </>
        )}

        {isMobile && (
          <>
            {whatsappButton}
            <IconButton color="inherit" onClick={() => navigate('/panier')} aria-label={t('nav.cart')} aria-current={current('/panier')} sx={activeSx('/panier')}>
              <Badge badgeContent={totalItems} color="secondary">
                <ShoppingCartIcon />
              </Badge>
            </IconButton>
            <IconButton color="inherit" onClick={() => setDrawerOpen(true)} aria-label={t('nav.menu')}>
              <MenuIcon />
            </IconButton>
            <Drawer
              anchor="right"
              open={drawerOpen}
              onClose={() => setDrawerOpen(false)}
              slotProps={{ paper: { 'aria-label': t('nav.menu'), sx: { width: 280, maxWidth: '85vw' } } }}
            >
              {/* En-tête du menu : logo et bouton Fermer, sur le même bandeau marine que la barre */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'primary.main', color: '#fff', px: 2, minHeight: 56, '--focus-ring': FOCUS_ON_DARK }}>
                <img src={`${import.meta.env.BASE_URL}img/logo-clair.svg`} alt={t('brand.name')} width={116} height={32} />
                <IconButton color="inherit" onClick={() => setDrawerOpen(false)} aria-label={t('nav.close')}>
                  <CloseIcon />
                </IconButton>
              </Box>
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
                <ListItemButton onClick={toggleLang} lang={otherLang}>
                  <ListItemText primary={i18n.language === 'fr' ? 'English' : 'Français'} />
                </ListItemButton>
              </List>
              {/* Un client perdu cherche d'abord à joindre la librairie */}
              <Divider />
              <List>
                <ListItemButton component="a" href={whatsappLink()} target="_blank" rel="noopener">
                  <ListItemIcon sx={{ minWidth: 40, color: 'success.main' }}><WhatsAppIcon /></ListItemIcon>
                  <ListItemText primary={t('nav.whatsapp')} />
                </ListItemButton>
                <ListItemButton component="a" href="tel:+237693240396">
                  <ListItemIcon sx={{ minWidth: 40, color: 'primary.main' }}><PhoneIcon /></ListItemIcon>
                  <ListItemText primary="+237 6 93 24 03 96" />
                </ListItemButton>
              </List>
            </Drawer>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
}
