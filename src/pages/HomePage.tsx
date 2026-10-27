import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Box, Button, Container, Link as MuiLink, Typography } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import LocalShippingIcon from '@mui/icons-material/LocalShippingOutlined';
import RedeemIcon from '@mui/icons-material/RedeemOutlined';
import PaymentsIcon from '@mui/icons-material/PaymentsOutlined';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { DELIVERY, DELIVERY_RULES, money, whatsappLink } from '../data/catalogue';
import { useProducts } from '../data/useProducts';
import ProductCard from '../components/ProductCard';
import QuoteSection from '../components/QuoteSection';

export default function HomePage() {
  const { t, i18n } = useTranslation();
  const fr = i18n.language === 'fr';
  const locale = fr ? 'fr-FR' : 'en-GB';
  // Quelques articles avec prix, pour montrer le catalogue dès l'accueil
  const selection = useProducts().filter((p) => p.price !== null).slice(0, 4);
  const steps = [1, 2, 3].map((n) => ({ n, title: t(`strip.step${n}Title`), text: t(`strip.step${n}Text`) }));

  // Arguments chiffrés tirés de la grille de livraison (src/data/catalogue.ts), jamais écrits en dur
  const list = (items: string[]) => (items.length > 1 ? `${items.slice(0, -1).join(', ')} ${t('common.and')} ${items[items.length - 1]}` : items[0] ?? '');
  const zoneName = (z: (typeof DELIVERY)[number]) => (fr ? z.name : z.en.name);
  const delayOf = (z: (typeof DELIVERY)[number]) => (fr ? z.delay : z.en.delay);
  const sameDay = DELIVERY.filter((z) => z.en.delay === 'Same day');
  const minFee = money(Math.min(...DELIVERY.map((z) => z.fee)), locale);
  const sameDayZones = list(sameDay.map(zoneName));
  const freeZones = list(DELIVERY.filter((z) => DELIVERY_RULES.freeZones.includes(z.zone)).map(zoneName));
  const first = DELIVERY[0];
  const last = DELIVERY[DELIVERY.length - 1];
  // « Le jour même (Centre, Proche), sous 24 h (Éloigné)… » : zones regroupées par délai
  const delays = [...new Set(DELIVERY.map(delayOf))]
    .map((d, i) => `${i ? d.charAt(0).toLowerCase() + d.slice(1) : d} (${DELIVERY.filter((z) => delayOf(z) === d).map(zoneName).join(', ')})`)
    .join(', ');
  const faq = [1, 2, 3, 4, 5, 6, 7].map((n) => ({
    n,
    q: t(`faq.q${n}`),
    a: t(`faq.a${n}`, {
      min: money(n === 7 ? DELIVERY_RULES.minOrder : first.fee, locale),
      max: money(last.fee, locale),
      firstZone: zoneName(first),
      firstAreas: first.areas.slice(0, 3).join(', '),
      lastZone: zoneName(last),
      lastAreas: last.areas.slice(0, 3).join(', '),
      from: money(DELIVERY_RULES.freeFrom, locale),
      freeZones,
      delays,
    }),
  }));
  const trust = [
    { title: t('trust.sameDayTitle'), text: t('trust.sameDayText', { zones: sameDayZones, areas: sameDay.flatMap((z) => z.areas).slice(3, 6).join(', '), fee: minFee }) },
    { title: t('trust.freeTitle'), text: t('trust.freeText', { from: money(DELIVERY_RULES.freeFrom, locale), zones: freeZones }) },
    { title: t('trust.payTitle'), text: t('trust.payText') },
  ];

  const categories = [
    { cat: 'Scolaire', image: 'img/produits/famille-cahiers.webp', text: t('home.catScolaire') },
    { cat: 'Bureau', image: 'img/produits/famille-bureau.webp', text: t('home.catBureau') },
    { cat: 'Livres', image: 'img/produits/famille-livres-scolaires.webp', text: t('home.catLivres') },
  ];
  const trustIcons = [LocalShippingIcon, RedeemIcon, PaymentsIcon];

  return (
    <>
      {/* Accroche : ce que l'on vend et où (H1), une action principale (catalogue), une secondaire (liste scolaire),
          et à côté les trois réponses qui décident d'une commande : délai, prix de la livraison, paiement */}
      <Box component="section" sx={{ pt: { xs: 4, md: 8 }, pb: { xs: 4, md: 7 } }}>
        <Container maxWidth="lg" sx={{ display: 'grid', gap: { xs: 3.5, md: 6 }, gridTemplateColumns: { xs: '1fr', md: '1.25fr 1fr' }, alignItems: 'center' }}>
          <Box>
            <Typography variant="overline" color="secondary" sx={{ display: 'block', lineHeight: 1.6 }}>{t('hero.eyebrow')}</Typography>
            <Typography variant="h1" sx={{ mt: 1, mb: 2 }}>{t('hero.title')}</Typography>
            <Typography sx={{ maxWidth: 520, mb: 3.5, fontSize: { xs: '1rem', md: '1.125rem' }, color: 'text.secondary' }}>
              {t('hero.intro')}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1.5, flexDirection: { xs: 'column', sm: 'row' } }}>
              <Button variant="contained" size="large" component={Link} to="/catalogue" endIcon={<ArrowForwardIcon />}>
                {t('hero.cta')}
              </Button>
              <Button variant="outlined" size="large" component={Link} to="/commander?type=quote" sx={{ bgcolor: '#fff' }}>
                {t('hero.list')}
              </Button>
            </Box>
          </Box>

          {/* Engagements : livraison, gratuité, paiement (les questions que l'on se pose avant de commander) */}
          <Box component="aside" aria-labelledby="trust-title" sx={{ bgcolor: '#fff', border: '1px solid', borderColor: 'divider', borderRadius: 3, p: { xs: 2.5, md: 3.5 } }}>
            <Typography id="trust-title" variant="overline" component="h2" color="secondary" sx={{ display: 'block', mb: 1 }}>
              {t('trust.title')}
            </Typography>
            <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0, display: 'grid', gap: 2 }}>
              {trust.map((item, i) => {
                const Icon = trustIcons[i];
                return (
                  <Box component="li" key={item.title} sx={{ display: 'flex', gap: 1.75, alignItems: 'flex-start' }}>
                    <Box aria-hidden sx={{ flexShrink: 0, width: 40, height: 40, borderRadius: '50%', bgcolor: 'primary.main', color: 'secondary.light', display: 'grid', placeItems: 'center' }}>
                      <Icon fontSize="small" />
                    </Box>
                    <Box>
                      <Typography variant="h6" component="h3" sx={{ fontSize: '1rem' }}>{item.title}</Typography>
                      <Typography variant="body2" color="text.secondary">{item.text}</Typography>
                    </Box>
                  </Box>
                );
              })}
            </Box>
            <Button component={Link} to="/livraison" endIcon={<ArrowForwardIcon />} sx={{ mt: 1.5, ml: -1.5 }}>{t('trust.link')}</Button>
          </Box>
        </Container>
      </Box>

      {/* Raccourcis par catégorie : on sait ce que l'on cherche (école, bureau, livres) → un toucher, catalogue filtré */}
      <Container component="section" maxWidth="lg" aria-labelledby="cats-title" sx={{ pb: { xs: 5, md: 7 } }}>
        <Typography id="cats-title" variant="h3" component="h2" sx={{ mb: 2.5 }}>{t('home.catsTitle')}</Typography>
        <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0, display: 'grid', gap: { xs: 1.5, md: 2.5 }, gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' } }}>
          {categories.map((c) => (
            <li key={c.cat}>
              <Box
                component={Link}
                to={`/catalogue?cat=${c.cat}`}
                sx={{
                  display: 'flex', flexDirection: { xs: 'row', sm: 'column' }, alignItems: { xs: 'center', sm: 'stretch' }, gap: { xs: 2, sm: 0 },
                  height: '100%', bgcolor: '#fff', border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden',
                  color: 'text.primary', textDecoration: 'none', transition: 'border-color 150ms, box-shadow 150ms, transform 150ms',
                  '&:hover': { borderColor: 'primary.main', boxShadow: '0 6px 20px rgba(22,50,92,0.12)', transform: 'translateY(-2px)' },
                  '&:active': { transform: 'none' },
                }}
              >
                <Box
                  component="img"
                  src={`${import.meta.env.BASE_URL}${c.image}`}
                  alt=""
                  width={480}
                  height={480}
                  loading="lazy"
                  sx={{ display: 'block', objectFit: 'cover', flexShrink: 0, width: { xs: 88, sm: '100%' }, height: { xs: 88, sm: 'auto' }, aspectRatio: { sm: '16 / 9' } }}
                />
                <Box sx={{ p: { xs: 0, sm: 2 }, pr: { xs: 2, sm: 2 }, flexGrow: 1 }}>
                  <Typography variant="h6" component="h3" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                    {t(`home.cat${c.cat}Title`)}
                    <ArrowForwardIcon fontSize="small" aria-hidden sx={{ color: 'secondary.main' }} />
                  </Typography>
                  <Typography variant="body2" color="text.secondary">{c.text}</Typography>
                </Box>
              </Box>
            </li>
          ))}
        </Box>
      </Container>

      {/* Sélection d'articles : des prix visibles dès le deuxième écran */}
      {selection.length > 0 && (
        <Container component="section" maxWidth="lg" sx={{ pb: { xs: 5, md: 8 } }} aria-labelledby="selection-title">
          <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', mb: 2.5 }}>
            <Typography id="selection-title" variant="h3" component="h2">{t('home.selectionTitle')}</Typography>
            <Button component={Link} to="/catalogue" endIcon={<ArrowForwardIcon />}>{t('home.selectionCta')}</Button>
          </Box>
          <Box sx={{ display: 'grid', gap: { xs: 1.5, sm: 2.5 }, gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', md: 'repeat(4, minmax(0, 1fr))' } }}>
            {selection.map((p) => <ProductCard key={p.id} product={p} />)}
          </Box>
        </Container>
      )}

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

      {/* Devis : listes scolaires, écoles et entreprises (un seul encart, voir QuoteSection) */}
      <QuoteSection />

      {/* Questions fréquentes : réponses courtes et chiffrées, lisibles par les moteurs de recherche */}
      <Container component="section" maxWidth="md" aria-labelledby="faq-title" sx={{ py: { xs: 5, md: 8 } }}>
        <Typography id="faq-title" variant="h3" component="h2" sx={{ mb: 3 }}>{t('faq.title')}</Typography>
        <Box sx={{ display: 'grid', gap: 2.5 }}>
          {faq.map((f) => (
            <Box key={f.n}>
              <Typography variant="h6" component="h3" sx={{ mb: 0.5 }}>{f.q}</Typography>
              <Typography color="text.secondary">{f.a}</Typography>
              {/* Les frais de chaque quartier sont sur /livraison : lien direct depuis la question sur le prix */}
              {f.n === 1 && (
                <MuiLink component={Link} to="/livraison" sx={{ display: 'inline-flex', alignItems: 'center', minHeight: 44, fontWeight: 600 }}>
                  {t('faq.a1Link')}
                </MuiLink>
              )}
            </Box>
          ))}
        </Box>
        {/* WhatsApp après la dernière réponse : la question n'y est pas, on écrit directement à la librairie
            (l'en-tête et le pied de page gardent aussi un lien WhatsApp) */}
        <Typography sx={{ mt: 3 }}>
          <MuiLink href={whatsappLink(t('catalogue.unavailableWhatsapp'))} target="_blank" rel="noopener" sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, minHeight: 44, fontWeight: 600, color: 'success.main' }}>
            <WhatsAppIcon fontSize="small" aria-hidden />
            {t('hero.whatsapp')}
          </MuiLink>
        </Typography>
      </Container>
    </>
  );
}
