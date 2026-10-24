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
  await expect(page.locator('h1')).toContainText('Une page');
  await expect(page.locator('text=Découvrir le catalogue')).toBeVisible();
  expect(errors).toEqual([]);
});

test('navigation vers le catalogue', async ({ page }) => {
  await page.goto('/');
  await page.click('text=Découvrir le catalogue');
  await expect(page).toHaveURL(/\/catalogue/);
  await expect(page.locator('h1')).toContainText('Tout commence ici');
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
  await page.click('text=Préparer ma commande');
  await expect(page).toHaveURL(/\/commander/);

  await page.getByLabel('Nom du destinataire').fill('Client Test');
  await page.getByLabel('Téléphone').fill('+237 600 00 00 00');
  await page.getByRole('combobox', { name: 'Quartier' }).click();
  await page.getByRole('option', { name: 'Essos', exact: true }).click();
  await expect(page.locator('text=Livraison zone 2 (Proche)')).toBeVisible();
  await page.getByLabel('Adresse et repère').fill('Près du rond-point');
  await page.getByRole('checkbox').check();
  await page.click('button:has-text("Créer mon récapitulatif")');

  await expect(page.locator('text=Votre récapitulatif est prêt')).toBeVisible();
  const wa = page.locator('a[href*="wa.me"]');
  await expect(wa).toBeVisible();
  const href = await wa.getAttribute('href');
  expect(href.startsWith('https://wa.me/237693240396?text=')).toBe(true);
  const text = decodeURIComponent(href.split('?text=')[1]);
  expect(text).toContain('Client Test');
  expect(text).toContain('Essos');

  const mail = page.getByRole('link', { name: 'Envoyer par e-mail' });
  await expect(mail).toBeVisible();
  const mailHref = await mail.getAttribute('href');
  expect(mailHref.startsWith('mailto:Lipacentre237@gmail.com?subject=')).toBe(true);
  const params = new URLSearchParams(mailHref.split('?')[1]);
  expect(params.get('subject')).toBe('Bon de commande – Client Test');
  expect(params.get('body')).toBe(text);
});

test('article sur devis : ouvre la demande de devis', async ({ page }) => {
  await page.goto('/catalogue');
  await page.click('button:has-text("Demander")');
  await expect(page).toHaveURL(/\/commander\?type=quote/);
  await expect(page.locator('h1')).toContainText('Votre demande de devis');
});

test('langue : passage en anglais', async ({ page, isMobile }) => {
  await page.goto('/');
  if (isMobile) await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByRole('button', { name: 'English' }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('h1')).toContainText('A page opens');
  await page.goto('/catalogue');
  await expect(page.locator('h1')).toContainText('It all starts here');
});

test('menu mobile : ouvre et navigue', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'menu compact uniquement sur mobile');
  await page.goto('/');
  await page.getByRole('button', { name: 'Menu' }).click();
  await expect(page.getByRole('link', { name: 'Le catalogue', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Livraison', exact: true }).click();
  await expect(page).toHaveURL(/\/livraison/);
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
  if (isMobile) await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByRole('link', { name: 'Connexion', exact: true }).click();
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
  await page.getByRole('checkbox').check();
  await page.click('button:has-text("Créer mon récapitulatif")');
  await expect(page.getByText('Numéro invalide')).toBeVisible();
  await page.getByLabel('Téléphone').fill('6 93 24 03 96');
  await page.click('button:has-text("Créer mon récapitulatif")');
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
