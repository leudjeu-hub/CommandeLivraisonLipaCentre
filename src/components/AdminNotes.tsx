import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Box, Button, TextField, Typography } from '@mui/material';
import { showToast } from './Toast';

// Remarque interne de la boutique sur un compte ou une commande (Gestion) : jamais montrée au
// client. L'API la renvoie seulement aux responsables et administrateurs (admin_notes).

export const ADMIN_NOTES_MAX = 2000;

interface Props {
  value: string | null | undefined;
  // Enregistre le texte (vide = effacer) ; rejette en cas d'erreur, le champ reste ouvert
  onSave: (text: string) => Promise<unknown>;
}

export default function AdminNotes({ value, onSave }: Props) {
  const { t } = useTranslation();
  const id = useId();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const start = () => {
    setDraft(value ?? '');
    setError('');
    setEditing(true);
  };

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      await onSave(draft.trim());
      setEditing(false);
      showToast(t(draft.trim() ? 'adminNotes.saved' : 'adminNotes.cleared'));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <Box sx={{ mt: 1.5 }} data-testid="admin-notes-edit">
        <TextField
          id={id}
          label={t('adminNotes.label')}
          multiline
          minRows={2}
          fullWidth
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          slotProps={{ htmlInput: { maxLength: ADMIN_NOTES_MAX } }}
          helperText={t('adminNotes.help')}
        />
        {error && <Alert severity="error" sx={{ mt: 1 }}>{error}</Alert>}
        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
          <Button size="small" variant="contained" onClick={save} disabled={saving}>{t('adminNotes.save')}</Button>
          <Button size="small" onClick={() => setEditing(false)} disabled={saving}>{t('admin.cancel')}</Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 1 }} data-testid="admin-notes">
      {value && (
        <Typography
          variant="body2"
          sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', bgcolor: 'action.hover', borderRadius: 1, px: 1.5, py: 1, mb: 0.5 }}
        >
          <strong>{t('adminNotes.title')}</strong> {value}
        </Typography>
      )}
      <Button size="small" onClick={start}>{t(value ? 'adminNotes.edit' : 'adminNotes.add')}</Button>
    </Box>
  );
}
