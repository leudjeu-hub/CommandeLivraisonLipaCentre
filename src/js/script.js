/*
 * Logique de la page : langue, catalogue, panier, formulaire de commande / devis.
 * Le formulaire produit un récapitulatif que le client envoie lui-même
 * par WhatsApp, télécharge ou copie. Rien n’est transmis automatiquement.
 */
(function () {
  'use strict';

  const products = window.PRODUCTS || [];
  const categories = window.CATEGORIES || ['Tout'];
  const shop = window.SHOP || {};
  const delivery = window.DELIVERY || [];
  const rules = Object.assign({ freeFrom: 0, freeZones: [], minOrder: 0 }, window.DELIVERY_RULES || {});
  const OTHER_AREA = '__autre';
  const i18n = window.I18N;
  const STORAGE_KEY = 'centre-cart';
  const LANG_KEY = 'centre-lang';
  const MAX_QTY = 99;

  const el = (id) => document.getElementById(id);

  // Échappe le texte inséré via innerHTML (évite qu’un « < », « & » ou « " » casse la page)
  const escapeHtml = (value) =>
    String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

  // Recherche insensible à la casse et aux accents : « geometrie » trouve « Géométrie »
  const normalize = (value) =>
    String(value).normalize('NFD').replace(/[̀-ͯ]/g, '').toLocaleLowerCase('fr').trim();

  const findProduct = (id) => products.find((p) => p.id === Number(id));

  let lang = i18n.DEFAULT;
  let basket = loadBasket();
  let category = 'Tout';
  let quote = false;
  let summaryText = '';
  let toastTimer = null;

  /* ---------- Langue ---------- */

  // Texte de l’interface dans la langue courante ; {name} est remplacé par vars.name
  function t(key, vars) {
    const text = (i18n.UI[lang] && i18n.UI[lang][key]) ?? i18n.UI[i18n.DEFAULT][key] ?? key;
    return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
  }

  // Champ d’un produit dans la langue courante (repli sur le français)
  const pt = (p, field) => (lang !== i18n.DEFAULT && p[lang] && p[lang][field]) || p[field];

  const money = (n) => n.toLocaleString(i18n.LANGUAGES[lang].locale) + ' FCFA';

  // Mémorise le français écrit dans le HTML avant la première traduction
  const originals = new Map();
  function original(node, slot, current) {
    if (!originals.has(node)) originals.set(node, {});
    const store = originals.get(node);
    if (!(slot in store)) store[slot] = current;
    return store[slot];
  }

  function initialLanguage() {
    const fromUrl = new URLSearchParams(location.search).get('lang');
    if (fromUrl && i18n.LANGUAGES[fromUrl]) return fromUrl;
    try {
      const saved = localStorage.getItem(LANG_KEY);
      if (saved && i18n.LANGUAGES[saved]) return saved;
    } catch (e) {
      /* stockage indisponible */
    }
    return i18n.DEFAULT;
  }

  function applyLanguage(next) {
    lang = i18n.LANGUAGES[next] ? next : i18n.DEFAULT;
    const page = i18n.PAGE[lang] || {};

    document.documentElement.lang = lang;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.content = i18n.META[lang].description;

    document.querySelectorAll('[data-i18n]').forEach((node) => {
      const fr = original(node, 'html', node.innerHTML);
      // Contenu de confiance (fichier i18n.js), peut contenir <br>, <em>…
      node.innerHTML = lang === i18n.DEFAULT ? fr : page[node.dataset.i18n] ?? fr;
    });

    document.querySelectorAll('[data-i18n-attr]').forEach((node) => {
      node.dataset.i18nAttr.split(';').forEach((pair) => {
        const [attr, key] = pair.split(':').map((s) => s.trim());
        const fr = original(node, attr, node.getAttribute(attr));
        node.setAttribute(attr, lang === i18n.DEFAULT ? fr : page[key] ?? fr);
      });
    });

    // Le bouton propose l’autre langue, écrite dans cette langue
    const other = Object.keys(i18n.LANGUAGES).find((code) => code !== lang);
    const btn = el('langBtn');
    btn.textContent = i18n.LANGUAGES[other].label;
    btn.lang = other;
    btn.setAttribute('aria-label', i18n.LANGUAGES[other].switchLabel);
    btn.dataset.lang = other;

    try {
      localStorage.setItem(LANG_KEY, lang);
    } catch (e) {
      /* stockage indisponible */
    }

    renderFilters();
    renderProducts();
    renderZones();
    renderAreaOptions();
    updateFeeLine();
    if (el('cart').open) renderCart();
  }

  /* ---------- Panier (mémorisé dans le navigateur) ---------- */

  function loadBasket() {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      if (!stored || typeof stored !== 'object') return {};
      for (const key of Object.keys(stored)) {
        const p = findProduct(key);
        const qty = stored[key];
        if (!p || p.price === null || !Number.isInteger(qty) || qty < 1 || qty > MAX_QTY) delete stored[key];
      }
      return stored;
    } catch (e) {
      return {};
    }
  }

  function saveBasket() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(basket));
    } catch (e) {
      /* stockage indisponible : le panier reste en mémoire */
    }
    el('count').textContent = Object.values(basket).reduce((a, b) => a + b, 0);
  }

  function basketTotal() {
    return products.reduce((sum, p) => sum + (p.price || 0) * (basket[p.id] || 0), 0);
  }

  /* ---------- Livraison par quartier ---------- */

  const zt = (z, field) => (lang !== i18n.DEFAULT && z[lang] && z[lang][field]) || z[field];
  const zoneOfArea = (area) => delivery.find((z) => z.areas.includes(area));
  // Frais pour une zone : 0 si livraison offerte (commande, pas devis), sinon le tarif de la zone
  const feeFor = (z, subtotal) => window.fees.feeFor(z, subtotal, rules, quote);

  // « 1, 2 et 3 » / « 1, 2 and 3 »
  const listWords = (xs) => (xs.length < 2 ? xs.join('') : xs.slice(0, -1).join(', ') + ' ' + t('and') + ' ' + xs.at(-1));

  function rulesText() {
    const parts = [];
    if (rules.freeFrom > 0 && rules.freeZones.length) parts.push(t('freeRule', { from: money(rules.freeFrom), zones: listWords(rules.freeZones) }));
    if (rules.minOrder > 0) parts.push(t('minRule', { min: money(rules.minOrder) }));
    return parts.join(' ');
  }

  function renderZones() {
    el('zones').innerHTML = delivery
      .map((z) => `<div class="zone">
          <h4>${escapeHtml(t('zone'))} ${z.zone} — ${escapeHtml(zt(z, 'name'))}</h4>
          <p class="zone-fee">${money(z.fee)}</p>
          <p class="muted">${escapeHtml(zt(z, 'delay'))}</p>
          <p><strong>${escapeHtml(t('zoneAreas'))}</strong> ${z.areas.map(escapeHtml).join(', ')}</p>
        </div>`)
      .join('');
    el('deliveryRules').textContent = rulesText();
  }

  function renderAreaOptions() {
    const select = el('area');
    const current = select.value;
    select.innerHTML =
      `<option value="" disabled>${escapeHtml(t('chooseArea'))}</option>` +
      delivery
        .map((z) => `<optgroup label="${escapeHtml(`${t('zone')} ${z.zone} — ${zt(z, 'name')} · ${money(z.fee)}`)}">${z.areas
          .map((a) => `<option value="${escapeHtml(a)}">${escapeHtml(a)}</option>`).join('')}</optgroup>`)
        .join('') +
      `<optgroup label="${escapeHtml(t('otherGroup'))}"><option value="${OTHER_AREA}">${escapeHtml(t('otherArea'))}</option></optgroup>`;
    select.value = current || '';
    if (!select.value) select.selectedIndex = 0;
  }

  // Ligne d’information sous le quartier : frais, délai, total à payer
  function updateFeeLine() {
    const area = el('area').value;
    const other = area === OTHER_AREA;
    el('areaOtherWrap').classList.toggle('hidden', !other);
    el('areaOther').required = other;
    const line = el('feeLine');
    if (!area) { line.classList.add('hidden'); return; }
    const subtotal = basketTotal();
    let text;
    if (other) text = t('feeLineOther');
    else {
      const z = zoneOfArea(area);
      const fee = feeFor(z, subtotal);
      text = fee === 0
        ? t('feeLineFree', { zone: z.zone, from: money(rules.freeFrom), delay: zt(z, 'delay') })
        : t('feeLine', { zone: z.zone, name: zt(z, 'name'), fee: money(fee), delay: zt(z, 'delay') });
      if (!quote) text += '\n' + t('totalLine', { total: money(subtotal + fee) });
    }
    line.textContent = text;
    line.classList.remove('hidden');
  }

  /* ---------- Notifications ---------- */

  function toast(message) {
    const node = el('toast');
    node.textContent = message;
    node.classList.remove('hidden');
    // Un nouveau message relance le délai au lieu d’être masqué par l’ancien minuteur
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => node.classList.add('hidden'), 2500);
  }

  /* ---------- Catalogue ---------- */

  function renderProducts() {
    const q = normalize(el('search').value);
    const list = products.filter(
      (p) =>
        (category === 'Tout' || p.cat === category) &&
        normalize(pt(p, 'name') + ' ' + pt(p, 'desc') + ' ' + t('cat.' + p.cat)).includes(q)
    );

    if (!list.length) {
      el('products').innerHTML = `<p class="empty">${escapeHtml(t('noResults'))}</p>`;
      return;
    }

    el('products').innerHTML = list
      .map(
        (p) => `<article class="card">
          <div class="art${p.image ? ' has-photo' : ''}">${
            p.image
              ? `<img src="${escapeHtml(p.image)}" alt="${escapeHtml(pt(p, 'name'))}" width="480" height="480" loading="lazy" decoding="async">`
              : `<div class="object" data-color="${escapeHtml(p.color)}">${pt(p, 'label').split('\n').map(escapeHtml).join('<br>')}</div>`
          }</div>
          <small>${escapeHtml(t('cat.' + p.cat))}</small>
          <h3>${escapeHtml(pt(p, 'name'))}</h3>
          <p>${escapeHtml(pt(p, 'desc'))}</p>
          <div class="buy">
            <strong>${p.price === null ? escapeHtml(t('onQuote')) : money(p.price)}</strong>
            <button type="button" data-add="${p.id}">${escapeHtml(p.price === null ? t('request') : t('add'))}</button>
          </div>
        </article>`
      )
      .join('');

    // Couleur appliquée via le DOM (compatible avec la Content Security Policy)
    el('products').querySelectorAll('[data-color]').forEach((node) => {
      node.style.background = node.dataset.color;
    });
  }

  function renderFilters() {
    el('filters').innerHTML = categories
      .map(
        (c) =>
          `<button type="button" class="chip${c === category ? ' active' : ''}" data-cat="${escapeHtml(c)}" aria-pressed="${c === category}">${escapeHtml(t('cat.' + c))}</button>`
      )
      .join('');
  }

  /* ---------- Menu mobile ---------- */

  function setMenu(open) {
    el('navLinks').classList.toggle('open', open);
    el('menuBtn').setAttribute('aria-expanded', String(open));
  }

  function bindMenu() {
    el('menuBtn').addEventListener('click', () => setMenu(!el('navLinks').classList.contains('open')));
    // Ferme le menu après le choix d’une section
    el('navLinks').addEventListener('click', (e) => {
      if (e.target.closest('a')) setMenu(false);
    });
    // Ferme le menu au clic en dehors ou avec Échap
    document.addEventListener('click', (e) => {
      if (!e.target.closest('nav')) setMenu(false);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && el('navLinks').classList.contains('open')) {
        setMenu(false);
        el('menuBtn').focus();
      }
    });
  }

  /* ---------- Fenêtre panier ---------- */

  function renderCart() {
    const items = products.filter((p) => basket[p.id]);
    el('cartRows').innerHTML = items.length
      ? items
          .map((p) => {
            const name = escapeHtml(pt(p, 'name'));
            return `<div class="row">
              <div><strong>${name}</strong><p class="muted">${money(p.price)}</p></div>
              <div>
                <input aria-label="${escapeHtml(t('quantity', { name: pt(p, 'name') }))}" type="number" min="1" max="${MAX_QTY}" value="${basket[p.id]}" data-qty="${p.id}">
                <button type="button" aria-label="${escapeHtml(t('remove', { name: pt(p, 'name') }))}" data-remove="${p.id}">×</button>
              </div>
            </div>`;
          })
          .join('')
      : `<p>${escapeHtml(t('cartEmpty'))}</p>`;
    const subtotal = basketTotal();
    el('subtotal').textContent = money(subtotal);
    if (delivery.length) {
      const fees = delivery.map((z) => z.fee);
      el('cartFees').textContent = t('cartFees', { min: money(Math.min(...fees)), max: money(Math.max(...fees)) }) + ' ' + rulesText();
    }
    const missing = items.length ? rules.minOrder - subtotal : 0;
    el('minOrderMsg').textContent = missing > 0 ? t('minOrder', { missing: money(missing), min: money(rules.minOrder) }) : '';
    el('minOrderMsg').classList.toggle('hidden', !(missing > 0));
    el('checkoutBtn').disabled = !items.length || missing > 0;
  }

  /* ---------- Formulaire commande / devis ---------- */

  function openForm(isQuote) {
    quote = isQuote;
    el('cart').close();
    el('orderForm').classList.remove('hidden');
    el('result').classList.add('hidden');
    el('afterSend').classList.add('hidden');
    el('formTitle').textContent = quote ? t('formQuote') : t('formOrder');
    updateFeeLine();
    el('checkout').showModal();
  }

  // Récapitulatif dans la langue du client ; en anglais, une ligne le signale à la librairie
  function buildSummary() {
    const lines = [
      'LIBRAIRIE PAPETERIE DU CENTRE',
      (quote ? t('sum.quote') : t('sum.order')) + t('sum.pending'),
      t('sum.date') + new Date().toLocaleDateString(i18n.LANGUAGES[lang].locale),
      '',
      t('sum.name') + el('name').value,
      t('sum.phone') + el('phone').value,
      t('sum.area') + (el('area').value === OTHER_AREA ? el('areaOther').value : el('area').value),
      t('sum.address') + el('address').value,
      t('sum.slot') + el('slot').value,
      t('sum.payment') + el('payment').value,
      ''
    ];
    const area = el('area').value;
    const z = area === OTHER_AREA ? null : zoneOfArea(area);
    const subtotal = basketTotal();
    if (!quote) {
      products
        .filter((p) => basket[p.id])
        .forEach((p) => lines.push(basket[p.id] + ' × ' + pt(p, 'name') + ' : ' + money(p.price * basket[p.id])));
      lines.push(t('sum.total') + money(subtotal));
    }
    if (z) {
      const fee = feeFor(z, subtotal);
      lines.push(t('sum.delivery', { zone: z.zone, name: zt(z, 'name') }) + (fee === 0 ? t('free') : money(fee)));
      if (!quote) lines.push(t('sum.toPay') + money(subtotal + fee));
    } else {
      lines.push(t('sum.deliveryOther'));
    }
    lines.push(t('sum.confirm'), '', t('sum.notes') + el('notes').value, '', t('sum.disclaimer'));
    if (t('sum.language')) lines.push(t('sum.language'));
    return lines.join('\n');
  }

  function download() {
    const url = URL.createObjectURL(new Blob([summaryText], { type: 'text/plain;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'demande-librairie-centre.txt';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(summaryText);
      toast(t('toastCopied'));
    } catch (e) {
      toast(t('toastCopyFailed'));
    }
  }

  /* ---------- Événements ---------- */

  function bindEvents() {
    el('langBtn').addEventListener('click', () => {
      applyLanguage(el('langBtn').dataset.lang);
      setMenu(false);
    });

    el('filters').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-cat]');
      if (!btn) return;
      category = btn.dataset.cat;
      document.querySelectorAll('.chip').forEach((x) => {
        x.classList.toggle('active', x === btn);
        x.setAttribute('aria-pressed', String(x === btn));
      });
      renderProducts();
    });

    el('search').addEventListener('input', renderProducts);
    el('area').addEventListener('change', updateFeeLine);

    el('products').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-add]');
      if (!btn) return;
      const p = findProduct(btn.dataset.add);
      if (!p) return;
      if (p.price === null) {
        openForm(true);
        el('notes').value = t('quoteNote', { name: pt(p, 'name') });
        return;
      }
      basket[p.id] = Math.min(MAX_QTY, (basket[p.id] || 0) + 1);
      saveBasket();
      toast(t('toastAdded'));
    });

    el('cartBtn').addEventListener('click', () => {
      renderCart();
      el('cart').showModal();
    });

    el('cartRows').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-remove]');
      if (!btn) return;
      delete basket[btn.dataset.remove];
      saveBasket();
      renderCart();
    });

    el('cartRows').addEventListener('change', (e) => {
      const id = e.target.dataset.qty;
      if (!id) return;
      basket[id] = Math.min(MAX_QTY, Math.max(1, parseInt(e.target.value, 10) || 1));
      saveBasket();
      renderCart();
    });

    document.querySelectorAll('.close').forEach((b) =>
      b.addEventListener('click', () => b.closest('dialog').close())
    );

    // Un clic sur le fond assombri ferme la fenêtre (comportement attendu sur mobile)
    document.querySelectorAll('dialog').forEach((d) =>
      d.addEventListener('click', (e) => {
        if (e.target !== d) return;
        // e.target vaut aussi le <dialog> dans sa marge intérieure : on vérifie la position du clic
        const r = d.getBoundingClientRect();
        const outside = e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
        if (outside) d.close();
      })
    );

    el('checkoutBtn').addEventListener('click', () => openForm(false));
    el('listBtn').addEventListener('click', () => openForm(true));
    el('termsBtn').addEventListener('click', () => el('terms').showModal());
    el('clear').addEventListener('click', () => {
      basket = {};
      saveBasket();
      toast(t('toastCleared'));
    });

    el('orderForm').addEventListener('submit', (e) => {
      e.preventDefault();
      summaryText = buildSummary();
      el('summary').textContent = summaryText;
      el('whatsapp').href = 'https://wa.me/' + shop.whatsapp + '?text=' + encodeURIComponent(summaryText);
      el('orderForm').classList.add('hidden');
      el('result').classList.remove('hidden');
    });

    // Après l’envoi WhatsApp, proposer de vider le panier (jamais automatiquement :
    // le client peut encore annuler l’envoi dans WhatsApp)
    el('whatsapp').addEventListener('click', () => {
      if (!quote && Object.keys(basket).length) el('afterSend').classList.remove('hidden');
    });
    el('clearAfterSend').addEventListener('click', () => {
      basket = {};
      saveBasket();
      el('afterSend').classList.add('hidden');
      el('checkout').close();
      toast(t('toastThanks'));
    });
    el('keepCart').addEventListener('click', () => el('afterSend').classList.add('hidden'));

    el('download').addEventListener('click', download);
    el('copy').addEventListener('click', copy);
  }

  /* ---------- Démarrage ---------- */

  bindMenu();
  bindEvents();
  saveBasket();
  applyLanguage(initialLanguage()); // affiche aussi filtres et catalogue
})();
