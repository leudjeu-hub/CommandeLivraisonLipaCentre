import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Snackbar, Alert, Button, useMediaQuery, useTheme } from '@mui/material';

// Lien facultatif dans le message (« Voir le panier » après un ajout)
export interface ToastAction {
  label: string;
  to: string;
}

let showToastFn: ((msg: string, action?: ToastAction) => void) | null = null;

export function showToast(message: string, action?: ToastAction) {
  showToastFn?.(message, action);
}

export default function Toast() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [action, setAction] = useState<ToastAction | undefined>();
  // Sur mobile, en haut sous la barre : en bas, le message cachait le bouton « Ajouter » de la rangée suivante
  const isMobile = useMediaQuery(useTheme().breakpoints.down('sm'));

  useEffect(() => {
    showToastFn = (msg: string, next?: ToastAction) => {
      setMessage(msg);
      setAction(next);
      setOpen(true);
    };
    return () => { showToastFn = null; };
  }, []);

  return (
    <Snackbar
      open={open}
      // Avec un lien : plus de temps pour le lire et l'atteindre (la minuterie s'arrête au survol et au focus)
      autoHideDuration={action ? 6000 : 2500}
      onClose={(_, reason) => reason !== 'clickaway' && setOpen(false)}
      anchorOrigin={{ vertical: isMobile ? 'top' : 'bottom', horizontal: 'center' }}
      sx={isMobile ? { top: '64px !important' } : undefined}
    >
      <Alert
        onClose={() => setOpen(false)}
        severity="success"
        variant="filled"
        action={action && (
          <Button color="inherit" size="small" component={Link} to={action.to} onClick={() => setOpen(false)} sx={{ fontWeight: 700, textDecoration: 'underline' }}>
            {action.label}
          </Button>
        )}
      >
        {message}
      </Alert>
    </Snackbar>
  );
}
