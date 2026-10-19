import { useTranslation } from 'react-i18next';
import { Box, Container, Paper, Typography } from '@mui/material';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import { DELIVERY, DELIVERY_RULES, money } from '../data/catalogue';

export default function DeliveryPage() {
  const { t, i18n } = useTranslation();
  const fr = i18n.language === 'fr';
  const locale = fr ? 'fr-FR' : 'en-GB';

  const steps = [1, 2, 3].map((n) => ({ n, title: t(`delivery.step${n}Title`), text: t(`delivery.step${n}Text`) }));
  const hasFree = DELIVERY_RULES.freeFrom > 0 && DELIVERY_RULES.freeZones.length > 0;

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
      <Typography variant="overline" color="secondary">{t('delivery.eyebrow')}</Typography>
      <Typography variant="h2" component="h1" sx={{ mb: 4 }}>{t('delivery.title')}</Typography>

      <Box component="ol" sx={{ listStyle: 'none', m: 0, p: 0, mb: 6, display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' } }}>
        {steps.map((s) => (
          <Paper component="li" key={s.n} sx={{ p: 3, display: 'flex', gap: 2, alignItems: 'flex-start' }}>
            <Box aria-hidden sx={{ flexShrink: 0, width: 40, height: 40, borderRadius: '50%', bgcolor: 'primary.main', color: '#fff', display: 'grid', placeItems: 'center', fontFamily: 'Georgia, serif', fontSize: '1.125rem' }}>
              {s.n}
            </Box>
            <Box>
              <Typography variant="h6" component="h2">{s.title}</Typography>
              <Typography variant="body2" color="text.secondary">{s.text}</Typography>
            </Box>
          </Paper>
        ))}
      </Box>

      <Typography variant="h3" component="h2" sx={{ mb: 1 }}>{t('delivery.zonesTitle')}</Typography>
      {(hasFree || DELIVERY_RULES.minOrder > 0) && (
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', mb: 3, color: 'text.secondary' }}>
          <LocalShippingOutlinedIcon aria-hidden sx={{ color: 'secondary.main' }} />
          <Typography variant="body2">
            {hasFree && t('common.freeRule', { from: money(DELIVERY_RULES.freeFrom, locale), zones: DELIVERY_RULES.freeZones.join(', ') })}
            {DELIVERY_RULES.minOrder > 0 && <> {t('common.minRule', { min: money(DELIVERY_RULES.minOrder, locale) })}</>}
          </Typography>
        </Box>
      )}

      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' } }}>
        {DELIVERY.map((z) => (
          <Paper key={z.zone} component="section" aria-label={`${t('common.zone')} ${z.zone}`} sx={{ p: 3, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h5" component="h3">
              {t('common.zone')} {z.zone} — {fr ? z.name : z.en.name}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 1, mt: 1, mb: 2, pb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography sx={{ fontWeight: 700, fontSize: '1.375rem', color: 'primary.main', fontVariantNumeric: 'tabular-nums' }}>{money(z.fee, locale)}</Typography>
              <Typography variant="body2" color="secondary.main" sx={{ fontWeight: 600, textAlign: 'right' }}>{fr ? z.delay : z.en.delay}</Typography>
            </Box>
            <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0, display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
              {z.areas.map((a) => (
                <Box component="li" key={a} sx={{ px: 1.25, py: 0.5, borderRadius: 999, bgcolor: 'background.default', fontSize: '0.875rem' }}>{a}</Box>
              ))}
            </Box>
          </Paper>
        ))}
      </Box>
    </Container>
  );
}
