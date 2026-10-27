import { useDeferredValue, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Box, Button, Chip, Container, InputAdornment, TextField, Typography } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { CATEGORIES, categoryPath, whatsappLink, type Product } from '../data/catalogue';
import { useCatalogue } from '../data/useProducts';
import ProductCard from '../components/ProductCard';
import CatalogueUnavailable from '../components/CatalogueUnavailable';
import { byFamilyOrder, familyImage } from '../data/photosFamilles';

const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLocaleLowerCase('fr');
// Cartes affichées d'un coup : 1 500 cartes (~18 000 éléments) figent un téléphone d'entrée de gamme
const PAGE = 24;

// fixedCategory : page de catégorie (/fournitures-scolaires…), même catalogue avec son propre titre
export default function CataloguePage({ fixedCategory }: { fixedCategory?: string }) {
  const { t, i18n } = useTranslation();
  const { products, status, retry } = useCatalogue();
  const [search, setSearch] = useState('');
  // La saisie reste fluide : le filtrage suit avec un léger retard si le téléphone est lent
  const query = useDeferredValue(search);
  // Catégorie de départ : lien de l'accueil (/catalogue?cat=Scolaire), sinon « Tout »
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [category, setCategory] = useState(() => fixedCategory ?? (CATEGORIES.includes(params.get('cat') ?? '') ? params.get('cat')! : 'Tout'));
  // Famille choisie dans la catégorie ('' = toutes) ; les familles viennent de l'API (Gestion, import CSV)
  const [family, setFamily] = useState('');

  const inCategory = useMemo(
    () => products.filter((p) => category === 'Tout' || p.cat === category),
    [products, category]
  );
  const families = useMemo(
    () => [...new Set(inCategory.map((p) => p.family).filter((f): f is string => !!f))].sort(byFamilyOrder),
    [inCategory]
  );

  // Texte de recherche de chaque article, calculé une fois (pas à chaque lettre tapée)
  const searchText = useMemo(() => {
    const fr = i18n.language === 'fr';
    return new Map(products.map((p) => [p.id, fold([
      fr ? p.name : p.en?.name || p.name, fr ? p.desc : p.en?.desc || p.desc, t(`cat.${p.cat}`), p.family ?? '',
    ].join(' '))]));
  }, [products, i18n.language, t]);

  const q = fold(query.trim());
  const filtered = useMemo(
    () => inCategory.filter((p) => (!family || p.family === family) && (!q || searchText.get(p.id)!.includes(q))),
    [inCategory, family, q, searchText]
  );

  // Nombre de cartes affichées ; revient à PAGE quand la recherche ou les filtres changent
  const filterKey = `${category}|${family}|${q}`;
  const [shown, setShown] = useState({ key: filterKey, count: PAGE });
  const limit = shown.key === filterKey ? shown.count : PAGE;

  // Articles regroupés par famille (ordre de FAMILY_ORDER, articles sans famille à la fin)
  // (les sections au-delà de la limite sont coupées ; le titre garde le nombre total de la famille)
  const sections = useMemo(() => {
    if (!families.length) return [{ title: '', image: undefined, total: filtered.length, items: filtered.slice(0, limit) }];
    const groups = new Map<string, Product[]>();
    filtered.forEach((p) => {
      const key = p.family ?? '';
      const group = groups.get(key);
      if (group) group.push(p);
      else groups.set(key, [p]);
    });
    let left = limit;
    return [...groups.keys()]
      .sort((a, b) => (!a ? 1 : !b ? -1 : byFamilyOrder(a, b)))
      .map((title) => {
        const all = groups.get(title)!;
        const items = all.slice(0, Math.max(0, left));
        left -= items.length;
        return { title: title || t('catalogue.otherFamily'), image: familyImage(title), total: all.length, items };
      })
      .filter((s) => s.items.length > 0);
  }, [filtered, families, limit, t]);

  // Sur une page de catégorie, une autre catégorie ouvre sa propre page (titre et adresse restent justes)
  const chooseCategory = (c: string) => {
    if (fixedCategory && c !== fixedCategory) return navigate(categoryPath(c));
    setCategory(c);
    setFamily('');
  };

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
      <Typography variant="overline" color="secondary">{t('catalogue.eyebrow')}</Typography>
      <Typography variant="h2" component="h1" sx={{ mb: 1 }}>{t(fixedCategory ? `catalogue.title${fixedCategory}` : 'catalogue.title')}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {t('catalogue.noteLive')}
      </Typography>

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
        {/* Une seule ligne qui défile horizontalement sur mobile ; marge de 6 px pour ne pas couper
            l'anneau de focus des puces (5 px) */}
        <Box sx={{ display: 'flex', gap: 1, mt: 0.75, mx: -0.75, p: 0.75, overflowX: 'auto', scrollbarWidth: 'none' }}>
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
        {/* Même marge de 6 px que la ligne des catégories */}
        {families.length > 0 && (
          <Box role="group" aria-label={t('catalogue.families')} sx={{ display: 'flex', gap: 1, mt: 0.25, mx: -0.75, p: 0.75, overflowX: 'auto', scrollbarWidth: 'none' }}>
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
        {(status === 'api' || status === 'cache') && t('catalogue.count', { count: filtered.length })}
      </Typography>

      {status === 'unavailable' ? (
        <CatalogueUnavailable onRetry={retry} />
      ) : status === 'loading' ? (
        // Première visite, serveur en veille : une autre issue que l'attente. Hauteur d'un écran : les
        // articles arrivent ensuite sans faire sauter le pied de page (CLS)
        <Box sx={{ textAlign: 'center', py: 6, minHeight: '100vh' }} role="status">
          <Typography variant="body1" color="text.secondary">{t('catalogue.loading')}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>{t('catalogue.loadingWhatsapp')}</Typography>
          <Button variant="outlined" color="success" href={whatsappLink(t('catalogue.unavailableWhatsapp'))} target="_blank" rel="noopener" sx={{ mt: 1.5, bgcolor: '#fff' }}>
            {t('catalogue.orderWhatsapp')}
          </Button>
        </Box>
      ) : filtered.length === 0 ? (
        <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 6 }}>
          {t('common.noResults')}
        </Typography>
      ) : (
        sections.map((s, sectionIndex) => (
          <Box component="section" key={s.title} aria-label={s.title || undefined} sx={{ mb: 4 }}>
            {/* La photo de famille, une fois en tête de section (et non répétée sur chaque carte) */}
            {s.title && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                {s.image && (
                  <Box component="img" src={import.meta.env.BASE_URL + s.image} alt="" width={48} height={48} loading={sectionIndex === 0 ? 'eager' : 'lazy'} sx={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                )}
                <Typography variant="h5" component="h2" sx={{ fontFamily: 'Georgia, serif' }}>
                  {s.title} <Typography component="span" variant="body2" color="text.secondary">({s.total})</Typography>
                </Typography>
              </Box>
            )}
            <Box sx={{ display: 'grid', gap: { xs: 1.5, sm: 2.5 }, gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(3, minmax(0, 1fr))', lg: 'repeat(4, minmax(0, 1fr))' } }}>
              {s.items.map((p, i) => <ProductCard key={p.id} product={p} eager={sectionIndex === 0 && i < 4} />)}
            </Box>
          </Box>
        ))
      )}

      {filtered.length > limit && (
        <Box sx={{ textAlign: 'center' }}>
          <Button variant="outlined" size="large" onClick={() => setShown({ key: filterKey, count: limit + PAGE * 2 })} sx={{ bgcolor: '#fff' }}>
            {t('catalogue.more', { count: filtered.length - limit })}
          </Button>
        </Box>
      )}
    </Container>
  );
}
