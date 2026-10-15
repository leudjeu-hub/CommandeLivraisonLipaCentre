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
  await expect(summary).toContainText('DEMANDE DE COMMANDE');
  await expect(summary).toContainText('2 × Cahier A4');
  await expect(summary).toContainText('Bastos');

  // Lien WhatsApp vers la librairie, avec le récapitulatif complet
  const wa = page.locator('#whatsapp');
  await expect(wa).toBeVisible();
  const href = await wa.getAttribute('href');
  expect(href.startsWith('https://wa.me/237693240396?text=')).toBe(true);
  const text = decodeURIComponent(href.split('?text=')[1]);
  expect(text).toContain('2 × Cahier A4');
  expect(text).toContain('Client Test');

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

test('recherche insensible aux accents et aux majuscules', async ({ page }) => {
  await page.goto('/');
  await page.fill('#search', 'GEOMETRIE');
  await expect(page.locator('#products .card')).toHaveCount(1);
  await expect(page.locator('#products h3')).toHaveText('Kit de géométrie');
});

test('fenêtre : clic sur le fond la ferme, clic dans la marge non', async ({ page }) => {
  await page.goto('/');
  await page.click('#cartBtn');
  const cart = page.locator('#cart');
  await expect(cart).toBeVisible();
  const box = await cart.boundingBox();
  await page.mouse.click(box.x + 5, box.y + box.height / 2); // marge intérieure
  await expect(cart).toBeVisible();
  await page.mouse.click(2, 2); // fond assombri
  await expect(cart).toBeHidden();
});

test('filtres : état annoncé aux lecteurs d’écran', async ({ page }) => {
  await page.goto('/');
  await page.click('[data-cat="Livres"]');
  await expect(page.locator('[data-cat="Livres"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-cat="Tout"]')).toHaveAttribute('aria-pressed', 'false');
});

test('menu mobile : ouvre, mène à la section, se referme', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'menu compact uniquement sur mobile');
  await page.goto('/');
  const menu = page.locator('#menuBtn');
  const links = page.locator('#navLinks');
  await expect(menu).toBeVisible();
  await expect(links).toBeHidden();
  await menu.click();
  await expect(menu).toHaveAttribute('aria-expanded', 'true');
  await expect(links).toBeVisible();
  await page.locator('#navLinks a[href="#livraison"]').click();
  await expect(links).toBeHidden();
  await expect(menu).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('#livraison h2')).toBeInViewport();
  // Le panier reste accessible en haut de l’écran
  await expect(page.locator('#cartBtn')).toBeInViewport();
});

test('desktop : liens visibles, pas de bouton Menu', async ({ page, isMobile }) => {
  test.skip(isMobile, 'ordinateur uniquement');
  await page.goto('/');
  await expect(page.locator('#menuBtn')).toBeHidden();
  await expect(page.locator('#navLinks a')).toHaveCount(3);
  await expect(page.locator('#navLinks a').first()).toBeVisible();
});

test('après envoi WhatsApp : proposer de vider le panier', async ({ page }) => {
  await page.goto('/');
  await page.click('[data-add="3"]');
  await page.click('#cartBtn');
  await page.click('#checkoutBtn');
  await page.fill('#name', 'Client Test');
  await page.fill('#phone', '+237 600 00 00 00');
  await page.fill('#area', 'Melen');
  await page.fill('#address', 'Face école');
  await page.check('#consent');
  await page.click('#orderForm button[type="submit"]');

  await expect(page.locator('#afterSend')).toBeHidden();
  // Empêche l’ouverture réelle de WhatsApp pendant le test
  await page.locator('#whatsapp').evaluate((a) => a.addEventListener('click', (e) => e.preventDefault()));
  await page.click('#whatsapp');
  await expect(page.locator('#afterSend')).toBeVisible();
  await page.click('#clearAfterSend');
  await expect(page.locator('#checkout')).toBeHidden();
  await expect(page.locator('#count')).toHaveText('0');
  await page.reload();
  await expect(page.locator('#count')).toHaveText('0');
});
