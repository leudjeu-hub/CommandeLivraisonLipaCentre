import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Chip, Container, InputAdornment, TextField, Typography } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { CATEGORIES, type Product } from '../data/catalogue';
import { useProducts } from '../data/useProducts';
import ProductCard from '../components/ProductCard';

const byName = (a: string, b: string) => a.localeCompare(b, 'fr');
const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLocaleLowerCase('fr');

export default function CataloguePage() {
  const { t, i18n } = useTranslation();
  const products = useProducts();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Tout');
  // Famille choisie dans la catégorie ('' = toutes) ; les familles viennent de l'API (Gestion, import CSV)
  const [family, setFamily] = useState('');

  const inCategory = useMemo(
    () => products.filter((p) => category === 'Tout' || p.cat === category),
    [products, category]
  );
  const families = useMemo(
    () => [...new Set(inCategory.map((p) => p.family).filter((f): f is string => !!f))].sort(byName),
    [inCategory]
  );

  const filtered = useMemo(() => {
    const q = fold(search.trim());
    const fr = i18n.language === 'fr';
    return inCategory.filter((p) => {
      const name = fold(fr ? p.name : p.en?.name || p.name);
      const desc = fold(fr ? p.desc : p.en?.desc || p.desc);
      const matchSearch = !q || name.includes(q) || desc.includes(q) || fold(t(`cat.${p.cat}`)).includes(q) || fold(p.family ?? '').includes(q);
      return (!family || p.family === family) && matchSearch;
    });
  }, [inCategory, family, search, i18n.language, t]);

  // Articles regroupés par famille (ordre alphabétique, articles sans famille à la fin)
  const sections = useMemo(() => {
    if (!families.length) return [{ title: '', items: filtered }];
    const groups = new Map<string, Product[]>();
    filtered.forEach((p) => groups.set(p.family ?? '', [...(groups.get(p.family ?? '') ?? []), p]));
    return [...groups.keys()]
      .sort((a, b) => (!a ? 1 : !b ? -1 : byName(a, b)))
      .map((title) => ({ title: title || t('catalogue.otherFamily'), items: groups.get(title)! }));
  }, [filtered, families, t]);

  const chooseCategory = (c: string) => {
    setCategory(c);
    setFamily('');
  };

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
              onClick={() => chooseCategory(c)}
              color={category === c ? 'primary' : 'default'}
              variant={category === c ? 'filled' : 'outlined'}
              aria-pressed={category === c}
              sx={{ flexShrink: 0, bgcolor: category === c ? undefined : '#fff' }}
            />
          ))}
        </Box>
        {families.length > 0 && (
          <Box role="group" aria-label={t('catalogue.families')} sx={{ display: 'flex', gap: 1, mt: 1, overflowX: 'auto', pb: 0.5, scrollbarWidth: 'none' }}>
            {['', ...families].map((f) => (
              <Chip
                key={f || 'all'}
                size="small"
                label={f || t('catalogue.allFamilies')}
                onClick={() => setFamily(f)}
                color={family === f ? 'secondary' : 'default'}
                variant={family === f ? 'filled' : 'outlined'}
                aria-pressed={family === f}
                sx={{ flexShrink: 0, bgcolor: family === f ? undefined : '#fff' }}
              />
            ))}
          </Box>
        )}
      </Box>

      <Typography variant="body2" color="text.secondary" aria-live="polite" sx={{ mb: 1.5 }}>
        {t('catalogue.count', { count: filtered.length })}
      </Typography>

      {filtered.length === 0 ? (
        <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 6 }}>
          {t('common.noResults')}
        </Typography>
      ) : (
        sections.map((s) => (
          <Box component="section" key={s.title} aria-label={s.title || undefined} sx={{ mb: 4 }}>
            {s.title && (
              <Typography variant="h5" component="h2" sx={{ fontFamily: 'Georgia, serif', mb: 1.5 }}>
                {s.title} <Typography component="span" variant="body2" color="text.secondary">({s.items.length})</Typography>
              </Typography>
            )}
            <Box sx={{ display: 'grid', gap: { xs: 1.5, sm: 2.5 }, gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', md: 'repeat(3, minmax(0, 1fr))', lg: 'repeat(4, minmax(0, 1fr))' } }}>
              {s.items.map((p) => <ProductCard key={p.id} product={p} />)}
            </Box>
          </Box>
        ))
      )}
    </Container>
  );
}
