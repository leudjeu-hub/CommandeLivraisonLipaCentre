// Tests navigateur (Playwright) : npm run test:browser
const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  // Toute requête externe fait échouer le test
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
  await expect(page.locator('h1')).toContainText('Une page s’ouvre');
  await expect(page.locator('#products .card')).toHaveCount(8);
  expect(errors).toEqual([]);
});

test('recherche et filtres', async ({ page }) => {
  await page.goto('/');
  await page.fill('#search', 'stylo');
  await expect(page.locator('#products .card')).toHaveCount(1);
  await page.fill('#search', 'xyz');
  await expect(page.locator('#products .empty')).toBeVisible();
  await page.fill('#search', '');
  await page.click('[data-cat="Bureau"]');
  await expect(page.locator('#products .card')).toHaveCount(3);
});

test('parcours complet : panier → formulaire → récapitulatif', async ({ page }) => {
  await page.goto('/');
  await page.click('[data-add="1"]');
  await page.click('[data-add="1"]');
  await page.click('[data-add="2"]');
  await expect(page.locator('#count')).toHaveText('3');

  await page.click('#cartBtn');
  await expect(page.locator('#subtotal')).toHaveText(/4\s000 FCFA/);
  await page.click('#checkoutBtn');

  await page.fill('#name', 'Client Test');
  await page.fill('#phone', '+237 600 00 00 00');
  await page.fill('#area', 'Bastos');
  await page.fill('#address', 'Près du rond-point');
  await page.check('#consent');
  await page.click('#orderForm button[type="submit"]');

  const summary = page.locator('#summary');
  await expect(summary).toContainText('BROUILLON DE COMMANDE');
  await expect(summary).toContainText('2 × Cahier A4');
  await expect(summary).toContainText('Bastos');

  // Le panier survit au rechargement
  await page.reload();
  await expect(page.locator('#count')).toHaveText('3');
});

test('article sur devis : ouvre la demande de devis', async ({ page }) => {
  await page.goto('/');
  await page.click('[data-add="8"]');
  await expect(page.locator('#formTitle')).toHaveText('Votre demande de devis');
  await expect(page.locator('#notes')).toHaveValue(/Livre scolaire sur demande/);
});
