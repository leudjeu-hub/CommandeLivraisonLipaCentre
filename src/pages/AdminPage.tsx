import { useCallback, useDeferredValue, useEffect, useMemo, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useLocation } from 'react-router-dom';
import {
  Alert, Box, Button, Checkbox, Chip, Container, Dialog, DialogActions, DialogContent, DialogContentText,
  DialogTitle, FormControl, FormControlLabel, IconButton, InputLabel, MenuItem, Paper, Select, Stack,
  InputAdornment, Tab, Tabs, TextField, Typography, useMediaQuery, useTheme,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DownloadIcon from '@mui/icons-material/Download';
import { money } from '../data/catalogue';
import { invalidateProducts } from '../data/useProducts';
import {
  API_CATEGORIES, ApiError, createProduct, deleteProduct, listProducts, updateProduct,
  type ApiProduct, type ProductInput,
} from '../data/productsApi';
import { showToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import SessionWait from '../components/SessionWait';
import {
  canManageHours, deleteUser, listUsers, ROLE_LABEL, ROLES, setActive, setRole, type Role, type User,
} from '../data/authApi';
import HoursAdmin from './HoursAdmin';
import OrdersAdmin from './OrdersAdmin';
import CatalogueImport, { exportCatalogue } from './CatalogueImport';

// Gestion des articles, des commandes, des comptes et des heures : administrateurs ; les responsables
// n'ont que les onglets « Commandes » et « Heures » (l'API le vérifie aussi).

type FormValues = Record<
  'category' | 'name' | 'family' | 'description' | 'price' | 'label' | 'name_en' | 'description_en' | 'label_en' | 'color' | 'image' | 'stock',
  string
> & { available: boolean };

type Errors = Partial<Record<keyof FormValues, string>>;

const EMPTY: FormValues = {
  category: 'Scolaire', name: '', family: '', description: '', price: '', label: '', name_en: '', description_en: '',
  label_en: '', color: '', image: '', stock: '0', available: true,
};

const toForm = (p: ApiProduct): FormValues => ({
  category: p.category,
  name: p.name,
  family: p.family ?? '',
  description: p.description,
  price: p.price === null ? '' : String(Math.round(p.price)),
  label: p.label ?? '',
  name_en: p.name_en ?? '',
  description_en: p.description_en ?? '',
  label_en: p.label_en ?? '',
  color: p.color ?? '',
  image: p.image ?? '',
  stock: String(p.stock),
  available: p.available,
});

// Mêmes règles que l'ancien contrôle du tableau CSV (prix entier, couleur, image locale pour la CSP)
function validate(v: FormValues): Errors {
  const e: Errors = {};
  const price = v.price.replace(/[\s  ]/g, '');
  if (!v.name.trim()) e.name = 'admin.errName';
  if (v.family.trim().length > 60) e.family = 'admin.errFamily';
  if (price && !(/^\d+$/.test(price) && Number(price) > 0)) e.price = 'admin.errPrice';
  if (v.color.trim() && !/^#[0-9a-f]{6}$/i.test(v.color.trim())) e.color = 'admin.errColor';
  const image = v.image.trim();
  if (image && (!/^img\/[\w./-]+\.(webp|avif|png|jpe?g|svg)$/i.test(image) || image.includes('..'))) e.image = 'admin.errImage';
  if (!/^\d+$/.test(v.stock.trim())) e.stock = 'admin.errStock';
  if (!v.name_en.trim() !== !v.description_en.trim()) e.name_en = 'admin.errEn';
  return e;
}

const orNull = (s: string) => s.trim() || null;

// Lignes affichées d'un coup dans la liste des articles (le catalogue en compte ~1 500)
const ROWS = 50;
const fold = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('fr');

const toInput = (v: FormValues, status: string | null): ProductInput => {
  const price = v.price.replace(/[\s  ]/g, '');
  return {
    category: v.category,
    name: v.name.trim(),
    family: orNull(v.family),
    description: v.description.trim(),
    price: price ? Number(price) : null,
    label: orNull(v.label),
    name_en: orNull(v.name_en),
    description_en: orNull(v.description_en),
    label_en: orNull(v.label_en),
    color: orNull(v.color),
    image: orNull(v.image),
    stock: Number(v.stock.trim()),
    available: v.available,
    status,
  };
};

export default function AdminPage() {
  const { t } = useTranslation();
  const { user, ready, offline } = useAuth();
  const { pathname } = useLocation();
  const [tab, setTab] = useState<'products' | 'orders' | 'users' | 'hours' | null>(null);

  if (!ready || (offline && !user)) return <SessionWait />;
  if (!user) return <Navigate to={`/connexion?suite=${encodeURIComponent(pathname)}`} replace />;
  if (!canManageHours(user.role)) {
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" sx={{ fontFamily: 'Georgia, serif', mb: 2 }}>{t('auth.forbiddenTitle')}</Typography>
        <Alert severity="warning">{t('auth.forbiddenText')}</Alert>
      </Container>
    );
  }

  const isAdmin = user.role === 'admin';
  const shown = !isAdmin && (tab === 'products' || tab === 'users') ? 'orders' : tab ?? (isAdmin ? 'products' : 'orders');

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="overline" color="secondary">{t('admin.eyebrow')}</Typography>
      <Typography variant="h4" component="h1" sx={{ fontFamily: 'Georgia, serif', mb: 1 }}>{isAdmin ? t('admin.title') : t('admin.titleManager')}</Typography>
      <Tabs value={shown} onChange={(_, v) => setTab(v)} variant="scrollable" allowScrollButtonsMobile sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
        {isAdmin && <Tab value="products" label={t('admin.tabProducts')} />}
        <Tab value="orders" label={t('admin.tabOrders')} />
        {isAdmin && <Tab value="users" label={t('admin.tabUsers')} />}
        <Tab value="hours" label={t('admin.tabHours')} />
      </Tabs>
      {shown === 'products' && <ProductsAdmin />}
      {shown === 'orders' && <OrdersAdmin />}
      {shown === 'users' && <UsersAdmin currentUserId={user.id} />}
      {shown === 'hours' && <HoursAdmin currentUser={user} />}
    </Container>
  );
}

function UsersAdmin({ currentUserId }: { currentUserId: number }) {
  const { t } = useTranslation();
  const [users, setUsers] = useState<User[] | null>(null);
  const [error, setError] = useState('');
  const [toDelete, setToDelete] = useState<User | null>(null);
  const [deleteError, setDeleteError] = useState('');

  const load = useCallback(() => {
    listUsers().then(setUsers).catch((err) => setError(err.message));
  }, []);
  useEffect(load, [load]);

  const run = async (action: () => Promise<unknown>, message: string) => {
    setError('');
    try {
      await action();
      showToast(message);
      load();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    setDeleteError('');
    try {
      await deleteUser(toDelete.id);
      showToast(t('admin.userDeleted', { email: toDelete.email }));
      setToDelete(null);
      load();
    } catch (err) {
      // 409 : le compte a des heures enregistrées, on le bloque plutôt
      setDeleteError(err instanceof ApiError && err.status === 409 && /hours/.test(err.message) ? t('admin.errHasHours') : (err as Error).message);
    }
  };

  return (
    <>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>{t('admin.usersIntro')}</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {!users && !error && <Typography color="text.secondary">{t('admin.loading')}</Typography>}
      <Stack spacing={1.5}>
        {users?.map((u) => (
          <Paper key={u.id} data-testid="user-row" variant="outlined" sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Box sx={{ flexGrow: 1, minWidth: 0, overflowWrap: 'anywhere' }}>
              <Typography sx={{ fontWeight: 700 }}>
                {u.email}{u.id === currentUserId && ` (${t('admin.you')})`}
              </Typography>
              <Stack direction="row" spacing={0.5} sx={{ mt: 0.5 }}>
                <Chip size="small" label={t(ROLE_LABEL[u.role])} color={u.role === 'user' ? 'default' : 'primary'} />
                {!u.is_active && <Chip size="small" color="error" label={t('admin.blocked')} />}
              </Stack>
            </Box>
            {/* Se retirer ses propres droits ou se bloquer ferait perdre l'accès à cette page */}
            {u.id !== currentUserId && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <FormControl size="small" sx={{ minWidth: 170 }}>
                  <InputLabel id={`role-${u.id}`}>{t('admin.role')}</InputLabel>
                  <Select
                    labelId={`role-${u.id}`}
                    label={t('admin.role')}
                    value={u.role}
                    onChange={(e) => run(() => setRole(u.id, e.target.value as Role), t('admin.roleChanged', { email: u.email }))}
                  >
                    {ROLES.map((r) => <MenuItem key={r} value={r}>{t(ROLE_LABEL[r])}</MenuItem>)}
                  </Select>
                </FormControl>
                <Button
                  size="small"
                  variant="outlined"
                  color={u.is_active ? 'warning' : 'primary'}
                  onClick={() => run(() => setActive(u.id, !u.is_active), t(u.is_active ? 'admin.userBlocked' : 'admin.userUnblocked', { email: u.email }))}
                >
                  {u.is_active ? t('admin.block') : t('admin.unblock')}
                </Button>
                <IconButton onClick={() => { setDeleteError(''); setToDelete(u); }} aria-label={`${t('admin.delete')} ${u.email}`} color="error">
                  <DeleteIcon />
                </IconButton>
              </Box>
            )}
          </Paper>
        ))}
      </Stack>

      <Dialog open={toDelete !== null} onClose={() => setToDelete(null)}>
        <DialogTitle>{t('admin.confirmTitle', { name: toDelete?.email })}</DialogTitle>
        <DialogContent>
          <DialogContentText>{t('admin.confirmUserText')}</DialogContentText>
          {deleteError && <Alert severity="error" sx={{ mt: 2 }}>{deleteError}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setToDelete(null)}>{t('admin.cancel')}</Button>
          <Button onClick={handleDelete} color="error" variant="contained">{t('admin.delete')}</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

function ProductsAdmin() {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const locale = i18n.language === 'fr' ? 'fr-FR' : 'en-GB';

  const [products, setProducts] = useState<ApiProduct[] | null>(null);
  const [loadError, setLoadError] = useState('');
  // Article en cours de modification : null = fenêtre fermée, 'new' = création
  const [editing, setEditing] = useState<ApiProduct | 'new' | null>(null);
  const [values, setValues] = useState<FormValues>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<ApiProduct | null>(null);
  const [deleteError, setDeleteError] = useState('');
  const [importing, setImporting] = useState(false);
  const [search, setSearch] = useState('');
  const query = fold(useDeferredValue(search).trim());
  const [rows, setRows] = useState(ROWS);

  // Recherche par nom, numéro (#12) ou famille
  const matching = useMemo(
    () => (products ?? []).filter((p) => !query || `#${p.id} ref. ${p.id} ${fold(p.name)} ${fold(p.family ?? '')}`.includes(query)),
    [products, query]
  );

  // Toujours la liste à jour (pas le cache HTTP de 60 s), sinon une modification semblerait perdue
  const load = useCallback(() => {
    listProducts(true)
      .then((list) => {
        setProducts([...list].sort((a, b) => a.id - b.id));
        setLoadError('');
      })
      .catch((err) => setLoadError(err.message));
  }, []);

  useEffect(load, [load]);

  const openForm = (p: ApiProduct | 'new') => {
    setEditing(p);
    setValues(p === 'new' ? EMPTY : toForm(p));
    setErrors({});
    setSaveError('');
  };

  const field = (name: keyof FormValues) => ({
    name,
    value: values[name] as string,
    onChange: (e: { target: { value: string } }) => setValues((v) => ({ ...v, [name]: e.target.value })),
    error: !!errors[name],
    helperText: errors[name] ? t(errors[name]!) : undefined,
    fullWidth: true,
  });

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length) return;
    setSaving(true);
    setSaveError('');
    try {
      if (editing === 'new') {
        await createProduct(toInput(values, null));
        showToast(t('admin.created'));
      } else if (editing) {
        await updateProduct(editing.id, toInput(values, editing.status));
        showToast(t('admin.updated'));
      }
      invalidateProducts();
      setEditing(null);
      load();
    } catch (err) {
      setSaveError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    setDeleteError('');
    try {
      await deleteProduct(toDelete.id);
      invalidateProducts();
      showToast(t('admin.deleted'));
      setToDelete(null);
      load();
    } catch (err) {
      setDeleteError((err as Error).message);
    }
  };

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', mb: 3 }}>
        <Typography variant="body2" color="text.secondary" sx={{ flex: '1 1 280px' }}>{t('admin.intro')}</Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button variant="outlined" startIcon={<DownloadIcon />} disabled={!products?.length} onClick={() => products && exportCatalogue(products)}>
            {t('admin.export')}
          </Button>
          <Button variant="outlined" startIcon={<UploadFileIcon />} onClick={() => setImporting(true)}>{t('admin.import')}</Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => openForm('new')}>{t('admin.new')}</Button>
        </Box>
      </Box>

      <CatalogueImport
        open={importing}
        onClose={() => setImporting(false)}
        onImported={(r) => {
          setImporting(false);
          invalidateProducts();
          showToast(t('admin.imported', { created: r.created, updated: r.updated }));
          load();
        }}
      />

      {loadError && <Alert severity="error" sx={{ mb: 2 }}>{loadError}</Alert>}
      {!products && !loadError && <Typography color="text.secondary">{t('admin.loading')}</Typography>}
      {products?.length === 0 && <Typography color="text.secondary">{t('admin.empty')}</Typography>}

      {!!products?.length && (
        <TextField
          type="search"
          size="small"
          fullWidth
          label={t('admin.search')}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setRows(ROWS); }}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> } }}
          helperText={t('catalogue.count', { count: matching.length })}
          sx={{ mb: 2 }}
        />
      )}

      <Stack spacing={1.5}>
        {matching.slice(0, rows).map((p) => (
          <Paper key={p.id} data-testid="admin-row" variant="outlined" sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography sx={{ fontWeight: 700 }}>{p.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {t('common.ref', { id: p.id })} · {t(`cat.${p.category}`)} · {p.price === null ? t('common.onQuote') : money(Math.round(p.price), locale)}
                {' · '}{t('admin.stock', { count: p.stock })}
              </Typography>
              {!p.available && <Chip size="small" label={t('admin.hidden')} sx={{ mt: 0.5 }} />}
            </Box>
            <IconButton onClick={() => openForm(p)} aria-label={`${t('admin.edit')} ${p.name}`}>
              <EditIcon />
            </IconButton>
            <IconButton onClick={() => { setDeleteError(''); setToDelete(p); }} aria-label={`${t('admin.delete')} ${p.name}`} color="error">
              <DeleteIcon />
            </IconButton>
          </Paper>
        ))}
      </Stack>
      {matching.length > rows && (
        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Button variant="outlined" onClick={() => setRows(rows + ROWS * 2)}>
            {t('catalogue.more', { count: matching.length - rows })}
          </Button>
        </Box>
      )}

      <Dialog open={editing !== null} onClose={() => !saving && setEditing(null)} fullScreen={fullScreen} fullWidth maxWidth="sm">
        <form onSubmit={handleSave} noValidate>
          <DialogTitle>{editing === 'new' ? t('admin.newTitle') : t('admin.editTitle')}</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <FormControl fullWidth>
                <InputLabel id="admin-category-label">{t('admin.fCategory')}</InputLabel>
                <Select
                  labelId="admin-category-label"
                  label={t('admin.fCategory')}
                  value={values.category}
                  onChange={(e) => setValues((v) => ({ ...v, category: e.target.value }))}
                >
                  {API_CATEGORIES.map((c) => <MenuItem key={c} value={c}>{t(`cat.${c}`)}</MenuItem>)}
                </Select>
              </FormControl>
              <TextField {...field('name')} label={t('admin.fName')} required />
              <TextField {...field('family')} label={t('admin.fFamily')} helperText={errors.family ? t(errors.family) : t('admin.fFamilyHelp')} />
              <TextField {...field('description')} label={t('admin.fDescription')} multiline minRows={2} />
              <TextField
                {...field('price')}
                label={t('admin.fPrice')}
                inputMode="numeric"
                helperText={errors.price ? t(errors.price) : t('admin.fPriceHelp')}
              />
              <TextField {...field('stock')} label={t('admin.fStock')} inputMode="numeric" />
              <TextField {...field('label')} label={t('admin.fLabel')} helperText={t('admin.fLabelHelp')} />
              <TextField {...field('name_en')} label={t('admin.fNameEn')} />
              <TextField {...field('description_en')} label={t('admin.fDescriptionEn')} multiline minRows={2} />
              <TextField {...field('label_en')} label={t('admin.fLabelEn')} />
              <TextField {...field('color')} label={t('admin.fColor')} helperText={errors.color ? t(errors.color) : t('admin.fColorHelp')} />
              <TextField {...field('image')} label={t('admin.fImage')} helperText={errors.image ? t(errors.image) : t('admin.fImageHelp')} />
              <FormControlLabel
                control={<Checkbox checked={values.available} onChange={(e) => setValues((v) => ({ ...v, available: e.target.checked }))} />}
                label={t('admin.fAvailable')}
              />
              {saveError && <Alert severity="error">{saveError}</Alert>}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditing(null)} disabled={saving}>{t('admin.cancel')}</Button>
            <Button type="submit" variant="contained" disabled={saving}>{saving ? t('admin.saving') : t('admin.save')}</Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog open={toDelete !== null} onClose={() => setToDelete(null)}>
        <DialogTitle>{t('admin.confirmTitle', { name: toDelete?.name })}</DialogTitle>
        <DialogContent>
          <DialogContentText>{t('admin.confirmText')}</DialogContentText>
          {deleteError && <Alert severity="error" sx={{ mt: 2 }}>{deleteError}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setToDelete(null)}>{t('admin.cancel')}</Button>
          <Button onClick={handleDelete} color="error" variant="contained">{t('admin.delete')}</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
