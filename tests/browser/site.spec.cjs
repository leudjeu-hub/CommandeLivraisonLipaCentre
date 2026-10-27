// Tests navigateur (Playwright) : npm run test:browser
const { test, expect } = require('@playwright/test');

// Le site publié appelle l'API sur Render (vite.config.ts). Dans les tests, elle est simulée :
// par défaut GET /products/ renvoie les 8 articles de products.json, le reste répond 503 ; un test
// peut la remplacer avec mockApi(). Toute autre requête externe fait échouer le test.
const API = 'https://papeterie-api-kshr.onrender.com';
const PRODUCTS = require('./products.json');

test.beforeEach(async ({ page }) => {
  await page.route('**/*', (route) => {
    const url = route.request().url();
    if (url.startsWith('http://127.0.0.1:4200')) return route.continue();
    if (url === `${API}/products/`) return route.fulfill({ contentType: 'application/json', body: JSON.stringify(PRODUCTS) });
    if (url.startsWith(API)) return route.fulfill({ status: 503, contentType: 'application/json', body: '{"detail":"indisponible"}' });
    return route.abort();
  });
  // Une requête annulée par la navigation suivante (favicon, API) n'est pas une erreur ; les
  // requêtes externes bloquées par route.abort() échouent avec net::ERR_FAILED
  page.on('requestfailed', (r) => {
    if (r.failure()?.errorText === 'net::ERR_ABORTED') return;
    throw new Error('Requête bloquée : ' + r.url());
  });
});

async function mockApi(page, handler) {
  await page.route(`${API}/**`, async (route) => {
    const req = route.request();
    const { status = 200, body } = await handler(new URL(req.url()).pathname, req);
    return route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body ?? null) });
  });
}

test('la page se charge sans erreur et affiche le catalogue', async ({ page }) => {
  const errors = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));
  // Aucune requête en 503 (le navigateur la journaliserait comme une erreur)
  await mockApi(page, (path) => ({ body: path === '/products/' ? PRODUCTS : null }));
  await page.goto('/');
  await expect(page.locator('h1')).toContainText('Fournitures scolaires, de bureau et livres livrés');
  await expect(page.locator('text=Commander mes fournitures')).toBeVisible();
  expect(errors).toEqual([]);
});

test('navigation vers le catalogue', async ({ page }) => {
  await page.goto('/');
  await page.click('text=Commander mes fournitures');
  await expect(page).toHaveURL(/\/catalogue/);
  await expect(page.locator('h1')).toContainText('Fournitures scolaires');
  await expect(page.locator('[data-testid="product-card"]')).toHaveCount(8);
});

test('recherche et filtres', async ({ page }) => {
  await page.goto('/catalogue');
  await page.fill('input[type="search"]', 'stylo');
  await expect(page.locator('[data-testid="product-card"]')).toHaveCount(1);
  await page.fill('input[type="search"]', 'xyz');
  await expect(page.locator('text=Aucun article trouvé')).toBeVisible();
  await page.fill('input[type="search"]', '');
  await page.getByRole('button', { name: 'Bureau' }).click();
  await expect(page.locator('[data-testid="product-card"]')).toHaveCount(3);
});

test('parcours complet : panier → formulaire → récapitulatif', async ({ page }) => {
  await page.goto('/catalogue');
  await page.click('button:has-text("Ajouter")');
  await page.click('button:has-text("Ajouter")');
  await page.getByRole('button', { name: 'Panier' }).click();
  await expect(page.locator('h1')).toContainText('Votre panier');
  // Référence de l'article (n° du catalogue) dans le panier et dans le bon de commande
  await expect(page.locator('main li').first()).toContainText(/Réf\. \d+ · /);
  await page.click('text=Préparer ma commande');
  await expect(page).toHaveURL(/\/commander/);

  await page.getByLabel('Nom du destinataire').fill('Client Test');
  await page.getByLabel('Téléphone').fill('+237 600 00 00 00');
  await page.getByRole('combobox', { name: 'Quartier' }).click();
  await page.getByRole('option', { name: 'Essos', exact: true }).click();
  await expect(page.locator('text=Livraison zone 2 (Proche)')).toBeVisible();
  await page.getByLabel('Adresse et repère').fill('Près du rond-point');
  await page.click('button:has-text("Vérifier ma commande")');

  await expect(page.locator('text=Votre récapitulatif est prêt')).toBeVisible();
  // (le pied de page a aussi un lien WhatsApp)
  const wa = page.getByRole('link', { name: 'Envoyer ma commande sur WhatsApp' });
  await expect(wa).toBeVisible();
  const href = await wa.getAttribute('href');
  expect(href.startsWith('https://wa.me/237693240396?text=')).toBe(true);
  const text = decodeURIComponent(href.split('?text=')[1]);
  expect(text).toContain('Client Test');
  expect(text).toContain('Essos');
  expect(text).toMatch(/\n\d+ × .+ \(Réf\. \d+\) : /);
  // Créneau et paiement non choisis : « À convenir », jamais une valeur vide
  expect(text).toContain('Créneau souhaité : À convenir');
  expect(text).toContain('Paiement à réception : À convenir');

  const mail = page.getByRole('link', { name: 'Envoyer par e-mail' });
  await expect(mail).toBeVisible();
  const mailHref = await mail.getAttribute('href');
  expect(mailHref.startsWith('mailto:Lipacentre237@gmail.com?subject=')).toBe(true);
  const params = new URLSearchParams(mailHref.split('?')[1]);
  expect(params.get('subject')).toBe('Bon de commande – Client Test');
  expect(params.get('body')).toBe(text);
});

test('lecture du catalogue sans Content-Type ni jeton : pas de requête préalable OPTIONS', async ({ page }) => {
  const reads = [];
  await mockApi(page, (path, req) => {
    if (path === '/products/') reads.push(req.headers());
    return { body: path === '/products/' ? PRODUCTS : null };
  });
  // Même connecté, la liste publique part sans jeton (un en-tête Authorization imposerait un OPTIONS)
  await page.addInitScript(() => localStorage.setItem('centre-auth-token', 'jeton-test'));
  await page.goto('/catalogue');
  await expect.poll(() => reads.length).toBeGreaterThan(0);
  expect(reads[0]['content-type']).toBeUndefined();
  expect(reads[0].authorization).toBeUndefined();
});

test('commande enregistrée dans l’API une seule fois, à l’envoi du récapitulatif', async ({ page }) => {
  const sent = [];
  await mockApi(page, (path, req) => {
    if (path === '/products/') return { body: PRODUCTS };
    if (path === '/orders/submit') {
      sent.push(req.postDataJSON());
      return { status: 201, body: { id: 1 } };
    }
    return { status: 404 };
  });
  await page.goto('/catalogue');
  await page.click('button:has-text("Ajouter")');
  await page.click('button:has-text("Ajouter")');
  await page.getByRole('button', { name: 'Panier' }).click();
  await page.click('text=Préparer ma commande');
  await page.getByLabel('Nom du destinataire').fill('Client Test');
  await page.getByLabel('Téléphone').fill('+237 600 00 00 00');
  await page.getByRole('combobox', { name: 'Quartier' }).click();
  await page.getByRole('option', { name: 'Essos', exact: true }).click();
  await page.getByLabel('Adresse et repère').fill('Près du rond-point');
  await page.click('button:has-text("Vérifier ma commande")');
  // Rien n'est enregistré tant que le client n'envoie pas
  await expect(page.locator('text=Votre récapitulatif est prêt')).toBeVisible();
  expect(sent).toHaveLength(0);

  await page.getByRole('button', { name: 'Copier' }).click();
  await expect.poll(() => sent.length).toBe(1);
  expect(sent[0]).toMatchObject({
    kind: 'order', customer_name: 'Client Test', phone: '+237 600 00 00 00', area: 'Essos',
    address: 'Près du rond-point', delivery_fee: 2000,
  });
  expect(sent[0].items.reduce((n, i) => n + i.quantity, 0)).toBe(2);
  // Même référence que dans le message, pour retrouver la commande dans Gestion
  expect(sent[0].notes).toMatch(/^Référence : LC-\d{4}-\d{4}$/);
  await page.getByRole('button', { name: 'Copier' }).click();
  await page.waitForTimeout(300);
  expect(sent).toHaveLength(1);
});

test('confirmation à l’écran après « Envoyer par e-mail », avec la référence', async ({ page }) => {
  await mockApi(page, (path) => {
    if (path === '/products/') return { body: PRODUCTS };
    if (path === '/orders/submit') return { status: 201, body: { id: 42, claim_code: 'code-invite' } };
    return { status: 404 };
  });
  await page.goto('/catalogue');
  await page.click('button:has-text("Ajouter")');
  await page.click('button:has-text("Ajouter")');
  await page.getByRole('button', { name: 'Panier' }).click();
  await page.click('text=Préparer ma commande');
  await page.getByLabel('Nom du destinataire').fill('Client Test');
  await page.getByLabel('Téléphone').fill('+237 600 00 00 00');
  await page.getByRole('combobox', { name: 'Quartier' }).click();
  await page.getByRole('option', { name: 'Essos', exact: true }).click();
  await page.getByLabel('Adresse et repère').fill('Près du rond-point');
  await page.click('button:has-text("Vérifier ma commande")');
  await expect(page.getByText('Dernière étape : envoyez votre commande')).toHaveCount(0);
  // La référence est dans le récapitulatif, donc dans le message WhatsApp et dans l'e-mail
  const ref = (await page.locator('pre').innerText()).match(/Référence : (LC-\d{4}-\d{4})/)[1];
  await expect(page.getByRole('link', { name: 'Envoyer ma commande sur WhatsApp' })).toHaveAttribute('href', new RegExp(encodeURIComponent(ref)));

  // mailto: n'ouvre rien dans le navigateur de test ; on garde la page
  const email = page.getByRole('link', { name: 'Envoyer par e-mail' });
  await expect(email).toHaveAttribute('href', new RegExp(encodeURIComponent(ref)));
  await email.evaluate((a) => a.addEventListener('click', (e) => e.preventDefault()));
  await email.click();
  const sent = page.locator('.MuiAlert-root').filter({ hasText: 'Dernière étape : envoyez votre commande' });
  await expect(sent).toBeFocused();
  await expect(sent).toContainText('Votre messagerie s\'est ouverte avec votre message');
  await expect(sent).toContainText(`Votre référence : ${ref}`);
  await expect(sent).toContainText('Message envoyé ? Videz votre panier');
  // Plus de « merci » ni de deuxième encadré qui contredirait « À CONFIRMER »
  await expect(page.getByText('Merci pour votre commande')).toHaveCount(0);
  await expect(page.locator('.MuiAlert-root').filter({ hasText: 'Message envoyé ?' })).toHaveCount(1);
  // Sans compte : invitation à se connecter pour suivre la commande, code gardé pour la rattacher
  const follow = sent.getByTestId('follow-hint');
  await expect(follow).toContainText('Suivez cette commande et son statut dans Mes commandes');
  await expect(follow.getByRole('link', { name: 'Créer un compte' })).toHaveAttribute('href', /\/inscription\?suite=\/compte$/);
  await expect.poll(() => page.evaluate(() => localStorage.getItem('centre-commandes-a-rattacher'))).toBe('["code-invite"]');
});

test('article sur devis : ouvre la demande de devis', async ({ page }) => {
  await page.goto('/catalogue');
  await page.click('button:has-text("Demander")');
  await expect(page).toHaveURL(/\/commander\?type=quote/);
  await expect(page.locator('h1')).toContainText('Votre demande de devis');
});

test('quartier manquant : message sous le champ visible, focus sur la liste, astérisque', async ({ page }) => {
  await page.goto('/catalogue');
  await page.click('button:has-text("Ajouter")');
  await page.click('button:has-text("Ajouter")');
  await page.goto('/commander');
  await expect(page.locator('h1')).toHaveText('Votre commande');
  await expect(page.locator('#area-label')).toContainText('*');
  await page.getByLabel('Nom du destinataire').fill('Client Test');
  await page.getByLabel('Téléphone').fill('+237 600 00 00 00');
  await page.getByLabel('Adresse et repère').fill('Près du rond-point');
  await page.click('button:has-text("Vérifier ma commande")');
  const area = page.getByRole('combobox', { name: 'Quartier' });
  await expect(page.getByText('Choisissez votre quartier')).toBeVisible();
  await expect(area).toBeFocused();
  await expect(area).toHaveAttribute('aria-describedby', 'area-error');
  await expect(page.locator('text=Votre récapitulatif est prêt')).toHaveCount(0);
  // Le message disparaît dès qu'un quartier est choisi
  await area.click();
  await page.getByRole('option', { name: 'Essos', exact: true }).click();
  await expect(page.getByText('Choisissez votre quartier')).toHaveCount(0);
});

test('demande de devis : adresse facultative, textes « demande »', async ({ page }) => {
  await page.goto('/commander?type=quote');
  await expect(page.getByText('Votre demande est préparée ici')).toBeVisible();
  await page.getByLabel('Nom du destinataire').fill('Parent Test');
  await page.getByLabel('Téléphone').fill('6 93 24 03 96');
  await page.getByRole('combobox', { name: 'Quartier' }).click();
  await page.getByRole('option', { name: 'Essos', exact: true }).click();
  await page.click('button:has-text("Vérifier ma demande")');
  await expect(page.locator('pre')).toContainText('Adresse / repère : À convenir');
});

test('vignette sans photo : texte blanc lisible (≥ 4,5:1) même avec une couleur claire', async ({ page }) => {
  const light = PRODUCTS.filter((p) => p.category === 'Bureau').map((p) => ({ ...p, image: null }));
  light[0] = { ...light[0], color: null };
  light[1] = { ...light[1], color: '#c6a157' };
  await page.route(`${API}/products/`, (route) => route.fulfill({ contentType: 'application/json', body: JSON.stringify(light) }));
  await page.goto('/catalogue');
  await expect(page.getByText(light[1].name)).toBeVisible();
  const ratios = await page.evaluate(() => {
    const lum = (rgb) => rgb.map((c) => (c / 255 <= 0.04045 ? c / 255 / 12.92 : ((c / 255 + 0.055) / 1.055) ** 2.4))
      .reduce((sum, c, i) => sum + c * [0.2126, 0.7152, 0.0722][i], 0);
    // Fond de la vignette = premier enfant de la carte
    return [...document.querySelectorAll('[data-testid="product-card"] > :first-child')]
      .map((e) => getComputedStyle(e).backgroundColor)
      .map((c) => 1.05 / (lum(c.match(/\d+/g).slice(0, 3).map(Number)) + 0.05));
  });
  expect(ratios.length).toBeGreaterThan(0);
  for (const r of ratios) expect(r).toBeGreaterThanOrEqual(4.5);
});

test('langue : passage en anglais', async ({ page, isMobile }) => {
  await page.goto('/');
  if (isMobile) await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByRole('button', { name: 'English' }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('h1')).toContainText('School supplies, office supplies and books');
  await page.goto('/catalogue');
  await expect(page.locator('h1')).toContainText('School supplies');
});

test('menu mobile : ouvre et navigue', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'menu compact uniquement sur mobile');
  await page.goto('/');
  await page.getByRole('button', { name: 'Menu' }).click();
  await expect(page.getByRole('link', { name: 'Le catalogue', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Livraison', exact: true }).click();
  await expect(page).toHaveURL(/\/livraison/);
});

test('menu mobile : bouton Fermer, logo, WhatsApp et téléphone', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'menu compact uniquement sur mobile');
  await page.goto('/');
  await page.getByRole('button', { name: 'Menu' }).click();
  const menu = page.locator('.MuiDrawer-paper');
  await expect(menu.getByRole('img', { name: 'Librairie Papeterie du Centre' })).toBeVisible();
  await expect(menu.getByRole('link', { name: 'Écrire sur WhatsApp' })).toHaveAttribute('href', 'https://wa.me/237693240396');
  await expect(menu.getByRole('link', { name: '+237 6 93 24 03 96' })).toHaveAttribute('href', 'tel:+237693240396');
  await menu.getByRole('button', { name: 'Fermer le menu' }).click();
  await expect(menu).toBeHidden();
});

test('lien « Aller au contenu » : première tabulation, focus sur le contenu', async ({ page }) => {
  await page.goto('/livraison');
  await expect(page.locator('h1')).toBeVisible();
  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', { name: 'Aller au contenu' });
  await expect(skip).toBeFocused();
  await expect(skip).toBeInViewport();
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();
  // Tabulation suivante : premier lien du contenu, plus ceux de l'en-tête
  await page.keyboard.press('Tab');
  expect(await page.evaluate(() => !!document.activeElement?.closest('main'))).toBe(true);
});

test('logo : lien de la taille du logo, pas de toute la barre', async ({ page }) => {
  await page.goto('/');
  const box = await page.getByRole('banner').getByRole('link', { name: 'Librairie Papeterie du Centre' }).boundingBox();
  expect(box.width).toBeLessThan(160);
});

test('article ajouté : « Voir le panier » dans le message', async ({ page }) => {
  await page.goto('/catalogue');
  await page.click('button:has-text("Ajouter")');
  const toast = page.locator('.MuiSnackbar-root');
  await expect(toast).toContainText('Article ajouté au panier');
  await toast.getByRole('link', { name: 'Voir le panier' }).click();
  await expect(page).toHaveURL(/\/panier$/);
  await expect(page.locator('h1')).toContainText('Votre panier');
});

test('desktop : navigation visible', async ({ page, isMobile }) => {
  test.skip(isMobile, 'ordinateur uniquement');
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Le catalogue', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Livraison', exact: true })).toBeVisible();
});

test('livraison : grille affichée', async ({ page }) => {
  await page.goto('/livraison');
  await expect(page.locator('text=Frais de livraison par quartier')).toBeVisible();
  await expect(page.locator('text=Zone 1 — Centre')).toBeVisible();
  await expect(page.locator('text=Zone 4 — Périphérie')).toBeVisible();
  // Après la grille : commander ou écrire sur WhatsApp (la page n'est plus une impasse)
  await expect(page.locator('main').getByRole('link', { name: 'Commander mes fournitures' })).toHaveAttribute('href', /\/catalogue$/);
  await expect(page.locator('main').getByRole('link', { name: 'Écrire sur WhatsApp' })).toHaveAttribute('href', /^https:\/\/wa\.me\/237693240396\?text=/);
});

test('panier vide : bouton désactivé', async ({ page }) => {
  await page.goto('/panier');
  await expect(page.locator('text=Votre panier est vide')).toBeVisible();
});

test('panier enregistré par l’ancien site ou corrompu : pas de plantage', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  for (const stored of ['{"1":2,"3":1}', '"texte"', '[{"productId":1}]', 'pas du json']) {
    await page.goto('/');
    await page.evaluate((v) => localStorage.setItem('centre-cart', v), stored);
    await page.goto('/panier');
    await expect(page.locator('h1')).toBeVisible();
  }
  expect(errors).toEqual([]);
  // ancien format { "id": quantité } : le panier est repris
  await page.evaluate(() => localStorage.setItem('centre-cart', '{"1":2,"3":1}'));
  await page.goto('/panier');
  await expect(page.locator('text=Cahier A4')).toBeVisible();
  await expect(page.locator('text=Kit de géométrie')).toBeVisible();
});

test('navigation : la page active est signalée', async ({ page, isMobile }) => {
  await page.goto('/livraison');
  if (isMobile) await page.getByRole('button', { name: 'Menu' }).click();
  await expect(page.getByRole('link', { name: 'Livraison', exact: true })).toHaveAttribute('aria-current', 'page');
  await expect(page.getByRole('link', { name: 'Le catalogue', exact: true })).not.toHaveAttribute('aria-current', 'page');
  await page.goto('/panier');
  await expect(page.getByRole('button', { name: 'Panier' })).toHaveAttribute('aria-current', 'page');
});

test('site publié : le catalogue affiche les articles de l’API', async ({ page }) => {
  await mockApi(page, (path) => ({
    body: path === '/products/'
      ? [{ id: 1, category: 'Scolaire', price: 1800, name: 'Cahier API', description: 'Depuis Render.', label: null,
          name_en: null, description_en: null, label_en: null, color: null, available: true, status: null, image: null, stock: 4 }]
      : null
  }));
  await page.goto('/catalogue');
  await expect(page.locator('[data-testid="product-card"]')).toHaveCount(1);
  await expect(page.locator('[data-testid="product-card"]')).toContainText('1 800 FCFA');
});

test('site publié : articles regroupés et filtrés par famille', async ({ page }) => {
  const item = (id, category, name, family) => ({ id, category, price: 500, name, family, description: '', label: null,
    name_en: null, description_en: null, label_en: null, color: null, available: true, status: null, image: null, stock: 1 });
  await mockApi(page, (path) => ({
    body: path === '/products/'
      ? [item(1, 'Scolaire', 'Sac rouge', 'Sacs et cartables'), item(2, 'Scolaire', 'Sac bleu', 'Sacs et cartables'),
        item(3, 'Scolaire', 'Stylo noir', 'Stylos'), item(4, 'Scolaire', 'Objet mystère', null), item(5, 'Bureau', 'Rame A4', 'Papier')]
      : null
  }));
  await page.goto('/catalogue');
  await expect(page.locator('[data-testid="product-card"]')).toHaveCount(5);
  await expect(page.locator('section h2')).toHaveText(['Papier (1)', 'Sacs et cartables (2)', 'Stylos (1)', 'Autres articles (1)']);
  await page.getByRole('button', { name: 'Scolaire' }).click();
  const families = page.getByRole('group', { name: 'Familles' });
  await expect(families.getByRole('button')).toHaveText(['Toutes', 'Sacs et cartables', 'Stylos']);
  await families.getByRole('button', { name: 'Sacs et cartables' }).click();
  await expect(page.locator('[data-testid="product-card"]')).toHaveCount(2);
  // Changer de catégorie remet la famille à « Toutes »
  await page.getByRole('button', { name: 'Bureau' }).click();
  await expect(page.locator('[data-testid="product-card"]')).toHaveCount(1);
  await expect(page.getByRole('group', { name: 'Familles' }).getByRole('button', { name: 'Toutes' })).toHaveAttribute('aria-pressed', 'true');
});

test('site publié : un administrateur se connecte depuis la barre de navigation', async ({ page, isMobile }) => {
  const admin = { id: 3, email: 'admin@exemple.cm', role: 'admin', created_at: '2026-10-19T08:00:00' };
  await mockApi(page, (path, req) => {
    if (path === '/auth/login') {
      const { password } = req.postDataJSON();
      return password === 'admin-123' ? { body: { token: 'jeton', token_type: 'bearer', user: admin } } : { status: 401, body: { detail: 'Invalid e-mail or password' } };
    }
    if (path === '/auth/me') return req.headers().authorization === 'Bearer jeton' ? { body: admin } : { status: 401, body: {} };
    if (path === '/products/') return { body: [] };
    return { status: 404, body: {} };
  });
  await page.goto('/');
  // « Connexion » est dans le pied de page (un compte n'est pas nécessaire pour commander)
  await page.getByRole('contentinfo').getByRole('link', { name: 'Connexion', exact: true }).click();
  await expect(page).toHaveURL(/\/connexion$/);
  await page.getByLabel('E-mail').fill('admin@exemple.cm');
  await page.getByLabel('Mot de passe').fill('admin-123');
  await page.getByRole('button', { name: 'Se connecter' }).click();
  await expect(page.getByText('Connecté en tant que admin@exemple.cm')).toBeVisible();
  if (isMobile) await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByRole('link', { name: 'Gestion', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Gestion des articles' })).toBeVisible();
});

const apiItem = (id, name, family = null) => ({ id, category: 'Scolaire', price: 500, name, family, description: '', label: null,
  name_en: null, description_en: null, label_en: null, color: null, available: true, status: null, image: null, stock: 1 });

test('site publié : grand catalogue affiché par pages, la recherche porte sur tout', async ({ page }) => {
  const list = Array.from({ length: 100 }, (_, i) => apiItem(i + 1, `Article ${i + 1}`));
  await mockApi(page, (path) => ({ body: path === '/products/' ? list : null }));
  await page.goto('/catalogue');
  await expect(page.getByText('100 article(s)')).toBeVisible();
  await expect(page.locator('[data-testid="product-card"]')).toHaveCount(24);
  await page.getByRole('button', { name: /Afficher plus \(76/ }).click();
  await expect(page.locator('[data-testid="product-card"]')).toHaveCount(72);
  // La recherche trouve aussi les articles pas encore affichés
  await page.fill('input[type="search"]', 'article 99');
  await expect(page.locator('[data-testid="product-card"]')).toHaveCount(1);
  await expect(page.getByRole('button', { name: /Afficher plus/ })).toHaveCount(0);
});

test('site publié : le catalogue de la visite précédente s’affiche sans attendre l’API', async ({ page }) => {
  let calls = 0;
  await mockApi(page, (path) => { calls += path === '/products/' ? 1 : 0; return { body: path === '/products/' ? [apiItem(41, 'Cahier réel')] : null }; });
  await page.goto('/catalogue');
  await expect(page.locator('[data-testid="product-card"]')).toContainText('Cahier réel');
  // API en panne à la visite suivante : la liste enregistrée reste affichée (pas les articles de démonstration)
  await page.unrouteAll();
  await page.route('**/*', (route) => route.request().url().startsWith('http://127.0.0.1:4200')
    ? route.continue() : route.fulfill({ status: 503, contentType: 'application/json', body: '{}' }));
  await page.reload();
  await expect(page.locator('[data-testid="product-card"]')).toHaveCount(1);
  await expect(page.locator('[data-testid="product-card"]')).toContainText('Cahier réel');
  expect(calls).toBe(1);
});

test('panier enregistré : pas « vide » ni faux articles pendant le chargement de l’API', async ({ page }) => {
  let release;
  const waiting = new Promise((r) => { release = r; });
  await page.route(`${API}/products/`, async (route) => {
    await waiting;
    route.fulfill({ contentType: 'application/json', body: JSON.stringify([apiItem(3, 'Agrafeuse réelle')]) });
  });
  await page.addInitScript(() => localStorage.setItem('centre-cart', '[{"productId":3,"quantity":2}]'));
  await page.goto('/panier');
  await expect(page.getByText('Chargement du catalogue')).toBeVisible();
  await expect(page.getByText('Votre panier est vide')).toHaveCount(0);
  await expect(page.getByText('Kit de géométrie')).toHaveCount(0);
  release();
  await expect(page.getByText('Agrafeuse réelle')).toBeVisible();
});

test('commande : panier vide et numéro de téléphone invalide', async ({ page }) => {
  await page.goto('/commander');
  await expect(page.getByText('Votre panier est vide : ajoutez des articles')).toBeVisible();
  await page.goto('/catalogue');
  await page.click('button:has-text("Ajouter")');
  await page.click('button:has-text("Ajouter")');
  await page.goto('/commander');
  await page.getByLabel('Nom du destinataire').fill('Client Test');
  await page.getByLabel('Téléphone').fill('12345');
  await page.getByRole('combobox', { name: 'Quartier' }).click();
  await page.getByRole('option', { name: 'Essos', exact: true }).click();
  await page.getByLabel('Adresse et repère').fill('Près du rond-point');
  await page.click('button:has-text("Vérifier ma commande")');
  await expect(page.getByText('Numéro invalide')).toBeVisible();
  await page.getByLabel('Téléphone').fill('6 93 24 03 96');
  await page.click('button:has-text("Vérifier ma commande")');
  await expect(page.locator('text=Votre récapitulatif est prêt')).toBeVisible();
});

test('site publié : serveur injoignable au démarrage, la session est conservée', async ({ page }) => {
  const admin = { id: 3, email: 'admin@exemple.cm', role: 'admin', created_at: '2026-10-19T08:00:00', is_active: true };
  let up = false;
  await mockApi(page, (path) => {
    if (path === '/auth/me') return up ? { body: admin } : { status: 502, body: { detail: 'Bad gateway' } };
    return { body: path === '/products/' ? [] : null };
  });
  await page.addInitScript(() => localStorage.setItem('centre-auth-token', 'jeton'));
  await page.goto('/compte');
  await expect(page.getByText('Le serveur ne répond pas')).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('centre-auth-token'))).toBe('jeton');
  up = true;
  await page.getByRole('button', { name: 'Réessayer' }).click();
  await expect(page.getByText('Connecté en tant que admin@exemple.cm')).toBeVisible();
});

test('API injoignable à la première visite : message et WhatsApp, pas d’articles inventés', async ({ page }) => {
  let up = false;
  await mockApi(page, (path) => (up && path === '/products/' ? { body: PRODUCTS } : { status: 503, body: { detail: 'indisponible' } }));
  await page.goto('/catalogue');
  const box = page.getByTestId('catalogue-unavailable');
  await expect(box).toContainText('momentanément indisponible');
  await expect(box.getByRole('link', { name: 'Commander par WhatsApp' })).toHaveAttribute('href', /^https:\/\/wa\.me\/237693240396\?text=/);
  await expect(page.locator('[data-testid="product-card"]')).toHaveCount(0);
  up = true;
  await box.getByRole('button', { name: 'Réessayer' }).click();
  await expect(page.locator('[data-testid="product-card"]')).toHaveCount(8);
});

test('récapitulatif : créneau et paiement en toutes lettres, pas « morning » ni « cash »', async ({ page }) => {
  await page.goto('/catalogue');
  await page.click('button:has-text("Ajouter")');
  await page.click('button:has-text("Ajouter")');
  await page.goto('/commander');
  await page.getByLabel('Nom du destinataire').fill('Client Test');
  await page.getByLabel('Téléphone').fill('690000000');
  await page.getByRole('combobox', { name: 'Quartier' }).click();
  await page.getByRole('option', { name: 'Essos', exact: true }).click();
  await page.getByLabel('Adresse et repère').fill('Près du rond-point');
  await page.getByRole('combobox', { name: 'Créneau souhaité' }).click();
  await page.getByRole('option', { name: 'Matin' }).click();
  await page.getByRole('combobox', { name: 'Paiement à la réception' }).click();
  await page.getByRole('option', { name: 'Espèces' }).click();
  await page.click('button:has-text("Vérifier ma commande")');
  const summary = page.locator('pre');
  await expect(summary).toContainText('Créneau souhaité : Matin');
  await expect(summary).toContainText('Paiement à réception : Espèces');
  await expect(summary).not.toContainText('morning');
  await expect(summary).not.toContainText('cash');
});

test('WhatsApp joignable : accueil, pied de page, devis et attente du catalogue', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: /Commandez sur WhatsApp/ })).toHaveAttribute('href', /^https:\/\/wa\.me\/237693240396\?text=/);
  // Placé après la dernière réponse des questions fréquentes (demande d'Alain, 2026-10-25)
  await expect(page.locator('section[aria-labelledby="faq-title"]').getByRole('link', { name: /Commandez sur WhatsApp/ })).toBeVisible();
  await expect(page.locator('footer').getByRole('link', { name: 'Écrire sur WhatsApp' })).toHaveAttribute('href', 'https://wa.me/237693240396');
  await page.goto('/commander?type=quote');
  await expect(page.getByRole('link', { name: 'Envoyer la photo par WhatsApp' })).toBeVisible();
});

test('première visite, serveur en veille : WhatsApp proposé pendant le chargement', async ({ page }) => {
  // L'API ne répond jamais : le message de chargement reste, avec une autre issue
  await page.route(`${API}/products/`, () => {});
  await page.goto('/catalogue');
  await expect(page.locator('text=Chargement du catalogue')).toBeVisible();
  await expect(page.locator('main').getByRole('link', { name: 'Commander par WhatsApp' })).toBeVisible();
});

test('sans JavaScript : écran de démarrage avec WhatsApp et téléphone', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.locator('h1')).toContainText('Yaoundé');
  await expect(page.getByRole('link', { name: 'Commander par WhatsApp' })).toHaveAttribute('href', 'https://wa.me/237693240396');
  await expect(page.locator('a[href="tel:+237693240396"]')).toBeVisible();
  await context.close();
});

test('écran de démarrage remplacé par le site une fois React lancé', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toContainText('Fournitures scolaires, de bureau et livres livrés');
  await expect(page.locator('.shell')).toHaveCount(0);
});

// Copie du catalogue publiée avec le site (dist/catalogue.json, vide dans les tests sauf ici)
const snapshot = (page, list) =>
  page.route('**/catalogue.json', (route) => route.fulfill({ contentType: 'application/json', body: JSON.stringify(list) }));

test('première visite, serveur en veille : la copie du catalogue s’affiche sans attendre l’API', async ({ page }) => {
  await snapshot(page, PRODUCTS);
  await page.route(`${API}/products/`, () => {}); // l'API ne répond jamais
  await page.goto('/catalogue');
  await expect(page.locator('[data-testid="product-card"]')).toHaveCount(8);
  await expect(page.locator('text=Chargement du catalogue')).toHaveCount(0);
});

test('API injoignable à la première visite, copie publiée : articles de la copie, pas « indisponible »', async ({ page }) => {
  await snapshot(page, PRODUCTS);
  await mockApi(page, () => ({ status: 503, body: { detail: 'indisponible' } }));
  await page.goto('/catalogue');
  await expect(page.locator('[data-testid="product-card"]')).toHaveCount(8);
  await expect(page.getByTestId('catalogue-unavailable')).toHaveCount(0);
});

test('copie publiée puis réponse de l’API : la liste de l’API remplace la copie', async ({ page }) => {
  await snapshot(page, PRODUCTS);
  let answer;
  const api = new Promise((resolve) => (answer = resolve));
  await page.route(`${API}/products/`, async (route) => {
    await api;
    route.fulfill({ contentType: 'application/json', body: JSON.stringify(PRODUCTS.slice(0, 2)) });
  });
  await page.goto('/catalogue');
  await expect(page.locator('[data-testid="product-card"]')).toHaveCount(8);
  answer();
  await expect(page.locator('[data-testid="product-card"]')).toHaveCount(2);
});

test('copie publiée : les articles indisponibles n’apparaissent pas', async ({ page }) => {
  await snapshot(page, PRODUCTS.map((p, i) => ({ ...p, available: i !== 0 })));
  await page.route(`${API}/products/`, () => {});
  await page.goto('/catalogue');
  await expect(page.locator('[data-testid="product-card"]')).toHaveCount(7);
});

test('accueil : un raccourci de catégorie ouvre le catalogue filtré', async ({ page }) => {
  await snapshot(page, PRODUCTS);
  await page.goto('/');
  await page.getByRole('link', { name: /^Fournitures de bureau/ }).click();
  await expect(page).toHaveURL(/\/catalogue\?cat=Bureau$/);
  await expect(page.getByRole('button', { name: 'Bureau', pressed: true })).toBeVisible();
  await expect(page.locator('[data-testid="product-card"]')).toHaveCount(PRODUCTS.filter((p) => p.category === 'Bureau').length);
});

test('accueil : engagements chiffrés, écoles et entreprises, FAQ ; titre propre à chaque page', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/^Librairie Papeterie du Centre, Yaoundé : fournitures scolaires$/);
  await expect(page.getByRole('heading', { name: 'Livré le jour même' })).toBeVisible();
  await expect(page.getByText(/^Dès 25\s000 FCFA d'articles en zones Centre et Proche\.$/)).toBeVisible();
  // Un seul encart Devis pour les parents, les écoles et les entreprises
  const quote = page.getByRole('region', { name: 'Plusieurs articles ? Demandez un devis.' });
  await expect(quote.getByRole('heading', { name: 'Écoles et entreprises' })).toBeVisible();
  await expect(quote.getByRole('link', { name: 'Demander un devis' })).toHaveAttribute('href', /\/commander\?type=quote$/);
  await expect(quote.getByRole('link', { name: 'Envoyer ma liste en photo' })).toHaveAttribute('href', /^https:\/\/wa\.me\/237693240396\?text=/);
  await expect(page.getByRole('heading', { name: 'Combien coûte la livraison à Yaoundé ?' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Tous les quartiers livrés et leurs tarifs' })).toHaveAttribute('href', '/livraison');
  // Pied de page : catalogue et tarifs de livraison, aussi sur mobile (menu replié)
  const footer = page.locator('footer');
  await expect(footer.getByRole('link', { name: 'Catalogue des fournitures' })).toHaveAttribute('href', '/catalogue');
  await expect(footer.getByRole('link', { name: 'Tarifs de livraison à Yaoundé' })).toHaveAttribute('href', '/livraison');
  await expect(page.getByText(/^De 1\s000 FCFA \(zone Centre/)).toBeVisible();
  await expect(page.getByRole('banner').getByRole('link', { name: 'Écrire sur WhatsApp' })).toHaveAttribute('href', 'https://wa.me/237693240396');
  await page.goto('/livraison');
  await expect(page).toHaveTitle(/Livraison à Yaoundé/);
});

test('confidentialité : page à part, liée depuis le pied de page, ouverte en haut', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('contentinfo').getByRole('link', { name: 'Confidentialité' }).click();
  await expect(page).toHaveURL(/\/confidentialite$/);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  await expect(page).toHaveTitle(/^Confidentialité/);
  await expect(page.getByRole('heading', { level: 1, name: 'Confidentialité' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Combien de temps' })).toBeVisible();
});

// WCAG 2.4.7 / 1.4.11 : MUI met `outline: 0` sur ses boutons ; le thème doit redonner un anneau visible,
// marine sur fond clair, ocre clair sur les bandeaux marine (en-tête, pied de page)
test('focus clavier : anneau visible sur les contrôles MUI, couleur adaptée au fond', async ({ page }) => {
  await page.goto('/');
  const ringOf = (locator) => locator.evaluate((e) => {
    const s = getComputedStyle(e);
    return `${s.outlineStyle} ${s.outlineWidth} ${s.outlineColor}`;
  });
  const NAVY = 'solid 3px rgb(22, 50, 92)';
  const OCHRE = 'solid 3px rgb(229, 171, 85)';
  const stops = [
    [page.getByRole('link', { name: 'Commander mes fournitures' }), NAVY],
    [page.getByRole('link', { name: 'Voir les tarifs de votre quartier' }), NAVY],
    [page.getByRole('contentinfo').getByRole('link', { name: /^Nous trouver/ }), OCHRE],
    [page.getByRole('button', { name: 'Conditions de commande' }), OCHRE],
  ];
  // Tabulation jusqu'à chaque élément : :focus-visible ne s'applique qu'au focus clavier
  for (const [locator, ring] of stops) {
    for (let i = 0; i < 40 && !(await locator.evaluate((e) => e === document.activeElement)); i++) await page.keyboard.press('Tab');
    // poll : la règle « mouvement réduit » (0,01 ms sur tout) laisse une transition infime sur la couleur
    await expect.poll(() => ringOf(locator)).toBe(ring);
  }
});

// WCAG 2.5.3 : le nom accessible contient le texte visible (commande vocale « cliquer sur Nous trouver »)
test('pied de page : le lien Google Maps est nommé d’après son texte visible', async ({ page }) => {
  await page.goto('/');
  const map = page.getByRole('contentinfo').getByRole('link', { name: 'Nous trouver sur Google Maps (nouvel onglet)' });
  await expect(map).toContainText('Nous trouver');
});

test('adresse inconnue : page « introuvable » avec en-tête, liens et WhatsApp, jamais une page vide', async ({ page }) => {
  await page.goto('/produit/12');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Page introuvable');
  await expect(page.getByRole('main').getByRole('link', { name: "Retour à l'accueil" })).toHaveAttribute('href', /\/CommandeLivraisonLipaCentre\/$|^\/$/);
  await expect(page.getByRole('main').getByRole('link', { name: 'Le catalogue' })).toHaveAttribute('href', /\/catalogue$/);
  await expect(page.getByRole('main').getByRole('link', { name: 'Écrire sur WhatsApp' })).toHaveAttribute('href', 'https://wa.me/237693240396');
  await expect(page.getByRole('contentinfo')).toBeVisible();
});

test('page chargée à part : pas de pied de page avant la page (aucun décalage de mise en page)', async ({ page }) => {
  await page.addInitScript(() => {
    window.__cls = 0;
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) if (!e.hadRecentInput) window.__cls += e.value;
    }).observe({ type: 'layout-shift', buffered: true });
  });
  for (const path of ['/catalogue', '/livraison', '/commander?type=quote']) {
    await page.goto(path);
    await expect(page.getByRole('contentinfo')).toBeVisible();
    await page.waitForLoadState('networkidle');
    expect(await page.evaluate(() => window.__cls), path).toBeLessThan(0.05);
  }
});
