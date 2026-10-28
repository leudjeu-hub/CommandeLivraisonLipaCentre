import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert, Box, Button, Chip, Collapse, FormControl, InputAdornment, InputLabel, MenuItem, Paper, Select, Stack,
  TextField, ToggleButton, ToggleButtonGroup, Typography,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import { money, PAYMENT_LABELS, SLOT_LABELS } from '../data/catalogue';
import {
  clientRef, customerWhatsApp, listOrders, notesWithoutRef, ORDER_STATUSES, setOrderAdminNotes, setOrderStatus,
  type Order, type OrderStatus,
} from '../data/ordersApi';
import { showToast } from '../components/Toast';
import AdminNotes from '../components/AdminNotes';
import { useAuth } from '../context/AuthContext';

// Onglet « Commandes » de la gestion (administrateurs) : commandes et devis envoyés par le
// formulaire du site, détail et suivi du statut, remarque interne. Le stock n'est pas modifié ici.
// Une commande livrée est close : seul un administrateur peut en changer le statut (l'API répond 403 sinon).

type Filter = 'open' | OrderStatus | 'all';
const FILTERS: Filter[] = ['open', ...ORDER_STATUSES, 'all'];
const matches = (o: Order, f: Filter) =>
  f === 'all' || (f === 'open' ? o.status === 'new' || o.status === 'confirmed' : o.status === f);

const label = (o: Order) => clientRef(o) ?? `#${o.id}`;

const STATUS_COLOR = {
  new: 'warning', confirmed: 'info', delivered: 'success', cancelled: 'default',
} as const;

export default function OrdersAdmin() {
  const { t, i18n } = useTranslation();
  const isAdmin = useAuth().user?.role === 'admin';
  const locale = i18n.language === 'fr' ? 'fr-FR' : 'en-GB';
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<Filter>('open');
  const [open, setOpen] = useState<number | null>(null);
  const [search, setSearch] = useState('');

  const load = useCallback(() => {
    setError('');
    listOrders().then(setOrders).catch((err) => setError(err.message));
  }, []);
  useEffect(load, [load]);

  const counts = useMemo(
    () => Object.fromEntries(FILTERS.map((f) => [f, orders?.filter((o) => matches(o, f)).length ?? 0])),
    [orders],
  );
  // Recherche par référence, nom, remarque interne ou téléphone, tous statuts confondus (le client peut citer une
  // commande déjà livrée). « 2510-4821 », « 4821 » et « LC-2510-4821 » trouvent la même commande.
  const query = search.trim().toLowerCase();
  const digits = query.replace(/\D/g, '');
  const found = (o: Order) =>
    `${clientRef(o) ?? ''} n° ${o.id} ${o.customer_name} ${o.admin_notes ?? ''}`.toLowerCase().includes(query) ||
    (digits.length >= 4 && `${clientRef(o) ?? ''} ${o.phone}`.replace(/\D/g, '').includes(digits));
  const shown = orders?.filter((o) => (query ? found(o) : matches(o, filter))) ?? [];

  const changeStatus = async (order: Order, status: OrderStatus) => {
    setError('');
    try {
      const updated = await setOrderStatus(order.id, status);
      setOrders((list) => list?.map((o) => (o.id === updated.id ? updated : o)) ?? null);
      showToast(t('orders.statusChanged', { id: label(order), status: t(`orders.status.${status}`) }));
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const saveNotes = async (order: Order, text: string) => {
    const updated = await setOrderAdminNotes(order.id, text);
    setOrders((list) => list?.map((o) => (o.id === updated.id ? updated : o)) ?? null);
  };

  // Même règle que l'API : 30 jours après l'annulation (ou la création, pour les anciennes)
  const purgeDate = (o: Order) =>
    new Date(new Date(o.status_changed_at ?? o.created_at).getTime() + 30 * 86_400_000)
      .toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' });

  const date = (iso: string) =>
    new Date(iso).toLocaleString(locale, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <>
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', flexWrap: 'wrap', mb: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ flex: '1 1 280px' }}>{t('orders.intro')}</Typography>
        <Button variant="outlined" startIcon={<RefreshIcon />} onClick={load}>{t('orders.refresh')}</Button>
      </Box>
      <ToggleButtonGroup
        size="small"
        exclusive
        value={filter}
        onChange={(_, v) => v && setFilter(v)}
        aria-label={t('orders.filter')}
        sx={{ mb: 2, flexWrap: 'wrap' }}
      >
        {FILTERS.map((f) => (
          <ToggleButton key={f} value={f}>{t(`orders.filter_${f}`)} ({counts[f]})</ToggleButton>
        ))}
      </ToggleButtonGroup>
      {orders && orders.length > 0 && (
        <TextField
          type="search"
          size="small"
          fullWidth
          label={t('orders.search')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> } }}
          helperText={query ? t('orders.found', { count: shown.length }) : undefined}
          sx={{ mb: 2 }}
        />
      )}
      {filter === 'cancelled' && !query && <Alert severity="info" sx={{ mb: 2 }}>{t('orders.purgeInfo')}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {!orders && !error && <Typography color="text.secondary">{t('admin.loading')}</Typography>}
      {orders && shown.length === 0 && <Typography color="text.secondary">{t('orders.empty')}</Typography>}
      <Stack spacing={1.5}>
        {shown.map((o) => {
          const whatsapp = customerWhatsApp(o.phone);
          const fee = o.delivery_fee;
          const locked = o.status === 'delivered' && !isAdmin;
          return (
            <Paper key={o.id} data-testid="order-row" variant="outlined" sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                <Box sx={{ flexGrow: 1, minWidth: 0, overflowWrap: 'anywhere' }}>
                  <Typography sx={{ fontWeight: 700 }}>
                    {clientRef(o) ?? t('orders.number', { id: o.id })} · {o.customer_name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {clientRef(o) && `${t('orders.number', { id: o.id })} · `}{date(o.created_at)} · {o.phone}{o.area && ` · ${o.area}`}
                  </Typography>
                  <Stack direction="row" spacing={0.5} sx={{ mt: 0.5, flexWrap: 'wrap' }}>
                    <Chip size="small" color={STATUS_COLOR[o.status]} label={t(`orders.status.${o.status}`)} />
                    {o.status === 'cancelled' && (
                      <Chip size="small" variant="outlined" label={t('orders.purgeOn', { date: purgeDate(o) })} />
                    )}
                    {o.kind === 'quote' && <Chip size="small" variant="outlined" label={t('orders.quote')} />}
                    {o.admin_notes && <Chip size="small" variant="outlined" color="secondary" label={t('adminNotes.chip')} />}
                    {o.kind === 'order' && (
                      <Chip size="small" variant="outlined" label={money(o.total + (fee ?? 0), locale)} />
                    )}
                  </Stack>
                </Box>
                <Button size="small" onClick={() => setOpen(open === o.id ? null : o.id)} aria-expanded={open === o.id}>
                  {open === o.id ? t('orders.hide') : t('orders.details')}
                </Button>
              </Box>
              <Collapse in={open === o.id} unmountOnExit>
                <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                  <Detail label={t('orders.address')} value={o.address} />
                  <Detail label={t('orders.slot')} value={o.slot && SLOT_LABELS[o.slot] ? t(SLOT_LABELS[o.slot]) : o.slot} />
                  <Detail label={t('orders.payment')} value={o.payment && PAYMENT_LABELS[o.payment] ? t(PAYMENT_LABELS[o.payment]) : o.payment} />
                  <Detail label={t('orders.notes')} value={notesWithoutRef(o)} />
                  {o.items.length > 0 && (
                    <Box component="ul" sx={{ pl: 2.5, my: 1 }}>
                      {o.items.map((i) => (
                        <li key={i.id}>
                          {i.quantity} × {i.product_name} ({t('common.ref', { id: i.product_id })}) : {i.unit_price ? money(i.line_total, locale) : t('orders.onRequest')}
                        </li>
                      ))}
                    </Box>
                  )}
                  {o.kind === 'order' && (
                    <Typography variant="body2">
                      {t('orders.subtotal')} {money(o.total, locale)} · {t('orders.fee')}{' '}
                      {fee === null ? t('orders.feeToAgree') : fee === 0 ? t('orders.feeFree') : money(fee, locale)}
                      {' · '}<strong>{t('orders.toPay')} {money(o.total + (fee ?? 0), locale)}</strong>
                    </Typography>
                  )}
                  <AdminNotes value={o.admin_notes} onSave={(text) => saveNotes(o, text)} />
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center', mt: 2 }}>
                    <FormControl size="small" sx={{ minWidth: 170 }} disabled={locked}>
                      <InputLabel id={`status-${o.id}`}>{t('orders.statusLabel')}</InputLabel>
                      <Select
                        labelId={`status-${o.id}`}
                        label={t('orders.statusLabel')}
                        value={o.status}
                        onChange={(e) => changeStatus(o, e.target.value as OrderStatus)}
                        SelectDisplayProps={locked ? { 'aria-describedby': `status-lock-${o.id}` } : undefined}
                      >
                        {ORDER_STATUSES.map((s) => <MenuItem key={s} value={s}>{t(`orders.status.${s}`)}</MenuItem>)}
                      </Select>
                    </FormControl>
                    {whatsapp && (
                      <Button size="small" variant="outlined" href={whatsapp} target="_blank" rel="noopener noreferrer">
                        {t('orders.whatsapp')}
                      </Button>
                    )}
                    <Button size="small" variant="outlined" href={`tel:${o.phone.replace(/[^\d+]/g, '')}`}>{t('orders.call')}</Button>
                  </Box>
                  {locked && (
                    <Typography id={`status-lock-${o.id}`} variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {t('orders.deliveredLocked')}
                    </Typography>
                  )}
                </Box>
              </Collapse>
            </Paper>
          );
        })}
      </Stack>
    </>
  );
}

function Detail({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <Typography variant="body2" sx={{ mb: 0.5, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
      <strong>{label}</strong> {value}
    </Typography>
  );
}
