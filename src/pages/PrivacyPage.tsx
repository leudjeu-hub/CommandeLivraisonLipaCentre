import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Box, Container, Link as MuiLink, Typography } from '@mui/material';

// Confidentialité : ce que la librairie fait des données d'une commande (loi n° 2024/017 du
// 23 décembre 2024 sur la protection des données personnelles au Cameroun). Une vraie page, et non plus
// trois paragraphes dans une fenêtre : elle a une adresse que l'on peut citer dans le formulaire.
const SECTIONS = ['who', 'what', 'why', 'recipients', 'retention', 'browser', 'rights'] as const;

export default function PrivacyPage() {
  const { t } = useTranslation();

  return (
    <Container component="article" maxWidth="md" aria-labelledby="privacy-title" sx={{ py: { xs: 4, md: 7 } }}>
      <Typography id="privacy-title" variant="h2" component="h1" sx={{ mb: 1 }}>{t('privacy.title')}</Typography>
      <Typography color="text.secondary" sx={{ mb: 4 }}>{t('privacy.updated')}</Typography>
      <Box sx={{ display: 'grid', gap: 3.5, maxWidth: 680 }}>
        {SECTIONS.map((s) => (
          <Box component="section" key={s} aria-labelledby={`privacy-${s}`}>
            <Typography id={`privacy-${s}`} variant="h5" component="h2" sx={{ mb: 1 }}>{t(`privacy.${s}Title`)}</Typography>
            <Typography>{t(`privacy.${s}Text`)}</Typography>
          </Box>
        ))}
      </Box>
      <Typography sx={{ mt: 5 }}>
        <MuiLink component={Link} to="/catalogue" sx={{ fontWeight: 600 }}>{t('privacy.back')}</MuiLink>
      </Typography>
    </Container>
  );
}
