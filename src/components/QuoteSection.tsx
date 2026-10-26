import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Box, Button, Container, Typography } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { whatsappLink } from '../data/catalogue';

// Devis : un seul encart pour les deux publics qui ne passent pas par le panier (parents avec une liste
// scolaire, écoles et entreprises). Remplace les encarts « Listes » et « Écoles et entreprises », deux blocs
// identiques dont les trois boutons menaient au même formulaire.
export default function QuoteSection() {
  const { t } = useTranslation();
  // Sur 360 px, des libellés à 17 px passaient sur deux lignes
  const buttonSx = { fontSize: { xs: '1rem', sm: '1.0625rem' }, px: { xs: 2, sm: 3 } };
  const audiences = ['parents', 'pro'].map((k) => ({ k, title: t(`quote.${k}Title`), text: t(`quote.${k}Text`) }));

  return (
    <Container component="section" id="devis" maxWidth="lg" aria-labelledby="quote-title" sx={{ pb: { xs: 2, md: 4 }, scrollMarginTop: 80 }}>
      <Box sx={{ bgcolor: '#fff', border: '1px solid', borderColor: 'divider', borderRadius: 3, p: { xs: 2.5, sm: 3, md: 6 }, display: 'grid', gap: { xs: 3, md: 6 }, gridTemplateColumns: { xs: '1fr', md: '1.5fr 1fr' }, alignItems: 'center' }}>
        <Box>
          <Typography variant="overline" color="secondary">{t('quote.eyebrow')}</Typography>
          <Typography id="quote-title" variant="h3" component="h2" sx={{ mb: 3 }}>{t('quote.title')}</Typography>
          {/* Deux publics, une même démarche : chacun se reconnaît à son titre */}
          <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0, display: 'grid', gap: 2.5, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' } }}>
            {audiences.map((a) => (
              <li key={a.k}>
                <Typography variant="h6" component="h3" sx={{ mb: 0.5 }}>{a.title}</Typography>
                <Typography variant="body2" color="text.secondary">{a.text}</Typography>
              </li>
            ))}
          </Box>
        </Box>
        <Box sx={{ display: 'grid', gap: 1.5 }}>
          {/* Le formulaire reste l'action principale : la demande y reçoit une référence LC-… et arrive dans Gestion */}
          <Button variant="contained" size="large" component={Link} to="/commander?type=quote" endIcon={<ArrowForwardIcon />} fullWidth sx={buttonSx}>
            {t('quote.cta')}
          </Button>
          {/* Liste sur papier : la photo par WhatsApp évite de tout recopier sur un petit écran */}
          <Button variant="outlined" size="large" href={whatsappLink(t('form.quoteWhatsappText'))} target="_blank" rel="noopener" startIcon={<WhatsAppIcon />} fullWidth sx={buttonSx}>
            {t('quote.photoCta')}
          </Button>
        </Box>
      </Box>
    </Container>
  );
}
