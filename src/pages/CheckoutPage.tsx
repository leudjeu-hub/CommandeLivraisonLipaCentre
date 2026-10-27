import { useState, useMemo, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { Container, Typography, TextField, Select, MenuItem, ListSubheader, FormControl, FormHelperText, InputLabel, Button, Box, Paper, Alert } from '@mui/material';
import { useCart } from '../context/CartContext';
import { DELIVERY, DELIVERY_RULES, zoneOfArea, feeFor, money, SHOP, SLOT_LABELS, PAYMENT_LABELS, whatsappLink } from '../data/catalogue';
import { useCatalogue } from '../data/useProducts';
import { showToast } from '../components/Toast';
import CatalogueUnavailable from '../components/CatalogueUnavailable';
import { savePendingClaim, submitOrder } from '../data/ordersApi';
import { useAuth } from '../context/AuthContext';

const OTHER_AREA = '__autre';
// Numéro camerounais : 9 chiffres commençant par 6 (mobile) ou 2 (fixe), indicatif +237 facultatif
const validPhone = (phone: string) => /^(\+?237|00237)?[26]\d{8}$/.test(phone.replace(/[\s.()-]/g, ''));
// Référence du récapitulatif, choisie ici et écrite dans le message : le site ouvre WhatsApp avant la
// réponse du serveur, le numéro de Gestion ne peut donc pas y figurer. « LC-2510-4821 » : jour, mois, 4 chiffres
const newReference = () => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `LC-${pad(d.getDate())}${pad(d.getMonth() + 1)}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
};

export default function CheckoutPage() {
  const { t, i18n } = useTranslation();
  const [searchParams] = useSearchParams();
  const { user, ready: authReady } = useAuth();
  const { pathname, search } = useLocation();
  const { items, clearCart } = useCart();
  const { products, status, retry } = useCatalogue();
  const locale = i18n.language === 'fr' ? 'fr-FR' : 'en-GB';

  const type = searchParams.get('type') === 'quote' ? 'quote' : 'order';
  const prefillProduct = searchParams.get('product');

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState(false);
  const [area, setArea] = useState('');
  // Quartier manquant : message sous le champ (pas la bulle du navigateur sur le champ caché de MUI)
  const [areaError, setAreaError] = useState(false);
  const areaRef = useRef<HTMLDivElement>(null);
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
  const [summary, setSummary] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [showAfterSend, setShowAfterSend] = useState(false);
  // Canal choisi par le client : le site ouvre seulement WhatsApp ou la messagerie, il ne peut pas
  // savoir si le message est vraiment parti. La confirmation le dit honnêtement.
  const [sentVia, setSentVia] = useState<'whatsapp' | 'email' | null>(null);
  const [reference, setReference] = useState('');
  const sentRef = useRef<HTMLDivElement>(null);
  // Focus sur la confirmation : lecteurs d'écran, et visible au retour sur l'onglet
  useEffect(() => {
    if (sentVia) sentRef.current?.focus();
  }, [sentVia]);

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

  const buildSummary = (ref: string) => {
    const lines = [
      'LIBRAIRIE PAPETERIE DU CENTRE',
      (type === 'quote' ? t('common.sumQuote') : t('common.sumOrder')) + t('common.sumPending'),
      t('common.sumRef') + ref,
      t('common.sumDate') + new Date().toLocaleDateString(locale),
      '',
      t('common.sumName') + name,
      t('common.sumPhone') + phone,
      t('common.sumArea') + (area === OTHER_AREA ? areaOther : area),
      t('common.sumAddress') + (address.trim() || t('form.notSpecified')),
      // Libellés traduits (pas « morning » ni « cash ») ; rien choisi : « À convenir »
      t('common.sumSlot') + (slot ? t(SLOT_LABELS[slot]) : t('form.notSpecified')),
      t('common.sumPayment') + (payment ? t(PAYMENT_LABELS[payment]) : t('form.notSpecified')),
      '',
    ];
    if (type !== 'quote') {
      cartProducts.forEach(({ product, quantity }) => {
        const pname = i18n.language === 'fr' ? product.name : product.en?.name || product.name;
        lines.push(`${quantity} × ${pname} (${t('common.ref', { id: product.id })}) : ${money((product.price || 0) * quantity, locale)}`);
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
    if (!area) {
      setAreaError(true);
      areaRef.current?.querySelector<HTMLElement>('[role="combobox"]')?.focus();
      return;
    }
    const ref = newReference();
    setReference(ref);
    setSummary(buildSummary(ref));
    setShowResult(true);
    setSentVia(null);
  };

  // Ouvre l'application mail du client (mailto:) avec le récapitulatif ; aucun envoi côté serveur
  const emailSubject = t(type === 'quote' ? 'result.emailSubjectQuote' : 'result.emailSubjectOrder', { name });
  const mailtoHref = `mailto:${SHOP.email}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(summary)}`;

  // Enregistre la commande pour Gestion > Commandes, une fois par récapitulatif, dès que le client
  // l'envoie (WhatsApp, e-mail, copie ou téléchargement). Sans attendre ni bloquer : si l'API est
  // en veille ou injoignable, la commande part quand même par WhatsApp ou e-mail.
  const recorded = useRef('');
  const recordOrder = () => {
    if (recorded.current === summary) return;
    recorded.current = summary;
    submitOrder({
      kind: type,
      customer_name: name,
      phone,
      area: area === OTHER_AREA ? areaOther : area,
      address,
      slot,
      payment,
      // La référence en tête des instructions : Gestion > Commandes la montre dans le détail
      notes: t('common.sumRef') + reference + (notes ? '\n' + notes : ''),
      delivery_fee: fee,
      items: type === 'order' ? cartProducts.map(({ product, quantity }) => ({ product_id: product.id, quantity })) : [],
    })
      // Envoyée sans compte : code gardé pour la rattacher au compte après connexion (Mes commandes)
      .then((order) => order.claim_code && savePendingClaim(order.claim_code))
      .catch(() => undefined);
  };

  const refParts = t('result.sentRef', { ref: '\u0001' }).split('\u0001');

  const handleSendClick = (via: 'whatsapp' | 'email') => {
    recordOrder();
    setSentVia(via);
    if (type !== 'quote' && items.length > 0) setShowAfterSend(true);
  };

  const handleClearAfterSend = () => {
    clearCart();
    setShowAfterSend(false);
    setShowResult(false);
    showToast(t('toast.thanks'));
  };

  const handleDownload = () => {
    recordOrder();
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
    recordOrder();
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

      <Alert severity="info" sx={{ mb: 3 }}>{t(type === 'quote' ? 'form.introQuote' : 'form.intro')}</Alert>

      {/* Connecté, la commande est liée au compte (Mon compte > Mes commandes) ; sinon, on l'y invite
          avant qu'il remplisse le formulaire (le panier est gardé, les champs saisis seraient perdus) */}
      {authReady && !showResult && (user ? (
        <Typography variant="body2" color="text.secondary" sx={{ mt: -1.5, mb: 3 }}>{t('form.linkedToAccount')}</Typography>
      ) : (
        <Paper variant="outlined" data-testid="login-hint" sx={{ p: 2, mb: 3 }}>
          <Typography variant="body2" sx={{ mb: 1.5 }}>{t('form.loginHint')}</Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button variant="contained" size="small" component={Link} to={`/connexion?suite=${encodeURIComponent(pathname + search)}`}>
              {t('form.loginHintLogin')}
            </Button>
            <Button variant="outlined" size="small" component={Link} to={`/inscription?suite=${encodeURIComponent(pathname + search)}`}>
              {t('form.loginHintRegister')}
            </Button>
          </Box>
        </Paper>
      ))}

      {/* Liste scolaire sur papier : la photo par WhatsApp évite de tout retaper */}
      {type === 'quote' && !showResult && (
        <Alert severity="success" icon={false} sx={{ mb: 3, flexDirection: 'column', alignItems: 'flex-start' }}>
          {t('form.quoteWhatsapp')}
          <Button variant="contained" color="success" href={whatsappLink(t('form.quoteWhatsappText'))} target="_blank" rel="noopener" sx={{ mt: 1.5 }}>
            {t('form.quoteWhatsappCta')}
          </Button>
        </Alert>
      )}

      {/* Rappel du panier : le client voit ce qu'il commande sans revenir en arrière */}
      {type === 'order' && cartProducts.length > 0 && !showResult && (
        <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
          <Typography variant="overline" color="text.secondary">{t('cart.summary')}</Typography>
          {cartProducts.map(({ product, quantity }) => (
            <Box key={product.id} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, fontSize: '0.9375rem' }}>
              <span>{quantity} × {i18n.language === 'fr' ? product.name : product.en?.name || product.name} ({t('common.ref', { id: product.id })})</span>
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

          {/* required sur le FormControl (astérisque, aria-required) et pas sur le Select : sinon le
              navigateur valide l'<input> caché de MUI et affiche sa bulle hors de l'écran */}
          <FormControl fullWidth required error={areaError} ref={areaRef} sx={{ mb: 2 }}>
            <InputLabel id="area-label">{t('form.area')}</InputLabel>
            <Select
              labelId="area-label"
              value={area}
              onChange={(e) => { setArea(e.target.value); setAreaError(false); }}
              label={t('form.area')}
              aria-describedby={areaError ? 'area-error' : undefined}
              inputProps={{ required: false }}
            >
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
            {areaError && <FormHelperText id="area-error">{t('form.errArea')}</FormHelperText>}
          </FormControl>

          {area === OTHER_AREA && (
            <TextField fullWidth required label={t('form.areaOther')} value={areaOther} onChange={(e) => setAreaOther(e.target.value)} sx={{ mb: 2 }} />
          )}

          {feeLine && (
            <Alert severity="info" sx={{ mb: 2 }}>{feeLine}</Alert>
          )}

          {/* Devis : l'adresse peut attendre, le nom et le téléphone suffisent pour envoyer un prix */}
          <TextField fullWidth required={type !== 'quote'} multiline rows={2} label={t('form.address')} value={address} onChange={(e) => setAddress(e.target.value)} sx={{ mb: 2 }} />

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="slot-label">{t('form.slot')}</InputLabel>
            <Select labelId="slot-label" value={slot} onChange={(e) => setSlot(e.target.value)} label={t('form.slot')}>
              {Object.entries(SLOT_LABELS).map(([value, key]) => <MenuItem key={value} value={value}>{t(key)}</MenuItem>)}
            </Select>
            <FormHelperText>{t('form.slotHelp')}</FormHelperText>
          </FormControl>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="payment-label">{t('form.payment')}</InputLabel>
            <Select labelId="payment-label" value={payment} onChange={(e) => setPayment(e.target.value)} label={t('form.payment')}>
              {Object.entries(PAYMENT_LABELS).map(([value, key]) => <MenuItem key={value} value={value}>{t(key)}</MenuItem>)}
            </Select>
            <FormHelperText>{t('form.paymentHelp')}</FormHelperText>
          </FormControl>

          <TextField fullWidth multiline rows={3} label={t('form.notes')} value={notes} onChange={(e) => setNotes(e.target.value)} sx={{ mb: 2 }} />

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{t('form.confirmNote')}</Typography>

          <Button type="submit" variant="contained" fullWidth size="large">
            {t(type === 'quote' ? 'form.submitQuote' : 'form.submit')}
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
              href={whatsappLink(summary)}
              target="_blank"
              rel="noopener"
              onClick={() => handleSendClick('whatsapp')}
            >
              {t('result.whatsapp')}
            </Button>
            <Button variant="contained" href={mailtoHref} onClick={() => handleSendClick('email')}>
              {t('result.email')}
            </Button>
            <Button variant="outlined" onClick={handleDownload}>{t('result.download')}</Button>
            <Button variant="outlined" onClick={handleCopy}>{t('result.copy')}</Button>
          </Box>

          {/* Pas de « merci » ici : le message n'est parti que si le client appuie sur Envoyer.
              Pas de role="status" non plus : le focus y est déjà placé, il serait lu deux fois. */}
          {sentVia && (
            <Alert ref={sentRef} tabIndex={-1} severity="info" sx={{ mt: 3, alignItems: 'flex-start' }}>
              <Typography component="p" sx={{ fontWeight: 700, mb: 1 }}>
                {t(type === 'quote' ? 'result.sentTitleQuote' : 'result.sentTitleOrder')}
              </Typography>
              <Typography component="p" sx={{ mb: 1 }}>
                {t(sentVia === 'whatsapp' ? 'result.sentWhatsapp' : 'result.sentEmail')}
              </Typography>
              {/* Référence en gras et sur une seule ligne (pas « LC-2510- » puis « 1541 » à 360 px) */}
              <Typography component="p" sx={{ mb: 1 }}>
                {refParts[0]}
                <Box component="strong" sx={{ whiteSpace: 'nowrap' }}>{reference}</Box>
                {refParts[1]}
              </Typography>
              <Typography component="p">{t('result.sentContact')}</Typography>
              {/* Sans compte : se connecter (ou en créer un) pour suivre cette commande dans Mes commandes */}
              {authReady && !user && (
                <Box data-testid="follow-hint" sx={{ mt: 2 }}>
                  <Typography component="p">{t(type === 'quote' ? 'result.followQuote' : 'result.followOrder')}</Typography>
                  <Box sx={{ mt: 1.5, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Button variant="contained" size="small" component={Link} to="/connexion?suite=/compte">{t('form.loginHintLogin')}</Button>
                    <Button variant="outlined" size="small" component={Link} to="/inscription?suite=/compte">{t('form.loginHintRegister')}</Button>
                  </Box>
                </Box>
              )}
              {/* Vider le panier : dans le même encadré, pour ne pas renvoyer la même commande */}
              {showAfterSend && (
                <>
                  <Typography component="p" sx={{ mt: 2 }}>{t('result.afterSend')}</Typography>
                  <Box sx={{ mt: 1.5, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Button variant="contained" onClick={handleClearAfterSend}>{t('result.clearCart')}</Button>
                    <Button variant="outlined" onClick={() => setShowAfterSend(false)}>{t('result.keepCart')}</Button>
                  </Box>
                </>
              )}
            </Alert>
          )}
        </Paper>
      )}
    </Container>
  );
}
