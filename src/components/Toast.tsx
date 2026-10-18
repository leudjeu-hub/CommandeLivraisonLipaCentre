import { useEffect, useState } from 'react';
import { Snackbar, Alert } from '@mui/material';

let showToastFn: ((msg: string) => void) | null = null;

export function showToast(message: string) {
  showToastFn?.(message);
}

export default function Toast() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    showToastFn = (msg: string) => {
      setMessage(msg);
      setOpen(true);
    };
    return () => { showToastFn = null; };
  }, []);

  return (
    <Snackbar
      open={open}
      autoHideDuration={2500}
      onClose={() => setOpen(false)}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert onClose={() => setOpen(false)} severity="success" variant="filled">
        {message}
      </Alert>
    </Snackbar>
  );
}
