import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Chip, Container, InputAdornment, TextField, Typography } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { CATEGORIES } from '../data/catalogue';
import { useProducts } from '../data/useProducts';
import ProductCard from '../components/ProductCard';

const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLocaleLowerCase('fr');

export default function CataloguePage() {
  const { t, i18n } = useTranslation();
  const products = useProducts();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Tout');

  const filtered = useMemo(() => {
    const q = fold(search.trim());
    const fr = i18n.language === 'fr';
    return products.filter((p) => {
      const matchCat = category === 'Tout' || p.cat === category;
      const name = fold(fr ? p.name : p.en?.name || p.name);
      const desc = fold(fr ? p.desc : p.en?.desc || p.desc);
      const matchSearch = !q || name.includes(q) || desc.includes(q) || fold(t(`cat.${p.cat}`)).includes(q);
      return matchCat && matchSearch;
    });
  }, [products, search, category, i18n.language, t]);

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
      <Typography variant="overline" color="secondary">{t('catalogue.eyebrow')}</Typography>
      <Typography variant="h2" component="h1" sx={{ mb: 1 }}>{t('catalogue.title')}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>{t('catalogue.note')}</Typography>

      {/* Recherche et filtres restent accessibles en haut de l'écran pendant le défilement */}
      <Box sx={{ position: 'sticky', top: { xs: 56, sm: 64 }, zIndex: 2, bgcolor: 'background.default', py: 1.5, mx: { xs: -2, sm: -3 }, px: { xs: 2, sm: 3 }, mb: 2 }}>
        <TextField
          fullWidth
          type="search"
          placeholder={t('catalogue.searchPlaceholder')}
          label={t('catalogue.searchLabel')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> } }}
        />
        {/* Une seule ligne qui défile horizontalement sur mobile */}
        <Box sx={{ display: 'flex', gap: 1, mt: 1.5, overflowX: 'auto', pb: 0.5, scrollbarWidth: 'none' }}>
          {CATEGORIES.map((c) => (
            <Chip
              key={c}
              label={t(`cat.${c}`)}
              onClick={() => setCategory(c)}
              color={category === c ? 'primary' : 'default'}
              variant={category === c ? 'filled' : 'outlined'}
              aria-pressed={category === c}
              sx={{ flexShrink: 0, bgcolor: category === c ? undefined : '#fff' }}
            />
          ))}
        </Box>
      </Box>

      <Typography variant="body2" color="text.secondary" aria-live="polite" sx={{ mb: 1.5 }}>
        {t('catalogue.count', { count: filtered.length })}
      </Typography>

      {filtered.length === 0 ? (
        <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 6 }}>
          {t('common.noResults')}
        </Typography>
      ) : (
        <Box sx={{ display: 'grid', gap: { xs: 1.5, sm: 2.5 }, gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', md: 'repeat(3, minmax(0, 1fr))', lg: 'repeat(4, minmax(0, 1fr))' } }}>
          {filtered.map((p) => <ProductCard key={p.id} product={p} />)}
        </Box>
      )}
    </Container>
  );
}
