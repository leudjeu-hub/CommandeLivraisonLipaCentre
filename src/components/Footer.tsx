import { useTranslation } from 'react-i18next';
import { Box, Container, Typography, Link as MuiLink, Divider, Grid } from '@mui/material';

export default function Footer() {
  const { t } = useTranslation();

  return (
    <Box component="footer" sx={{ bgcolor: 'primary.main', color: 'white', py: 4, mt: 6 }}>
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Typography variant="h6" gutterBottom>{t('brand.name')}</Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>{t('footer.services')}</Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              {t('footer.address')}<br />
              <MuiLink href="tel:+237693240396" color="inherit" underline="hover">
                {t('footer.phone')}
              </MuiLink>
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Typography variant="h6" gutterBottom>{t('footer.hours')}</Typography>
            <Typography variant="body2">{t('footer.weekdays')} : 08:00 – 18:00</Typography>
            <Typography variant="body2">{t('footer.saturday')} : 09:00 – 15:00</Typography>
            <Typography variant="body2">{t('footer.sunday')} : {t('footer.closed')}</Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Divider sx={{ borderColor: 'rgba(255,255,255,0.2)', mb: 2 }} />
            <MuiLink href="#" color="inherit" underline="hover" onClick={(e) => e.preventDefault()}>
              {t('footer.terms')}
            </MuiLink>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
