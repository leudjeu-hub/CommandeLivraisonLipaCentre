import { useTranslation } from 'react-i18next';
import { Alert, Box, Button } from '@mui/material';
import { whatsappLink } from '../data/catalogue';

// API injoignable et aucun catalogue en mémoire : pas d'articles inventés, mais deux issues
// (réessayer, ou envoyer sa liste par WhatsApp).
export default function CatalogueUnavailable({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation();
  return (
    <Alert severity="warning" sx={{ my: 3 }} data-testid="catalogue-unavailable">
      {t('catalogue.unavailable')}
      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mt: 2 }}>
        <Button variant="contained" color="success" href={whatsappLink(t('catalogue.unavailableWhatsapp'))} target="_blank" rel="noopener">
          {t('catalogue.orderWhatsapp')}
        </Button>
        <Button variant="outlined" onClick={onRetry}>{t('auth.retry')}</Button>
      </Box>
    </Alert>
  );
}
