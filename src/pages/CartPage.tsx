import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Alert, Box, Button, Container, Divider, IconButton, Paper, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import { useCart } from '../context/CartContext';
import { DELIVERY, DELIVERY_RULES, money } from '../data/catalogue';
import { useCatalogue } from '../data/useProducts';
import CatalogueUnavailable from '../components/CatalogueUnavailable';

export default function CartPage() {
  const { t, i18n } = useTranslation();
  const { items, removeItem, updateQuantity, clearCart } = useCart();
  const { products, status, retry } = useCatalogue();
  const navigate = useNavigate();
  const locale = i18n.language === 'fr' ? 'fr-FR' : 'en-GB';

  const cartProducts = items
    .map((item) => ({ ...item, product: products.find((p) => p.id === item.productId)! }))
    .filter((x) => x.product);

  const subtotal = cartProducts.reduce((sum, x) => sum + (x.product.price || 0) * x.quantity, 0);
  const fees = DELIVERY.map((z) => z.fee);
  const minFee = Math.min(...fees);
  const maxFee = Math.max(...fees);
  const missing = cartProducts.length > 0 ? Math.max(0, DELIVERY_RULES.minOrder - subtotal) : 0;
  const canCheckout = cartProducts.length > 0 && missing === 0;

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
      <Typography variant="h2" component="h1" sx={{ mb: 3 }}>{t('cart.title')}</Typography>

      {status === 'unavailable' && items.length > 0 ? (
        <CatalogueUnavailable onRetry={retry} />
      ) : status === 'loading' && items.length > 0 ? (
        // Panier enregistré, catalogue pas encore reçu : ne pas l'afficher « vide »
        <Typography color="text.secondary" sx={{ textAlign: 'center', py: 6 }} role="status">{t('catalogue.loading')}</Typography>
      ) : cartProducts.length === 0 ? (
        <Paper sx={{ p: { xs: 4, md: 6 }, textAlign: 'center', maxWidth: 560, mx: 'auto' }}>
          <ShoppingBagOutlinedIcon sx={{ fontSize: 48, color: 'secondary.main', mb: 1 }} aria-hidden />
          <Typography variant="body1" color="text.secondary">{t('cart.empty')}</Typography>
          <Button variant="contained" size="large" sx={{ mt: 3 }} onClick={() => navigate('/catalogue')}>
            {t('nav.catalogue')}
          </Button>
        </Paper>
      ) : (
        <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '1.7fr 1fr' }, alignItems: 'start' }}>
          <Paper component="ul" sx={{ listStyle: 'none', m: 0, p: 0, overflow: 'hidden' }}>
            {cartProducts.map(({ product, quantity }, i) => {
              const name = i18n.language === 'fr' ? product.name : product.en?.name || product.name;
              return (
                <Box component="li" key={product.id} sx={{ display: 'grid', gridTemplateColumns: '64px 1fr auto', gap: 2, alignItems: 'center', p: 2, borderTop: i ? '1px solid' : 'none', borderColor: 'divider' }}>
                  <Box sx={{ width: 64, height: 64, borderRadius: 2, overflow: 'hidden', bgcolor: product.color }}>
                    {product.image && (
                      <Box component="img" src={import.meta.env.BASE_URL + product.image} alt="" width={64} height={64} loading="lazy" sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    )}
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 600, lineHeight: 1.3 }}>{name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t('common.ref', { id: product.id })} · {product.price !== null ? money(product.price, locale) : t('common.onQuote')}
                    </Typography>
                    {/* Quantité : boutons −/+ de 44 px, plus faciles au doigt qu'un champ numérique */}
                    <Box role="group" aria-label={t('common.quantity', { name })} sx={{ display: 'inline-flex', alignItems: 'center', mt: 1, border: '1px solid', borderColor: 'divider', borderRadius: 999 }}>
                      <IconButton size="small" onClick={() => updateQuantity(product.id, quantity - 1)} aria-label={t('cart.decrease', { name })}>
                        <RemoveIcon fontSize="small" />
                      </IconButton>
                      <Typography component="output" aria-live="polite" sx={{ minWidth: 28, textAlign: 'center', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{quantity}</Typography>
                      <IconButton size="small" onClick={() => updateQuantity(product.id, quantity + 1)} disabled={quantity >= 99} aria-label={t('cart.increase', { name })}>
                        <AddIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                  <Box sx={{ textAlign: 'right', alignSelf: 'stretch', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <IconButton onClick={() => removeItem(product.id)} aria-label={t('common.remove', { name })} sx={{ color: 'text.secondary', mr: -1, mt: -1 }}>
                      <DeleteOutlineIcon />
                    </IconButton>
                    {product.price !== null && (
                      <Typography sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{money(product.price * quantity, locale)}</Typography>
                    )}
                  </Box>
                </Box>
              );
            })}
          </Paper>

          <Paper component="aside" aria-labelledby="cart-summary" sx={{ p: 3, position: { md: 'sticky' }, top: { md: 88 } }}>
            <Typography id="cart-summary" variant="h5" component="h2" sx={{ mb: 2 }}>{t('cart.summary')}</Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 2 }}>
              <Typography color="text.secondary">{t('cart.subtotal')}</Typography>
              <Typography sx={{ fontWeight: 700, fontSize: '1.375rem', color: 'primary.main', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{money(subtotal, locale)}</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {t('cart.fees', { min: money(minFee, locale), max: money(maxFee, locale) })}
            </Typography>

            {missing > 0 && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                {t('cart.minimum', { missing: money(missing, locale), min: money(DELIVERY_RULES.minOrder, locale) })}
              </Alert>
            )}

            <Button variant="contained" size="large" fullWidth disabled={!canCheckout} onClick={() => navigate('/commander')} sx={{ mt: 3 }}>
              {t('cart.checkout')}
            </Button>
            <Button fullWidth onClick={() => navigate('/catalogue')} sx={{ mt: 1 }}>
              {t('cart.continue')}
            </Button>
            <Divider sx={{ my: 2 }} />
            <Button size="small" color="error" onClick={clearCart} sx={{ display: 'block', mx: 'auto' }}>
              {t('terms.clear')}
            </Button>
          </Paper>
        </Box>
      )}
    </Container>
  );
}
