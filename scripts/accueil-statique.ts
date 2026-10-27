// Contenu de l'accueil en HTML statique, écrit dans dist/index.html à la place de l'écran de
// démarrage (voir vite.config.ts). Les robots qui n'exécutent pas JavaScript (Bing, assistants IA,
// aperçus WhatsApp/Facebook) et les téléphones en 3G voient ainsi le vrai texte de la page tout de
// suite ; React le remplace au premier rendu. Mêmes textes (fr.json) et mêmes calculs que
// src/pages/HomePage.tsx : un test vérifie que les deux versions disent la même chose.
import { DELIVERY, DELIVERY_RULES, money, whatsappLink } from '../src/data/catalogue';

type Strings = Record<string, Record<string, string>>;

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function homeShell(fr: Strings, base: string): string {
  const t = (key: string, values: Record<string, string> = {}) => {
    const [ns, k] = key.split('.');
    return esc(fr[ns][k].replace(/\{\{(\w+)\}\}/g, (_, name) => values[name] ?? ''));
  };
  // Mêmes calculs que HomePage.tsx (zones, délais, frais tirés de la grille de livraison)
  const list = (items: string[]) => (items.length > 1 ? `${items.slice(0, -1).join(', ')} ${fr.common.and} ${items[items.length - 1]}` : items[0] ?? '');
  const sameDay = DELIVERY.filter((z) => z.en.delay === 'Same day');
  const freeZones = list(DELIVERY.filter((z) => DELIVERY_RULES.freeZones.includes(z.zone)).map((z) => z.name));
  const first = DELIVERY[0];
  const last = DELIVERY[DELIVERY.length - 1];
  const delays = [...new Set(DELIVERY.map((z) => z.delay))]
    .map((d, i) => `${i ? d.charAt(0).toLowerCase() + d.slice(1) : d} (${DELIVERY.filter((z) => z.delay === d).map((z) => z.name).join(', ')})`)
    .join(', ');
  const faqValues = (n: number) => ({
    min: money(n === 7 ? DELIVERY_RULES.minOrder : first.fee),
    max: money(last.fee),
    firstZone: first.name,
    firstAreas: first.areas.slice(0, 3).join(', '),
    lastZone: last.name,
    lastAreas: last.areas.slice(0, 3).join(', '),
    from: money(DELIVERY_RULES.freeFrom),
    freeZones,
    delays,
  });
  const trust = [
    [t('trust.sameDayTitle'), t('trust.sameDayText', { zones: list(sameDay.map((z) => z.name)), areas: sameDay.flatMap((z) => z.areas).slice(3, 6).join(', '), fee: money(Math.min(...DELIVERY.map((z) => z.fee))) })],
    [t('trust.freeTitle'), t('trust.freeText', { from: money(DELIVERY_RULES.freeFrom), zones: freeZones })],
    [t('trust.payTitle'), t('trust.payText')],
  ];
  const item = (title: string, text: string) => `<li><h3>${title}</h3><p>${text}</p></li>`;
  const link = (href: string, text: string, cls = '') => `<a${cls ? ` class="${cls}"` : ''} href="${esc(href)}">${text}</a>`;

  return `<div class="shell">
        <div class="shell-bar"><img src="${base}img/logo-clair.svg" alt="Librairie Papeterie du Centre" width="138" height="38" /></div>
        <main class="shell-main shell-home">
          <p class="shell-eyebrow">${t('hero.eyebrow')}</p>
          <h1>${t('hero.title')}</h1>
          <p>${t('hero.intro')}</p>
          <p class="shell-actions">${link(whatsappLink(fr.catalogue.unavailableWhatsapp), 'Commander par WhatsApp', 'shell-btn')} ${link(`${base}catalogue`, t('hero.cta'), 'shell-btn shell-btn-alt')}</p>
          <p class="shell-wait">Chargement du site… Si rien ne s’affiche, commandez directement par WhatsApp ou au <a href="tel:+237693240396">+237 6 93 24 03 96</a>.</p>
          <section><h2>${t('trust.title')}</h2><ul>${trust.map(([a, b]) => item(a, b)).join('')}</ul><p>${link(`${base}livraison`, t('trust.link'))}</p></section>
          <section><h2>${t('home.catsTitle')}</h2><ul>${['Scolaire', 'Bureau', 'Livres'].map((c) => `<li><h3>${link(`${base}catalogue?cat=${c}`, t(`home.cat${c}Title`))}</h3><p>${t(`home.cat${c}`)}</p></li>`).join('')}</ul></section>
          <section><h2>${t('strip.title')}</h2><ol>${[1, 2, 3].map((n) => item(t(`strip.step${n}Title`), t(`strip.step${n}Text`))).join('')}</ol></section>
          <section><h2>${t('quote.title')}</h2><ul>${item(t('quote.parentsTitle'), t('quote.parentsText'))}${item(t('quote.proTitle'), t('quote.proText'))}</ul><p>${link(`${base}commander?type=quote`, t('quote.cta'))} · ${link(whatsappLink(fr.form.quoteWhatsappText), t('quote.photoCta'))}</p></section>
          <section><h2>${t('faq.title')}</h2>${[1, 2, 3, 4, 5, 6, 7].map((n) => `<h3>${t(`faq.q${n}`)}</h3><p>${t(`faq.a${n}`, faqValues(n))}</p>${n === 1 ? `<p>${link(`${base}livraison`, t('faq.a1Link'))}</p>` : ''}`).join('')}</section>
          <p class="shell-info">${t('footer.services')}<br />Librairie Papeterie du Centre · ${t('footer.address')}<br />Lundi – vendredi 8 h – 18 h · samedi 9 h – 15 h · <a href="tel:+237693240396">+237 6 93 24 03 96</a></p>
        </main>
      </div>`;
}
