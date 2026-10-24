import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router-dom';
import { Container, Typography, TextField, Select, MenuItem, ListSubheader, FormControl, FormHelperText, InputLabel, Button, Box, Paper, Checkbox, FormControlLabel, Alert } from '@mui/material';
import { useCart } from '../context/CartContext';
import { DELIVERY, DELIVERY_RULES, zoneOfArea, feeFor, money, SHOP } from '../data/catalogue';
import { useCatalogue } from '../data/useProducts';
import { showToast } from '../components/Toast';
import CatalogueUnavailable from '../components/CatalogueUnavailable';

const OTHER_AREA = '__autre';
// Numéro camerounais : 9 chiffres commençant par 6 (mobile) ou 2 (fixe), indicatif +237 facultatif
const validPhone = (phone: string) => /^(\+?237|00237)?[26]\d{8}$/.test(phone.replace(/[\s.()-]/g, ''));

export default function CheckoutPage() {
  const { t, i18n } = useTranslation();
  const [searchParams] = useSearchParams();
  const { items, clearCart } = useCart();
  const { products, status, retry } = useCatalogue();
  const locale = i18n.language === 'fr' ? 'fr-FR' : 'en-GB';

  const type = searchParams.get('type') === 'quote' ? 'quote' : 'order';
  const prefillProduct = searchParams.get('product');

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState(false);
  const [area, setArea] = useState('');
  const [areaOther, setAreaOther] = useState('');
  const [address, setAddress] = useState('');
  const [slot, setSlot] = useState('');
  const [payment, setPayment] = useState('');
  const [notes, setNotes] = useState('');
  // Les articles peuvent arriver après le premier rendu (API en développement)
  const quoteName = prefillProduct ? products.find((p) => p.id === Number(prefillProduct))?.name : undefined;
  useEffect(() => {
    if (quoteName) setNotes((prev) => prev || t('common.quoteNote', { name: quoteName }));
  }, [quoteName, t]);
  const [consent, setConsent] = useState(false);
  const [summary, setSummary] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [showAfterSend, setShowAfterSend] = useState(false);

  const cartProducts = items
    .map((item) => ({ ...item, product: products.find((p) => p.id === item.productId)! }))
    .filter((x) => x.product);

  const subtotal = cartProducts.reduce((sum, x) => sum + (x.product.price || 0) * x.quantity, 0);
  const zone = area && area !== OTHER_AREA ? zoneOfArea(area) : undefined;
  const fee = zone ? feeFor(zone, subtotal, DELIVERY_RULES, type === 'quote') : null;

  const feeLine = useMemo(() => {
    if (!area) return '';
    if (area === OTHER_AREA) return t('common.feeLineOther');
    if (!zone) return '';
    if (fee === 0) return t('common.feeLineFree', { zone: zone.zone, from: money(DELIVERY_RULES.freeFrom, locale), delay: i18n.language === 'fr' ? zone.delay : zone.en.delay });
    let text = t('common.feeLine', { zone: zone.zone, name: i18n.language === 'fr' ? zone.name : zone.en.name, fee: money(fee ?? 0, locale), delay: i18n.language === 'fr' ? zone.delay : zone.en.delay });
    if (type !== 'quote') text += '\n' + t('common.totalLine', { total: money(subtotal + (fee ?? 0), locale) });
    return text;
  }, [area, zone, fee, subtotal, i18n.language, t, locale, type]);

  const buildSummary = () => {
    const lines = [
      'LIBRAIRIE PAPETERIE DU CENTRE',
      (type === 'quote' ? t('common.sumQuote') : t('common.sumOrder')) + t('common.sumPending'),
      t('common.sumDate') + new Date().toLocaleDateString(locale),
      '',
      t('common.sumName') + name,
      t('common.sumPhone') + phone,
      t('common.sumArea') + (area === OTHER_AREA ? areaOther : area),
      t('common.sumAddress') + address,
      t('common.sumSlot') + slot,
      t('common.sumPayment') + payment,
      '',
    ];
    if (type !== 'quote') {
      cartProducts.forEach(({ product, quantity }) => {
        const pname = i18n.language === 'fr' ? product.name : product.en?.name || product.name;
        lines.push(`${quantity} × ${pname} : ${money((product.price || 0) * quantity, locale)}`);
      });
      lines.push(t('common.sumTotal') + money(subtotal, locale));
    }
    if (zone) {
      lines.push(t('common.sumDelivery', { zone: zone.zone, name: i18n.language === 'fr' ? zone.name : zone.en.name }) + (fee === 0 ? t('common.free') : money(fee!, locale)));
      if (type !== 'quote') lines.push(t('common.sumToPay') + money(subtotal + fee!, locale));
    } else {
      lines.push(t('common.sumDeliveryOther'));
    }
    lines.push(t('common.sumConfirm'), '', t('common.sumNotes') + notes, '', t('common.sumDisclaimer'));
    if (i18n.language !== 'fr') lines.push(t('common.sumLanguage'));
    return lines.join('\n');
  };

  const missing = Math.max(0, DELIVERY_RULES.minOrder - subtotal);
  // Commande sans article (lien direct, panier vidé) ou sous le minimum : renvoyer vers le panier
  const orderBlocked = type === 'order' && !showResult && (cartProducts.length === 0 || missing > 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validPhone(phone)) {
      setPhoneError(true);
      return;
    }
    const text = buildSummary();
    setSummary(text);
    setShowResult(true);
  };

  // Ouvre l'application mail du client (mailto:) avec le récapitulatif ; aucun envoi côté serveur
  const emailSubject = t(type === 'quote' ? 'result.emailSubjectQuote' : 'result.emailSubjectOrder', { name });
  const mailtoHref = `mailto:${SHOP.email}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(summary)}`;

  const handleSendClick = () => {
    if (type !== 'quote' && items.length > 0) setShowAfterSend(true);
  };

  const handleClearAfterSend = () => {
    clearCart();
    setShowAfterSend(false);
    setShowResult(false);
    showToast(t('toast.thanks'));
  };

  const handleDownload = () => {
    const blob = new Blob([summary], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'demande-librairie-centre.txt';
    a.click();
    // Révoqué un peu plus tard : certains navigateurs (Safari, Firefox) annulent sinon le téléchargement
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(summary);
      showToast(t('toast.copied'));
    } catch {
      showToast(t('toast.copyFailed'));
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 3, md: 5 } }}>
      <Typography variant="h2" component="h1" sx={{ mb: 2 }}>
        {type === 'quote' ? t('form.quoteTitle') : t('form.orderTitle')}
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>{t('form.intro')}</Alert>

      {/* Rappel du panier : le client voit ce qu'il commande sans revenir en arrière */}
      {type === 'order' && cartProducts.length > 0 && !showResult && (
        <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
          <Typography variant="overline" color="text.secondary">{t('cart.summary')}</Typography>
          {cartProducts.map(({ product, quantity }) => (
            <Box key={product.id} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, fontSize: '0.9375rem' }}>
              <span>{quantity} × {i18n.language === 'fr' ? product.name : product.en?.name || product.name}</span>
              {product.price !== null && <Box component="span" sx={{ whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{money(product.price * quantity, locale)}</Box>}
            </Box>
          ))}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, mt: 1, pt: 1, borderTop: '1px solid', borderColor: 'divider', fontWeight: 700 }}>
            <span>{t('cart.subtotal')}</span>
            <Box component="span" sx={{ fontVariantNumeric: 'tabular-nums' }}>{money(subtotal, locale)}</Box>
          </Box>
        </Paper>
      )}

      {type === 'order' && status === 'unavailable' && items.length > 0 && !showResult ? (
        <CatalogueUnavailable onRetry={retry} />
      ) : type === 'order' && status === 'loading' && items.length > 0 && !showResult ? (
        <Typography color="text.secondary" sx={{ textAlign: 'center', py: 6 }} role="status">{t('catalogue.loading')}</Typography>
      ) : orderBlocked ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            {cartProducts.length === 0
              ? t('form.emptyOrder')
              : t('cart.minimum', { missing: money(missing, locale), min: money(DELIVERY_RULES.minOrder, locale) })}
          </Typography>
          <Button variant="contained" component={Link} to={cartProducts.length === 0 ? '/catalogue' : '/panier'}>
            {cartProducts.length === 0 ? t('nav.catalogue') : t('nav.cart')}
          </Button>
        </Paper>
      ) : !showResult ? (
        <Paper component="form" onSubmit={handleSubmit} sx={{ p: 3 }}>
          <TextField fullWidth required autoComplete="name" label={t('form.name')} value={name} onChange={(e) => setName(e.target.value)} sx={{ mb: 2 }} />
          <TextField
            fullWidth
            required
            type="tel"
            autoComplete="tel"
            label={t('form.phone')}
            value={phone}
            onChange={(e) => { setPhone(e.target.value); setPhoneError(false); }}
            error={phoneError}
            helperText={phoneError ? t('form.errPhone') : t('form.phoneHelp')}
            sx={{ mb: 2 }}
          />

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="area-label">{t('form.area')}</InputLabel>
            <Select labelId="area-label" value={area} onChange={(e) => setArea(e.target.value)} label={t('form.area')} required>
              <MenuItem value="" disabled>{t('common.chooseArea')}</MenuItem>
              {/* Tous les quartiers, groupés par zone (MUI Select n'accepte pas de Fragment : liste à plat) */}
              {DELIVERY.flatMap((z) => [
                <ListSubheader key={`zone-${z.zone}`}>
                  {t('common.zone')} {z.zone} — {i18n.language === 'fr' ? z.name : z.en.name} · {money(z.fee, locale)}
                </ListSubheader>,
                ...z.areas.map((a) => <MenuItem key={a} value={a}>{a}</MenuItem>),
              ])}
              <ListSubheader>{t('common.otherGroup')}</ListSubheader>
              <MenuItem value={OTHER_AREA}>{t('common.otherArea')}</MenuItem>
            </Select>
          </FormControl>

          {area === OTHER_AREA && (
            <TextField fullWidth required label={t('form.areaOther')} value={areaOther} onChange={(e) => setAreaOther(e.target.value)} sx={{ mb: 2 }} />
          )}

          {feeLine && (
            <Alert severity="info" sx={{ mb: 2 }}>{feeLine}</Alert>
          )}

          <TextField fullWidth required multiline rows={2} label={t('form.address')} value={address} onChange={(e) => setAddress(e.target.value)} sx={{ mb: 2 }} />

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="slot-label">{t('form.slot')}</InputLabel>
            <Select labelId="slot-label" value={slot} onChange={(e) => setSlot(e.target.value)} label={t('form.slot')}>
              <MenuItem value="morning">{t('form.slotMorning')}</MenuItem>
              <MenuItem value="afternoon">{t('form.slotAfternoon')}</MenuItem>
              <MenuItem value="phone">{t('form.slotPhone')}</MenuItem>
            </Select>
            <FormHelperText>{t('form.slotHelp')}</FormHelperText>
          </FormControl>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="payment-label">{t('form.payment')}</InputLabel>
            <Select labelId="payment-label" value={payment} onChange={(e) => setPayment(e.target.value)} label={t('form.payment')}>
              <MenuItem value="cash">{t('form.paymentCash')}</MenuItem>
              <MenuItem value="orange">Orange Money</MenuItem>
              <MenuItem value="mtn">MTN MoMo</MenuItem>
            </Select>
            <FormHelperText>{t('form.paymentHelp')}</FormHelperText>
          </FormControl>

          <TextField fullWidth multiline rows={3} label={t('form.notes')} value={notes} onChange={(e) => setNotes(e.target.value)} sx={{ mb: 2 }} />

          <FormControlLabel
            control={<Checkbox required checked={consent} onChange={(e) => setConsent(e.target.checked)} />}
            label={t('form.consent')}
            sx={{ mb: 2 }}
          />

          <Button type="submit" variant="contained" fullWidth size="large">
            {t('form.submit')}
          </Button>
        </Paper>
      ) : (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>{t('result.title')}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{t('result.text')}</Typography>

          <Box component="pre" sx={{ whiteSpace: 'pre-wrap', bgcolor: 'background.paper', p: 2, borderRadius: 1, mb: 2, fontSize: '0.875rem' }}>
            {summary}
          </Box>

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              color="success"
              href={`https://wa.me/${SHOP.whatsapp}?text=${encodeURIComponent(summary)}`}
              target="_blank"
              rel="noopener"
              onClick={handleSendClick}
            >
              {t('result.whatsapp')}
            </Button>
            <Button variant="contained" href={mailtoHref} onClick={handleSendClick}>
              {t('result.email')}
            </Button>
            <Button variant="outlined" onClick={handleDownload}>{t('result.download')}</Button>
            <Button variant="outlined" onClick={handleCopy}>{t('result.copy')}</Button>
          </Box>

          {showAfterSend && (
            <Alert severity="info" sx={{ mt: 3 }}>
              {t('result.afterSend')}
              <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                <Button variant="contained" onClick={handleClearAfterSend}>{t('result.clearCart')}</Button>
                <Button variant="outlined" onClick={() => setShowAfterSend(false)}>{t('result.keepCart')}</Button>
              </Box>
            </Alert>
          )}
        </Paper>
      )}
    </Container>
  );
}
