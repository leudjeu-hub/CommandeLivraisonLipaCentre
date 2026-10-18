import { useTranslation } from 'react-i18next';
import { Fab } from '@mui/material';
import PlaceIcon from '@mui/icons-material/Place';

export default function MapFab() {
  const { t } = useTranslation();

  return (
    <Fab
      variant="extended"
      color="secondary"
      href="https://www.google.com/maps/search/?api=1&query=Librairie+Papeterie+du+Centre+Yaoundé&query_place_id=ChIJi_YsDY3PixARKBsGbQXsDHM"
      target="_blank"
      rel="noopener"
      aria-label={t('map.label')}
      sx={{ position: 'fixed', bottom: 16, right: 16, zIndex: 1000 }}
    >
      <PlaceIcon sx={{ mr: 1 }} />
      {t('map.text')}
    </Fab>
  );
}
