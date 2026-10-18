import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Container, Typography, TextField, Chip, Grid, Card, CardContent, CardMedia, CardActions, Button, Box, Typography as MuiTypography } from '@mui/material';
import { CATEGORIES, money } from '../data/catalogue';
import { useProducts } from '../data/useProducts';
import { useCart } from '../context/CartContext';
import { showToast } from '../components/Toast';

export default function CataloguePage() {
  const { t, i18n } = useTranslation();
  const { addItem } = useCart();
  const products = useProducts();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Tout');

  const filtered = useMemo(() => {
    const q = search.normalize('NFD').replace(/[̀-ͯ]/g, '').toLocaleLowerCase('fr').trim();
    return products.filter((p) => {
      const matchCat = category === 'Tout' || p.cat === category;
      const name = (i18n.language === 'fr' ? p.name : p.en?.name || p.name).normalize('NFD').replace(/[̀-ͯ]/g, '').toLocaleLowerCase('fr');
      const desc = (i18n.language === 'fr' ? p.desc : p.en?.desc || p.desc).normalize('NFD').replace(/[̀-ͯ]/g, '').toLocaleLowerCase('fr');
      const matchSearch = !q || name.includes(q) || desc.includes(q) || t(`cat.${p.cat}`).toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [products, search, category, i18n.language, t]);

  const handleAdd = (productId: number) => {
    const p = products.find((x) => x.id === productId);
    if (!p) return;
    if (p.price === null) {
      window.location.href = `/commander?type=quote&product=${productId}`;
      return;
    }
    addItem(productId);
    showToast(t('toast.added'));
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="overline" color="secondary">{t('catalogue.eyebrow')}</Typography>
      <Typography variant="h2" component="h1" sx={{ fontFamily: 'Georgia, serif', mb: 1 }}>
        {t('catalogue.title')}
      </Typography>
      <MuiTypography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {t('catalogue.note')}
      </MuiTypography>

      <TextField
        fullWidth
        variant="outlined"
        placeholder={t('catalogue.searchPlaceholder')}
        label={t('catalogue.searchLabel')}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 2 }}
      />

      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
        {CATEGORIES.map((c) => (
          <Chip
            key={c}
            label={t(`cat.${c}`)}
            onClick={() => setCategory(c)}
            color={category === c ? 'primary' : 'default'}
            variant={category === c ? 'filled' : 'outlined'}
          />
        ))}
      </Box>

      {filtered.length === 0 ? (
        <MuiTypography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
          {t('common.noResults')}
        </MuiTypography>
      ) : (
        <Grid container spacing={3}>
          {filtered.map((p) => {
            const name = i18n.language === 'fr' ? p.name : p.en?.name || p.name;
            const desc = i18n.language === 'fr' ? p.desc : p.en?.desc || p.desc;
            return (
              <Grid xs={12} sm={6} md={4} key={p.id}>
                <Card data-testid="product-card" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  {p.image && (
                    <CardMedia component="img" height="200" image={p.image} alt={name} loading="lazy" />
                  )}
                  <CardContent sx={{ flexGrow: 1 }}>
                    <MuiTypography variant="caption" color="text.secondary">
                      {t(`cat.${p.cat}`)}
                    </MuiTypography>
                    <MuiTypography variant="h6" component="h3" sx={{ fontFamily: 'Georgia, serif' }}>
                      {name}
                    </MuiTypography>
                    <MuiTypography variant="body2" color="text.secondary">
                      {desc}
                    </MuiTypography>
                  </CardContent>
                  <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                    <MuiTypography variant="h6" color="primary">
                      {p.price === null ? t('common.onQuote') : money(p.price, i18n.language === 'fr' ? 'fr-FR' : 'en-GB')}
                    </MuiTypography>
                    <Button variant="contained" size="small" onClick={() => handleAdd(p.id)}>
                      {p.price === null ? t('common.request') : t('common.add')}
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Container>
  );
}
