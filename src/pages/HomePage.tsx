import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Box, Button, Container, Typography } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useProducts } from '../data/useProducts';
import ProductCard from '../components/ProductCard';

export default function HomePage() {
  const { t } = useTranslation();
  // Quelques articles avec prix, pour montrer le catalogue dès l'accueil
  const selection = useProducts().filter((p) => p.price !== null).slice(0, 4);
  const steps = [1, 2, 3].map((n) => ({ n, title: t(`strip.step${n}Title`), text: t(`strip.step${n}Text`) }));

  return (
    <>
      {/* Accroche : une action principale (catalogue), une secondaire (liste scolaire) */}
      <Box component="section" sx={{ py: { xs: 6, md: 10 }, textAlign: 'center' }}>
        <Container maxWidth="md">
          <Typography variant="overline" color="secondary">{t('hero.eyebrow')}</Typography>
          <Typography variant="h1" sx={{ mt: 1, mb: 2.5 }}>
            {t('hero.title')}<br />
            <Box component="em" sx={{ color: 'secondary.main' }}>{t('hero.titleEm')}</Box>
          </Typography>
          <Typography sx={{ maxWidth: 560, mx: 'auto', mb: 4, fontSize: { xs: '1rem', md: '1.125rem' }, color: 'text.secondary' }}>
            {t('hero.intro')}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center', flexDirection: { xs: 'column', sm: 'row' }, maxWidth: { xs: 360, sm: 'none' }, mx: 'auto' }}>
            <Button variant="contained" size="large" component={Link} to="/catalogue" endIcon={<ArrowForwardIcon />}>
              {t('hero.cta')}
            </Button>
            <Button variant="outlined" size="large" component={Link} to="/commander?type=quote" sx={{ bgcolor: '#fff' }}>
              {t('hero.list')}
            </Button>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>{t('hero.channels')}</Typography>
        </Container>
      </Box>

      {/* Comment ça marche : 3 étapes numérotées, lisibles d'un coup d'œil */}
      <Box component="section" aria-labelledby="steps-title" sx={{ bgcolor: 'primary.main', color: '#fff', py: { xs: 5, md: 7 } }}>
        <Container maxWidth="lg">
          <Typography id="steps-title" variant="overline" component="h2" sx={{ color: 'secondary.light', display: 'block', mb: 2 }}>
            {t('strip.title')}
          </Typography>
          <Box component="ol" sx={{ listStyle: 'none', m: 0, p: 0, display: 'grid', gap: { xs: 3, md: 5 }, gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' } }}>
            {steps.map((s) => (
              <Box component="li" key={s.n} sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                <Box aria-hidden sx={{ flexShrink: 0, width: 44, height: 44, borderRadius: '50%', border: '2px solid', borderColor: 'secondary.light', color: 'secondary.light', display: 'grid', placeItems: 'center', fontFamily: 'Georgia, serif', fontSize: '1.25rem' }}>
                  {s.n}
                </Box>
                <Box>
                  <Typography variant="h6" component="h3" sx={{ color: '#fff' }}>{s.title}</Typography>
                  <Typography variant="body2" sx={{ opacity: 0.85 }}>{s.text}</Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      {/* Sélection d'articles */}
      {selection.length > 0 && (
        <Container component="section" maxWidth="lg" sx={{ py: { xs: 5, md: 8 } }} aria-labelledby="selection-title">
          <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', mb: 2.5 }}>
            <Typography id="selection-title" variant="h3" component="h2">{t('home.selectionTitle')}</Typography>
            <Button component={Link} to="/catalogue" endIcon={<ArrowForwardIcon />}>{t('home.selectionCta')}</Button>
          </Box>
          <Box sx={{ display: 'grid', gap: { xs: 1.5, sm: 2.5 }, gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', md: 'repeat(4, minmax(0, 1fr))' } }}>
            {selection.map((p) => <ProductCard key={p.id} product={p} />)}
          </Box>
        </Container>
      )}

      {/* Listes scolaires : encart distinct, appel à l'action secondaire */}
      <Container component="section" maxWidth="lg" sx={{ pb: { xs: 2, md: 4 } }}>
        <Box sx={{ bgcolor: '#fff', border: '1px solid', borderColor: 'divider', borderRadius: 3, p: { xs: 3, md: 6 }, display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '1.6fr 1fr' }, alignItems: 'center' }}>
          <Box>
            <Typography variant="overline" color="secondary">{t('lists.eyebrow')}</Typography>
            <Typography variant="h3" component="h2" sx={{ mb: 1.5 }}>{t('lists.title')}</Typography>
            <Typography color="text.secondary">{t('lists.text')}</Typography>
          </Box>
          <Box sx={{ justifySelf: { md: 'end' } }}>
            <Button variant="contained" size="large" component={Link} to="/commander?type=quote" endIcon={<ArrowForwardIcon />} fullWidth>
              {t('lists.cta')}
            </Button>
          </Box>
        </Box>
      </Container>
    </>
  );
}
