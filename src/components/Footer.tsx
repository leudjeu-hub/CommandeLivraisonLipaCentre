import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Box, Button, Container, Dialog, DialogActions, DialogContent, DialogTitle, Link as MuiLink, Typography } from '@mui/material';
import PlaceIcon from '@mui/icons-material/Place';
import PhoneIcon from '@mui/icons-material/Phone';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { whatsappLink } from '../data/catalogue';
import { FOCUS_ON_DARK } from '../theme';
import { useAuth } from '../context/AuthContext';

const MAP_URL =
  'https://www.google.com/maps/search/?api=1&query=Librairie+Papeterie+du+Centre+Yaoundé&query_place_id=ChIJi_YsDY3PixARKBsGbQXsDHM';

// Pied de page : coordonnées, horaires et accès à la carte, toujours faciles à trouver
// (remplace l'ancien bouton flottant « Nous trouver », qui masquait le contenu sur mobile).
export default function Footer() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [termsOpen, setTermsOpen] = useState(false);
  const linkSx = { display: 'inline-flex', alignItems: 'center', gap: 1, minHeight: 44, color: 'inherit', fontWeight: 600 };

  return (
    <Box component="footer" sx={{ bgcolor: 'primary.main', color: 'rgba(255,255,255,0.92)', mt: 8, '--focus-ring': FOCUS_ON_DARK }}>
      <Container maxWidth="lg" sx={{ py: { xs: 5, md: 6 } }}>
        <Box sx={{ display: 'grid', gap: { xs: 4, md: 6 }, gridTemplateColumns: { xs: '1fr', md: '1.4fr 1fr 1fr' } }}>
          <Box>
            <img src={`${import.meta.env.BASE_URL}img/logo-clair.svg`} alt={t('brand.name')} width={150} height={41} />
            <Typography variant="body2" sx={{ mt: 1.5, maxWidth: 340, opacity: 0.85 }}>{t('footer.services')}</Typography>
            {/* Les deux pages utiles avant de commander, aussi sur mobile où le menu est replié */}
            <MuiLink component={RouterLink} to="/catalogue" sx={{ ...linkSx, mt: 1 }}>{t('footer.catalogue')}</MuiLink>
            <br />
            <MuiLink component={RouterLink} to="/livraison" sx={linkSx}>{t('footer.delivery')}</MuiLink>
          </Box>
          <Box>
            <Typography variant="overline" component="h2" sx={{ color: 'secondary.light' }}>{t('footer.contact')}</Typography>
            <Typography variant="body2" sx={{ mb: 0.5 }}>{t('footer.address')}</Typography>
            <MuiLink href={MAP_URL} target="_blank" rel="noopener" aria-label={t('map.label')} sx={linkSx}>
              <PlaceIcon fontSize="small" aria-hidden /> {t('map.text')}
            </MuiLink>
            <br />
            <MuiLink href="tel:+237693240396" sx={linkSx}>
              <PhoneIcon fontSize="small" aria-hidden /> +237 6 93 24 03 96
            </MuiLink>
            <br />
            <MuiLink href={whatsappLink()} target="_blank" rel="noopener" sx={linkSx}>
              <WhatsAppIcon fontSize="small" aria-hidden /> {t('footer.whatsapp')}
            </MuiLink>
          </Box>
          <Box>
            <Typography variant="overline" component="h2" sx={{ color: 'secondary.light' }}>{t('footer.hours')}</Typography>
            <Box component="dl" sx={{ m: 0, display: 'grid', gridTemplateColumns: 'auto auto', columnGap: 2, rowGap: 0.5, fontSize: '0.9375rem', '& dd': { m: 0, fontVariantNumeric: 'tabular-nums' } }}>
              <dt>{t('footer.weekdays')}</dt><dd>08:00 – 18:00</dd>
              <dt>{t('footer.saturday')}</dt><dd>09:00 – 15:00</dd>
              <dt>{t('footer.sunday')}</dt><dd>{t('footer.closed')}</dd>
            </Box>
          </Box>
        </Box>
        <Box sx={{ mt: 5, pt: 2, borderTop: '1px solid rgba(255,255,255,0.15)', display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" sx={{ opacity: 0.75 }}>{t('footer.rights', { year: new Date().getFullYear() })}</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', columnGap: 3 }}>
            <MuiLink component="button" type="button" onClick={() => setTermsOpen(true)} sx={{ ...linkSx, font: 'inherit', fontSize: '0.9375rem' }}>
              {t('footer.terms')}
            </MuiLink>
            <MuiLink component={RouterLink} to="/confidentialite" sx={{ ...linkSx, fontSize: '0.9375rem' }}>
              {t('footer.privacy')}
            </MuiLink>
            {/* Connexion (personnel, clients avec compte), ou le compte une fois connecté : toujours une entrée */}
            <MuiLink component={RouterLink} to={user ? '/compte' : '/connexion'} sx={{ ...linkSx, fontSize: '0.9375rem' }}>
              {t(user ? 'nav.myAccount' : 'nav.login')}
            </MuiLink>
          </Box>
        </Box>
      </Container>

      <Dialog open={termsOpen} onClose={() => setTermsOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('terms.title')}</DialogTitle>
        <DialogContent>
          {/* Les données personnelles ont leur page (/confidentialite) */}
          {['p1', 'p3'].map((k) => (
            <Typography key={k} variant="body2" sx={{ mb: 1.5 }}>{t(`terms.${k}`)}</Typography>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTermsOpen(false)}>{t('common.close')}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
