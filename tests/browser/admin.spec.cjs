// Gestion des articles (développement) : l'API est simulée en mémoire, la vraie API n'est pas touchée.
const { test, expect } = require('@playwright/test');

const article = (id, name, extra = {}) => ({
  id, category: 'Scolaire', price: 1500, name, description: 'Desc.', label: null, name_en: null,
  description_en: null, label_en: null, color: null, available: true, status: null, image: null, stock: 3, ...extra
});

test.beforeEach(async ({ page }) => {
  const db = new Map([[1, article(1, 'Cahier A4')], [2, article(2, 'Stylo bleu', { price: 500 })]]);
  let nextId = 3;
  page.on('pageerror', (e) => { throw e; });
  await page.route(/\/products\/(\d+)?$/, async (route) => {
    const req = route.request();
    const id = Number(new URL(req.url()).pathname.split('/')[2]);
    const json = (status, body) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
    if (req.method() === 'GET') return json(200, [...db.values()]);
    if (req.method() === 'POST') {
      const p = { ...article(nextId++, ''), ...req.postDataJSON() };
      db.set(p.id, p);
      return json(201, p);
    }
    if (!db.has(id)) return json(404, { detail: 'Product not found' });
    if (req.method() === 'PUT') {
      db.set(id, { ...db.get(id), ...req.postDataJSON() });
      return json(200, db.get(id));
    }
    db.delete(id);
    return route.fulfill({ status: 204 });
  });
});

const rows = (page) => page.getByTestId('admin-row');

test('créer, modifier et supprimer un article', async ({ page }) => {
  await page.goto('/gestion');
  await expect(rows(page)).toHaveCount(2);

  // Créer
  await page.getByRole('button', { name: 'Nouvel article' }).click();
  await page.getByLabel('Nom', { exact: false }).first().fill('Gomme blanche');
  await page.getByLabel('Prix (FCFA)').fill('250');
  await page.getByRole('button', { name: 'Enregistrer' }).click();
  await expect(rows(page)).toHaveCount(3);
  await expect(rows(page).nth(2)).toContainText('Gomme blanche');
  await expect(rows(page).nth(2)).toContainText('250 FCFA');

  // Modifier : prix vidé → « sur devis », article masqué
  await page.getByRole('button', { name: 'Modifier Stylo bleu' }).click();
  await expect(page.getByLabel('Prix (FCFA)')).toHaveValue('500');
  await page.getByLabel('Prix (FCFA)').fill('');
  await page.getByLabel('Disponible (affiché dans le catalogue)').uncheck();
  await page.getByRole('button', { name: 'Enregistrer' }).click();
  await expect(rows(page).nth(1)).toContainText('Sur devis');
  await expect(rows(page).nth(1)).toContainText('Masqué');

  // Supprimer (avec confirmation)
  await page.getByRole('button', { name: 'Supprimer Cahier A4' }).click();
  await expect(page.getByRole('dialog')).toContainText('Supprimer « Cahier A4 » ?');
  await page.getByRole('dialog').getByRole('button', { name: 'Supprimer' }).click();
  await expect(rows(page)).toHaveCount(2);
  await expect(page.getByText('Cahier A4')).toHaveCount(0);
});

test('le formulaire refuse les valeurs invalides sans appeler l’API', async ({ page }) => {
  let writes = 0;
  page.on('request', (r) => r.method() !== 'GET' && r.url().includes('/products/') && writes++);
  await page.goto('/gestion');
  await page.getByRole('button', { name: 'Nouvel article' }).click();
  await page.getByLabel('Prix (FCFA)').fill('12,5');
  await page.getByLabel('Couleur de la vignette').fill('rouge');
  await page.getByLabel('Photo').fill('https://exemple.com/a.jpg');
  await page.getByRole('button', { name: 'Enregistrer' }).click();
  await expect(page.getByText('Le nom est obligatoire.')).toBeVisible();
  await expect(page.getByText('Nombre entier supérieur à 0, ou vide.')).toBeVisible();
  await expect(page.getByText('Format #RRGGBB.')).toBeVisible();
  await expect(page.getByText(/Chemin local commençant par img\//)).toBeVisible();
  expect(writes).toBe(0);
});

test('les articles modifiés apparaissent dans le catalogue', async ({ page }) => {
  await page.goto('/gestion');
  await page.getByRole('button', { name: 'Modifier Cahier A4' }).click();
  await page.getByLabel('Disponible (affiché dans le catalogue)').uncheck();
  await page.getByRole('button', { name: 'Enregistrer' }).click();
  await expect(rows(page).first()).toContainText('Masqué');
  await page.getByRole('link', { name: 'Le catalogue', exact: true }).click();
  await expect(page.getByTestId('product-card')).toHaveCount(1);
  await expect(page.getByTestId('product-card')).toContainText('Stylo bleu');
});
