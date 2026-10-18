import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Container, Typography, Box, Button, IconButton, Divider, Paper, List, ListItem, ListItemText, ListItemSecondaryAction } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useCart } from '../context/CartContext';
import { DELIVERY, DELIVERY_RULES, money } from '../data/catalogue';
import { useProducts } from '../data/useProducts';

export default function CartPage() {
  const { t, i18n } = useTranslation();
  const { items, removeItem, updateQuantity, clearCart } = useCart();
  const products = useProducts();
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
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" sx={{ fontFamily: 'Georgia, serif', mb: 3 }}>
        {t('cart.title')}
      </Typography>

      {cartProducts.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">{t('cart.empty')}</Typography>
          <Button variant="contained" sx={{ mt: 2 }} onClick={() => navigate('/catalogue')}>
            {t('nav.catalogue')}
          </Button>
        </Paper>
      ) : (
        <>
          <Paper sx={{ p: 2, mb: 2 }}>
            <List>
              {cartProducts.map(({ product, quantity }) => {
                const name = i18n.language === 'fr' ? product.name : product.en?.name || product.name;
                return (
                  <ListItem key={product.id} disablePadding sx={{ py: 1 }}>
                    <ListItemText
                      primary={name}
                      secondary={product.price !== null ? money(product.price, locale) : t('common.onQuote')}
                    />
                    <ListItemSecondaryAction>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <input
                          type="number"
                          min={1}
                          max={99}
                          value={quantity}
                          onChange={(e) => updateQuantity(product.id, parseInt(e.target.value) || 1)}
                          aria-label={t('common.quantity', { name })}
                          style={{ width: 60, padding: '4px 8px', border: '1px solid #ccc', borderRadius: 4 }}
                        />
                        <IconButton edge="end" onClick={() => removeItem(product.id)} aria-label={t('common.remove', { name })}>
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>
                );
              })}
            </List>
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="h6">{t('cart.title')}</Typography>
              <Typography variant="h6" color="primary">{money(subtotal, locale)}</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {t('cart.fees', { min: money(minFee, locale), max: money(maxFee, locale) })}
            </Typography>

            {missing > 0 && (
              <Typography variant="body2" color="error" sx={{ mb: 2 }}>
                {t('cart.minimum', { missing: money(missing, locale), min: money(DELIVERY_RULES.minOrder, locale) })}
              </Typography>
            )}

            <Divider sx={{ my: 2 }} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
              <Button variant="outlined" color="error" onClick={clearCart}>
                {t('terms.clear')}
              </Button>
              <Button
                variant="contained"
                size="large"
                disabled={!canCheckout}
                onClick={() => navigate('/commander')}
              >
                {t('cart.checkout')}
              </Button>
            </Box>
          </Paper>
        </>
      )}
    </Container>
  );
}
