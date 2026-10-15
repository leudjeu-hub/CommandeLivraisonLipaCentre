/*
 * Logique de la page : catalogue, panier, formulaire de commande / devis.
 * Aucune donnée n’est envoyée : le formulaire produit un récapitulatif
 * à télécharger ou à copier.
 */
(function () {
  'use strict';

  const products = window.PRODUCTS || [];
  const categories = window.CATEGORIES || ['Tout'];
  const STORAGE_KEY = 'centre-cart';
  const MAX_QTY = 99;

  const el = (id) => document.getElementById(id);
  const money = (n) => n.toLocaleString('fr-FR') + ' FCFA';
  const findProduct = (id) => products.find((p) => p.id === Number(id));

  let basket = loadBasket();
  let category = 'Tout';
  let quote = false;
  let summaryText = '';

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

  /* ---------- Notifications ---------- */

  function toast(message) {
    const t = el('toast');
    t.textContent = message;
    t.classList.remove('hidden');
    setTimeout(() => t.classList.add('hidden'), 2500);
  }

  /* ---------- Catalogue ---------- */

  function renderProducts() {
    const q = el('search').value.toLocaleLowerCase('fr');
    const list = products.filter(
      (p) =>
        (category === 'Tout' || p.cat === category) &&
        (p.name + ' ' + p.desc).toLocaleLowerCase('fr').includes(q)
    );

    if (!list.length) {
      el('products').innerHTML = '<p class="empty">Aucun article trouvé. Essayez un autre mot.</p>';
      return;
    }

    el('products').innerHTML = list
      .map(
        (p) => `<article class="card">
          <div class="art"><div class="object" data-color="${p.color}">${p.label.split('\n').join('<br>')}</div></div>
          <small>${p.cat}</small>
          <h3>${p.name}</h3>
          <p>${p.desc}</p>
          <div class="buy">
            <strong>${p.price === null ? 'Sur devis' : money(p.price)}</strong>
            <button type="button" data-add="${p.id}">${p.price === null ? 'Demander' : 'Ajouter +'}</button>
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
      .map((c) => `<button type="button" class="chip${c === 'Tout' ? ' active' : ''}" data-cat="${c}">${c}</button>`)
      .join('');
  }

  /* ---------- Fenêtre panier ---------- */

  function renderCart() {
    const items = products.filter((p) => basket[p.id]);
    el('cartRows').innerHTML = items.length
      ? items
          .map(
            (p) => `<div class="row">
              <div><strong>${p.name}</strong><p class="muted">${money(p.price)}</p></div>
              <div>
                <input aria-label="Quantité : ${p.name}" type="number" min="1" max="${MAX_QTY}" value="${basket[p.id]}" data-qty="${p.id}">
                <button type="button" aria-label="Retirer ${p.name}" data-remove="${p.id}">×</button>
              </div>
            </div>`
          )
          .join('')
      : '<p>Votre panier est vide. Découvrez notre sélection.</p>';
    el('subtotal').textContent = money(basketTotal());
    el('checkoutBtn').disabled = !items.length;
  }

  /* ---------- Formulaire commande / devis ---------- */

  function openForm(isQuote) {
    quote = isQuote;
    el('cart').close();
    el('orderForm').classList.remove('hidden');
    el('result').classList.add('hidden');
    el('formTitle').textContent = quote ? 'Votre demande de devis' : 'Livraison à Yaoundé';
    el('checkout').showModal();
  }

  function buildSummary() {
    const lines = [
      'LIBRAIRIE PAPETERIE DU CENTRE',
      (quote ? 'DEMANDE DE DEVIS' : 'BROUILLON DE COMMANDE') + ' — NON ENVOYÉ',
      'Date : ' + new Date().toLocaleDateString('fr-FR'),
      '',
      'Destinataire : ' + el('name').value,
      'Téléphone : ' + el('phone').value,
      'Quartier : ' + el('area').value,
      'Adresse / repère : ' + el('address').value,
      'Créneau souhaité : ' + el('slot').value,
      'Paiement à réception : ' + el('payment').value,
      ''
    ];
    if (!quote) {
      products
        .filter((p) => basket[p.id])
        .forEach((p) => lines.push(basket[p.id] + ' × ' + p.name + ' : ' + money(p.price * basket[p.id])));
      lines.push('Total indicatif des articles : ' + money(basketTotal()));
    }
    lines.push(
      'Livraison, disponibilité et prix définitifs à confirmer.',
      '',
      'Informations complémentaires : ' + el('notes').value,
      '',
      'Ce document doit être transmis à la librairie. Il ne constitue pas une commande confirmée.'
    );
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
      toast('Récapitulatif copié');
    } catch (e) {
      toast('Copie indisponible : téléchargez le document.');
    }
  }

  /* ---------- Événements ---------- */

  function bindEvents() {
    el('filters').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-cat]');
      if (!btn) return;
      category = btn.dataset.cat;
      document.querySelectorAll('.chip').forEach((x) => x.classList.toggle('active', x === btn));
      renderProducts();
    });

    el('search').addEventListener('input', renderProducts);

    el('products').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-add]');
      if (!btn) return;
      const p = findProduct(btn.dataset.add);
      if (!p) return;
      if (p.price === null) {
        openForm(true);
        el('notes').value = p.name + ' : titre, classe et édition à préciser.';
        return;
      }
      basket[p.id] = Math.min(MAX_QTY, (basket[p.id] || 0) + 1);
      saveBasket();
      toast('Article ajouté au panier');
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

    el('checkoutBtn').addEventListener('click', () => openForm(false));
    el('listBtn').addEventListener('click', () => openForm(true));
    el('termsBtn').addEventListener('click', () => el('terms').showModal());
    el('clear').addEventListener('click', () => {
      basket = {};
      saveBasket();
      toast('Panier effacé');
    });

    el('orderForm').addEventListener('submit', (e) => {
      e.preventDefault();
      summaryText = buildSummary();
      el('summary').textContent = summaryText;
      el('orderForm').classList.add('hidden');
      el('result').classList.remove('hidden');
    });

    el('download').addEventListener('click', download);
    el('copy').addEventListener('click', copy);
  }

  /* ---------- Démarrage ---------- */

  renderFilters();
  bindEvents();
  saveBasket();
  renderProducts();
})();
