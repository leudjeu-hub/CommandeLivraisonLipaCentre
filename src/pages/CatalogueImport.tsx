import { useRef, useState, type ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Stack, Typography,
} from '@mui/material';
import { importProducts, type ApiProduct, type ImportProblem, type ImportReport } from '../data/productsApi';

// Import et export du catalogue en CSV (Gestion > Articles). L'API lit le fichier et le vérifie
// (POST /products/import) : d'abord un aperçu, puis l'import si aucune ligne n'est en erreur.

const COLUMNS = [
  'id', 'categorie', 'prix', 'nom', 'description', 'vignette', 'nom_en', 'description_en', 'vignette_en',
  'couleur', 'disponible', 'image', 'stock',
] as const;

const EXAMPLE: Record<(typeof COLUMNS)[number], string> = {
  id: '', categorie: 'Scolaire', prix: '1500', nom: 'Cahier A5 · 96 pages (exemple)', description: 'Grands carreaux.',
  vignette: 'CAHIER / A5', nom_en: '', description_en: '', vignette_en: '', couleur: '', disponible: 'oui', image: '',
  stock: '20',
};

const MAX_SHOWN = 30;

const toRow = (p: ApiProduct): Record<(typeof COLUMNS)[number], string> => ({
  id: String(p.id), categorie: p.category, prix: p.price === null ? '' : String(Math.round(p.price)), nom: p.name,
  description: p.description, vignette: p.label ?? '', nom_en: p.name_en ?? '', description_en: p.description_en ?? '',
  vignette_en: p.label_en ?? '', couleur: p.color ?? '', disponible: p.available ? 'oui' : 'non', image: p.image ?? '',
  stock: String(p.stock),
});

// Point-virgule et BOM UTF-8 : Excel en français ouvre le fichier directement, accents compris
function download(name: string, rows: Record<string, string>[]) {
  const quote = (v: string) => (/[";\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const lines = [COLUMNS.join(';'), ...rows.map((r) => COLUMNS.map((c) => quote(r[c] ?? '')).join(';'))];
  const url = URL.createObjectURL(new Blob(['\ufeff' + lines.join('\r\n') + '\r\n'], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export const exportCatalogue = (products: ApiProduct[]) =>
  download(`catalogue-${new Date().toISOString().slice(0, 10)}.csv`, products.map(toRow));

// Excel enregistre souvent « CSV (point-virgule) » en Windows-1252 et non en UTF-8
async function readText(file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return new TextDecoder('windows-1252').decode(bytes);
  }
}

export default function CatalogueImport({ open, onClose, onImported }: {
  open: boolean;
  onClose: () => void;
  onImported: (report: ImportReport) => void;
}) {
  const { t } = useTranslation();
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<{ name: string; content: string } | null>(null);
  const [report, setReport] = useState<ImportReport | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setFile(null);
    setReport(null);
    setError('');
    if (input.current) input.current.value = '';
  };

  const close = () => {
    if (busy) return;
    reset();
    onClose();
  };

  const send = async (content: string, dryRun: boolean) => {
    setBusy(true);
    setError('');
    try {
      const result = await importProducts(content, dryRun);
      setReport(result);
      if (result.applied) {
        reset();
        onImported(result);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const choose = async (e: ChangeEvent<HTMLInputElement>) => {
    const chosen = e.target.files?.[0];
    if (!chosen) return;
    setReport(null);
    if (chosen.size > 1_000_000) {
      setFile(null);
      setError(t('admin.importTooBig'));
      return;
    }
    const content = await readText(chosen);
    setFile({ name: chosen.name, content });
    send(content, true);
  };

  const problem = (p: ImportProblem) =>
    t(`admin.importErr.${p.code}`, {
      line: p.line, column: p.column ?? '', value: p.value ?? '', defaultValue: t('admin.importErr.other', { line: p.line, code: p.code }),
    });

  const changes = report ? report.created + report.updated : 0;

  return (
    <Dialog open={open} onClose={close} fullWidth maxWidth="sm">
      <DialogTitle>{t('admin.importTitle')}</DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <DialogContentText component="div">
            <Typography variant="body2" sx={{ mb: 1 }}>{t('admin.importHelp')}</Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>{t('admin.importColumns')}</Typography>
            <Typography variant="body2">{t('admin.importRules')}</Typography>
          </DialogContentText>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button variant="text" onClick={() => download('modele-catalogue.csv', [EXAMPLE])}>{t('admin.importTemplate')}</Button>
            <Button variant="outlined" component="label" disabled={busy}>
              {t('admin.importChoose')}
              <input ref={input} type="file" accept=".csv,text/csv" hidden onChange={choose} data-testid="import-file" />
            </Button>
          </Box>
          {file && <Typography variant="body2" sx={{ overflowWrap: 'anywhere' }}>{t('admin.importFile', { name: file.name })}</Typography>}
          {busy && <Typography color="text.secondary">{t('admin.importChecking')}</Typography>}
          {error && <Alert severity="error">{error}</Alert>}
          {report && report.errors.length > 0 && (
            <Alert severity="error" data-testid="import-errors">
              <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>{t('admin.importHasErrors', { count: report.errors.length })}</Typography>
              <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
                {report.errors.slice(0, MAX_SHOWN).map((p, i) => <li key={i}>{problem(p)}</li>)}
              </Box>
              {report.errors.length > MAX_SHOWN && (
                <Typography variant="body2" sx={{ mt: 1 }}>{t('admin.importMore', { count: report.errors.length - MAX_SHOWN })}</Typography>
              )}
            </Alert>
          )}
          {report && report.errors.length === 0 && !report.applied && (
            <Alert severity={changes ? 'info' : 'success'} data-testid="import-preview">
              {t('admin.importPreview', { created: report.created, updated: report.updated, unchanged: report.unchanged })}
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={close} disabled={busy}>{t('admin.cancel')}</Button>
        <Button
          variant="contained"
          disabled={busy || !file || !report || report.errors.length > 0 || changes === 0}
          onClick={() => file && send(file.content, false)}
        >
          {t('admin.importApply')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
