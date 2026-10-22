import { useTranslation } from 'react-i18next';
import { Alert, Box, Button } from '@mui/material';
import { SHOP } from '../data/catalogue';

// API injoignable et aucun catalogue en mémoire : pas d'articles inventés, mais deux issues
// (réessayer, ou envoyer sa liste par WhatsApp).
export default function CatalogueUnavailable({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation();
  const text = encodeURIComponent(t('catalogue.unavailableWhatsapp'));
  return (
    <Alert severity="warning" sx={{ my: 3 }} data-testid="catalogue-unavailable">
      {t('catalogue.unavailable')}
      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mt: 2 }}>
        <Button variant="contained" color="success" href={`https://wa.me/${SHOP.whatsapp}?text=${text}`} target="_blank" rel="noopener">
          {t('catalogue.orderWhatsapp')}
        </Button>
        <Button variant="outlined" onClick={onRetry}>{t('auth.retry')}</Button>
      </Box>
    </Alert>
  );
}
