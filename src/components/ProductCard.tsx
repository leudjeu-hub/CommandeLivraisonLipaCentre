import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Card, Typography } from '@mui/material';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import { money, type Product } from '../data/catalogue';
import { useCart } from '../context/CartContext';
import { showToast } from './Toast';

// Carte article (catalogue et accueil). Compacte pour tenir à 2 par ligne sur un écran de 360 px :
// photo carrée, nom sur 2 lignes max, prix bien visible, bouton pleine largeur ≥ 44 px.
// memo : taper dans la recherche ne redessine pas les cartes déjà affichées.
export default memo(function ProductCard({ product: p }: { product: Product }) {
  const { t, i18n } = useTranslation();
  const { addItem } = useCart();
  const navigate = useNavigate();
  const fr = i18n.language === 'fr';
  const name = fr ? p.name : p.en?.name || p.name;
  const desc = fr ? p.desc : p.en?.desc || p.desc;
  const quote = p.price === null;

  const handleClick = () => {
    if (quote) {
      navigate(`/commander?type=quote&product=${p.id}`);
      return;
    }
    addItem(p.id);
    showToast(t('toast.added'), { label: t('toast.viewCart'), to: '/panier' });
  };

  return (
    <Card data-testid="product-card" sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Box sx={{ position: 'relative', aspectRatio: '1 / 1', bgcolor: p.color }}>
        {p.image ? (
          <Box
            component="img"
            src={import.meta.env.BASE_URL + p.image}
            alt={name}
            loading="lazy"
            width={480}
            height={480}
            sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          // Sans photo : vignette dessinée (texte sur la couleur de l'article)
          <Box sx={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', p: 2, color: '#fff', textAlign: 'center', whiteSpace: 'pre-line', fontFamily: 'Georgia, serif', fontSize: { xs: '1rem', sm: '1.25rem' }, letterSpacing: '0.04em' }}>
            {fr ? p.label : p.en?.label || p.label}
          </Box>
        )}
        <Box component="span" sx={{ position: 'absolute', top: 8, left: 8, px: 1, py: 0.25, borderRadius: 999, bgcolor: 'rgba(255,255,255,0.92)', color: 'primary.main', fontSize: '0.75rem', fontWeight: 700 }}>
          {t(`cat.${p.cat}`)}
        </Box>
      </Box>
      <Box sx={{ p: { xs: 1.5, sm: 2 }, display: 'flex', flexDirection: 'column', flexGrow: 1, gap: 0.5 }}>
        <Typography
          component="h3"
          sx={{ fontFamily: 'Georgia, serif', fontSize: { xs: '1rem', sm: '1.125rem' }, lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
        >
          {name}
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ display: { xs: 'none', sm: '-webkit-box' }, WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
        >
          {desc}
        </Typography>
        <Typography sx={{ mt: 'auto', pt: 1, fontWeight: 700, fontSize: { xs: '1.0625rem', sm: '1.1875rem' }, color: quote ? 'secondary.main' : 'primary.main', fontVariantNumeric: 'tabular-nums' }}>
          {quote ? t('common.onQuote') : money(p.price!, fr ? 'fr-FR' : 'en-GB')}
        </Typography>
        <Button
          variant={quote ? 'outlined' : 'contained'}
          fullWidth
          onClick={handleClick}
          startIcon={quote ? undefined : <AddShoppingCartIcon />}
          sx={{ mt: 1 }}
        >
          {quote ? t('common.request') : t('common.add')}
        </Button>
      </Box>
    </Card>
  );
});
