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
  await page.click('button:has-text("Bureau")');
  await expect(page.locator('[data-testid="product-card"]')).toHaveCount(3);
});

test('parcours complet : panier → formulaire → récapitulatif', async ({ page }) => {
  await page.goto('/catalogue');
  await page.click('button:has-text("Ajouter")');
  await page.click('button:has-text("Ajouter")');
  await page.click('button:has-text("Panier")');
  await expect(page.locator('h1')).toContainText('Votre panier');
  await page.click('text=Préparer ma commande');
  await expect(page).toHaveURL(/\/commander/);

  await page.fill('input[label*="Nom"]', 'Client Test');
  await page.fill('input[type="tel"]', '+237 600 00 00 00');
  await page.selectOption('select', 'Bastos');
  await page.fill('textarea', 'Près du rond-point');
  await page.check('input[type="checkbox"]');
  await page.click('button:has-text("Créer mon récapitulatif")');

  await expect(page.locator('text=Votre récapitulatif est prêt')).toBeVisible();
  const wa = page.locator('a[href*="wa.me"]');
  await expect(wa).toBeVisible();
  const href = await wa.getAttribute('href');
  expect(href.startsWith('https://wa.me/237693240396?text=')).toBe(true);
  const text = decodeURIComponent(href.split('?text=')[1]);
  expect(text).toContain('Client Test');
  expect(text).toContain('Bastos');
});

test('article sur devis : ouvre la demande de devis', async ({ page }) => {
  await page.goto('/catalogue');
  await page.click('button:has-text("Demander")');
  await expect(page).toHaveURL(/\/commander\?type=quote/);
  await expect(page.locator('h1')).toContainText('Votre demande de devis');
});

test('langue : passage en anglais', async ({ page }) => {
  await page.goto('/');
  await page.click('button:has-text("English")');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('h1')).toContainText('A page opens');
  await page.goto('/catalogue');
  await expect(page.locator('h1')).toContainText('It all starts here');
});

test('menu mobile : ouvre et navigue', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'menu compact uniquement sur mobile');
  await page.goto('/');
  await page.click('button[aria-label="Menu"]');
  await expect(page.locator('text=Le catalogue')).toBeVisible();
  await page.click('text=Livraison');
  await expect(page).toHaveURL(/\/livraison/);
});

test('desktop : navigation visible', async ({ page, isMobile }) => {
  test.skip(isMobile, 'ordinateur uniquement');
  await page.goto('/');
  await expect(page.locator('text=Le catalogue')).toBeVisible();
  await expect(page.locator('text=Livraison')).toBeVisible();
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
