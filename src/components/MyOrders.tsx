import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Box, Button, Chip, Collapse, Paper, Stack, Typography } from '@mui/material';
import { money } from '../data/catalogue';
import { claimPendingOrders, clientRef, listMyOrders, notesWithoutRef, type Order } from '../data/ordersApi';

// Mon compte > Mes commandes : les commandes et devis envoyés en étant connecté, ou sans compte depuis
// ce navigateur (rattachés à l'ouverture). L'API ne renvoie que celles du compte (GET /orders/mine).

const STATUS_COLOR = {
  new: 'warning', confirmed: 'info', delivered: 'success', cancelled: 'default',
} as const;

export default function MyOrders({ first = false }: { first?: boolean }) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'fr' ? 'fr-FR' : 'en-GB';
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState('');
  const [open, setOpen] = useState<number | null>(null);

  // Délai par défaut (15 s) : si le serveur se réveille, « Réessayer » aboutit ensuite
  const load = useCallback(() => {
    setError('');
    // D'abord les commandes envoyées sans compte depuis ce navigateur, pour qu'elles apparaissent
    claimPendingOrders()
      .catch(() => undefined)
      .then(listMyOrders)
      .then(setOrders)
      .catch((err) => setError(err.message));
  }, []);
  useEffect(load, [load]);

  const date = (iso: string) =>
    new Date(iso).toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <Box component="section" aria-labelledby="mes-commandes" sx={{ mt: first ? 0 : 4 }}>
      <Typography id="mes-commandes" variant="h5" component="h2" sx={{ fontFamily: 'Georgia, serif', mb: 1 }}>
        {t('myOrders.title')}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{t('myOrders.intro')}</Typography>
      {error && (
        <Alert severity="warning" sx={{ mb: 2 }} action={<Button color="inherit" onClick={load}>{t('auth.retry')}</Button>}>
          {error}
        </Alert>
      )}
      {!orders && !error && <Typography color="text.secondary" role="status">{t('admin.loading')}</Typography>}
      {orders?.length === 0 && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography>{t('myOrders.empty')}</Typography>
        </Paper>
      )}
      <Stack spacing={1.5}>
        {orders?.map((o) => {
          const fee = o.delivery_fee;
          const notes = notesWithoutRef(o);
          return (
            <Paper key={o.id} data-testid="my-order" variant="outlined" sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, flexWrap: 'wrap' }}>
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 700 }}>
                    {t(o.kind === 'quote' ? 'myOrders.quote' : 'myOrders.order')} {clientRef(o) ?? t('orders.number', { id: o.id })}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t(o.kind === 'quote' ? 'myOrders.sentOnQuote' : 'myOrders.sentOn', { date: date(o.created_at) })}
                    {o.kind === 'order' && ` · ${money(o.total + (fee ?? 0), locale)}`}
                  </Typography>
                </Box>
                <Chip size="small" color={STATUS_COLOR[o.status]} label={t(`myOrders.status.${o.status}`)} />
              </Box>
              <Button
                size="small"
                sx={{ mt: 1, ml: -1 }}
                aria-expanded={open === o.id}
                onClick={() => setOpen(open === o.id ? null : o.id)}
              >
                {open === o.id ? t('orders.hide') : t('orders.details')}
              </Button>
              <Collapse in={open === o.id} unmountOnExit>
                <Box sx={{ mt: 1 }}>
                  {o.items.length > 0 && (
                    <Box component="ul" sx={{ pl: 2.5, my: 1 }}>
                      {o.items.map((i) => (
                        <Typography component="li" variant="body2" key={i.id}>
                          {i.quantity} × {i.product_name} : {i.unit_price ? money(i.line_total, locale) : t('orders.onRequest')}
                        </Typography>
                      ))}
                    </Box>
                  )}
                  {o.kind === 'order' && (
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      {t('orders.subtotal')} {money(o.total, locale)} · {t('orders.fee')}{' '}
                      {fee === null ? t('orders.feeToAgree') : fee === 0 ? t('orders.feeFree') : money(fee, locale)}
                    </Typography>
                  )}
                  {[
                    [t('orders.address'), [o.area, o.address].filter(Boolean).join(', ')],
                    [t('orders.notes'), notes],
                  ].map(([label, value]) => value && (
                    <Typography key={label} variant="body2" sx={{ mb: 0.5, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                      <strong>{label}</strong> {value}
                    </Typography>
                  ))}
                </Box>
              </Collapse>
            </Paper>
          );
        })}
      </Stack>
    </Box>
  );
}
