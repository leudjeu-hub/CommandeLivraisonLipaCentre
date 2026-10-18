// Tests navigateur (Playwright) : npm run test:browser
const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.route('**/*', (route) =>
    route.request().url().startsWith('http://127.0.0.1:4200') ? route.continue() : route.abort()
  );
  page.on('requestfailed', (r) => { throw new Error('Requête bloquée : ' + r.url()); });
});

test('la page se charge sans erreur et affiche le catalogue', async ({ page }) => {
  const errors = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));
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
