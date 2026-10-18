import { useTranslation } from 'react-i18next';
import { Container, Typography, Grid, Paper, Box, List, ListItem, ListItemText } from '@mui/material';
import { DELIVERY, DELIVERY_RULES, money } from '../data/catalogue';

export default function DeliveryPage() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'fr' ? 'fr-FR' : 'en-GB';

  const steps = [
    { title: t('delivery.step1Title'), text: t('delivery.step1Text') },
    { title: t('delivery.step2Title'), text: t('delivery.step2Text') },
    { title: t('delivery.step3Title'), text: t('delivery.step3Text') },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="overline" color="secondary">{t('delivery.eyebrow')}</Typography>
      <Typography variant="h2" component="h1" sx={{ fontFamily: 'Georgia, serif', mb: 4 }}>
        {t('delivery.title')}
      </Typography>

      <Grid container spacing={3} sx={{ mb: 6 }}>
        {steps.map((s, i) => (
          <Grid size={{ xs: 12, md: 4 }} key={i}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h4" color="primary" sx={{ fontFamily: 'Georgia, serif' }}>
                {String(i + 1).padStart(2, '0')}
              </Typography>
              <Typography variant="h6" gutterBottom>{s.title}</Typography>
              <Typography variant="body2" color="text.secondary">{s.text}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Typography variant="h5" component="h2" sx={{ fontFamily: 'Georgia, serif', mb: 3 }}>
        {t('delivery.zonesTitle')}
      </Typography>

      <Grid container spacing={3}>
        {DELIVERY.map((z) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={z.zone}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" color="primary" gutterBottom>
                {t('common.zone')} {z.zone} — {i18n.language === 'fr' ? z.name : z.en.name}
              </Typography>
              <Typography variant="h5" color="secondary" gutterBottom>
                {money(z.fee, locale)}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {i18n.language === 'fr' ? z.delay : z.en.delay}
              </Typography>
              <List dense>
                {z.areas.map((a) => (
                  <ListItem key={a} disablePadding>
                    <ListItemText primary={a} />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ mt: 4, p: 3, bgcolor: 'background.paper', borderRadius: 1 }}>
        <Typography variant="body2">
          {DELIVERY_RULES.freeFrom > 0 && DELIVERY_RULES.freeZones.length > 0 &&
            t('common.freeRule', { from: money(DELIVERY_RULES.freeFrom, locale), zones: DELIVERY_RULES.freeZones.join(', ') })
          }
          {DELIVERY_RULES.minOrder > 0 && (
            <> {t('common.minRule', { min: money(DELIVERY_RULES.minOrder, locale) })}</>
          )}
        </Typography>
      </Box>
    </Container>
  );
}
