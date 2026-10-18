import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Box, Container, Typography, Button, Grid, Paper } from '@mui/material';

export default function HomePage() {
  const { t } = useTranslation();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ textAlign: 'center', py: 6 }}>
        <Typography variant="overline" color="secondary" gutterBottom>
          {t('hero.eyebrow')}
        </Typography>
        <Typography variant="h1" component="h1" sx={{ fontFamily: 'Georgia, serif', mb: 3, fontSize: { xs: '2rem', md: '3rem' } }}>
          Une page s'ouvre.<br />
          <em style={{ color: 'secondary.main' }}>Nous vous la livrons.</em>
        </Typography>
        <Typography variant="body1" sx={{ maxWidth: 600, mx: 'auto', mb: 4, fontSize: '1.1rem' }}>
          {t('hero.intro')}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button variant="contained" size="large" component={Link} to="/catalogue">
            {t('hero.cta')}
          </Button>
          <Button variant="outlined" size="large" component={Link} to="/commander?type=quote">
            {t('hero.list')}
          </Button>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
          {t('hero.channels')}
        </Typography>
      </Box>

      <Paper sx={{ p: 3, mb: 4, bgcolor: 'primary.main', color: 'white' }}>
        <Grid container spacing={2} textAlign="center">
          <Grid xs={12} md={4}>
            <Typography variant="h6">{t('strip.step1')}</Typography>
          </Grid>
          <Grid xs={12} md={4}>
            <Typography variant="h6">{t('strip.step2')}</Typography>
          </Grid>
          <Grid xs={12} md={4}>
            <Typography variant="h6">{t('strip.step3')}</Typography>
          </Grid>
        </Grid>
      </Paper>

      <Box sx={{ py: 4 }}>
        <Typography variant="overline" color="secondary">{t('lists.eyebrow')}</Typography>
        <Typography variant="h2" component="h2" sx={{ fontFamily: 'Georgia, serif', mb: 2 }}>
          {t('lists.title')}
        </Typography>
        <Typography variant="body1" sx={{ mb: 3 }}>{t('lists.text')}</Typography>
        <Button variant="contained" component={Link} to="/commander?type=quote">
          {t('lists.cta')}
        </Button>
      </Box>
    </Container>
  );
}
