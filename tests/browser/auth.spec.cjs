// Connexion et rôles (développement) : l'API /auth et /users est simulée en mémoire.
const { test, expect } = require('@playwright/test');

const ADMIN = { id: 1, email: 'admin@exemple.cm', role: 'admin', created_at: '2026-10-19T08:00:00' };

test.beforeEach(async ({ page }) => {
  const users = new Map([[1, { ...ADMIN, password: 'admin-123' }]]);
  const tokens = new Map(); // jeton → id
  let nextId = 2;
  page.on('pageerror', (e) => { throw e; });
  const json = (route, status, body) =>
    route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
  const publicUser = ({ password, ...u }) => u;
  const session = (route, user) => {
    const token = `jeton-${user.id}-${tokens.size}`;
    tokens.set(token, user.id);
    return json(route, route.request().url().endsWith('/register') ? 201 : 200, { token, user: publicUser(user) });
  };
  const current = (req) => users.get(tokens.get((req.headers().authorization || '').replace('Bearer ', '')));

  await page.route(/\/(auth|users)\//, async (route) => {
    const req = route.request();
    const path = new URL(req.url()).pathname;
    const body = req.postDataJSON?.() ?? null;
    if (path === '/auth/register') {
      if ([...users.values()].some((u) => u.email === body.email)) return json(route, 409, { detail: 'taken' });
      const user = { id: nextId++, email: body.email, role: 'user', created_at: '2026-10-19T09:00:00', password: body.password };
      users.set(user.id, user);
      return session(route, user);
    }
    if (path === '/auth/login') {
      const user = [...users.values()].find((u) => u.email === body.email && u.password === body.password);
      return user ? session(route, user) : json(route, 401, { detail: 'Invalid e-mail or password' });
    }
    const user = current(req);
    if (!user) return json(route, 401, { detail: 'Not authenticated' });
    if (path === '/auth/me') return json(route, 200, publicUser(user));
    if (path === '/auth/logout') return route.fulfill({ status: 204 });
    if (user.role !== 'admin') return json(route, 403, { detail: 'Administrator access required' });
    if (path === '/users/') return json(route, 200, [...users.values()].map(publicUser));
    const id = Number(path.split('/')[2]);
    users.get(id).role = body.role;
    return json(route, 200, publicUser(users.get(id)));
  });
  await page.route(/\/products\/$/, (route) => json(route, 200, []));
});

test('créer un compte client, se déconnecter, se reconnecter', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Connexion', exact: true }).click();
  await page.getByRole('link', { name: /Créer un compte/ }).click();
  await page.getByLabel('E-mail').fill('awa@exemple.cm');
  await page.getByLabel('Mot de passe', { exact: false }).first().fill('court');
  await page.getByLabel('Confirmer le mot de passe').fill('autre');
  await page.getByRole('button', { name: 'Créer mon compte' }).click();
  await expect(page.getByText('8 caractères minimum.')).toBeVisible();
  await expect(page.getByText('Les mots de passe ne correspondent pas.')).toBeVisible();

  await page.getByLabel('Mot de passe', { exact: false }).first().fill('motdepasse');
  await page.getByLabel('Confirmer le mot de passe').fill('motdepasse');
  await page.getByRole('button', { name: 'Créer mon compte' }).click();
  await expect(page).toHaveURL(/\/compte$/);
  await expect(page.getByText('Connecté en tant que awa@exemple.cm')).toBeVisible();
  await expect(page.getByText('Client', { exact: true })).toBeVisible();
  // Un client ne voit pas la gestion
  await expect(page.getByRole('link', { name: 'Gestion', exact: true })).toHaveCount(0);

  await page.getByRole('button', { name: 'Se déconnecter' }).click();
  await expect(page.getByRole('link', { name: 'Connexion', exact: true })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('centre-auth-token'))).toBeNull();

  await page.goto('/connexion');
  await page.getByLabel('E-mail').fill('awa@exemple.cm');
  await page.getByLabel('Mot de passe').fill('mauvais-mdp');
  await page.getByRole('button', { name: 'Se connecter' }).click();
  await expect(page.getByText('E-mail ou mot de passe incorrect.')).toBeVisible();
  await page.getByLabel('Mot de passe').fill('motdepasse');
  await page.getByRole('button', { name: 'Se connecter' }).click();
  await expect(page.getByText('Connecté en tant que awa@exemple.cm')).toBeVisible();
});

test('e-mail déjà utilisé', async ({ page }) => {
  await page.goto('/inscription');
  await page.getByLabel('E-mail').fill('admin@exemple.cm');
  await page.getByLabel('Mot de passe', { exact: false }).first().fill('motdepasse');
  await page.getByLabel('Confirmer le mot de passe').fill('motdepasse');
  await page.getByRole('button', { name: 'Créer mon compte' }).click();
  await expect(page.getByText('Un compte existe déjà pour cet e-mail.')).toBeVisible();
});

test('la gestion demande une connexion puis y revient', async ({ page }) => {
  await page.goto('/gestion');
  await expect(page).toHaveURL(/\/connexion\?suite=%2Fgestion$/);
  await page.getByLabel('E-mail').fill('admin@exemple.cm');
  await page.getByLabel('Mot de passe').fill('admin-123');
  await page.getByRole('button', { name: 'Se connecter' }).click();
  await expect(page).toHaveURL(/\/gestion$/);
  await expect(page.getByRole('heading', { name: 'Gestion des articles' })).toBeVisible();
});

test('un client connecté n’a pas accès à la gestion', async ({ page }) => {
  await page.goto('/inscription');
  await page.getByLabel('E-mail').fill('client@exemple.cm');
  await page.getByLabel('Mot de passe', { exact: false }).first().fill('motdepasse');
  await page.getByLabel('Confirmer le mot de passe').fill('motdepasse');
  await page.getByRole('button', { name: 'Créer mon compte' }).click();
  await expect(page).toHaveURL(/\/compte$/);
  await page.goto('/gestion');
  await expect(page.getByRole('heading', { name: 'Accès réservé' })).toBeVisible();
});

test('un administrateur promeut un client', async ({ page }) => {
  // Un client s'inscrit…
  await page.goto('/inscription');
  await page.getByLabel('E-mail').fill('awa@exemple.cm');
  await page.getByLabel('Mot de passe', { exact: false }).first().fill('motdepasse');
  await page.getByLabel('Confirmer le mot de passe').fill('motdepasse');
  await page.getByRole('button', { name: 'Créer mon compte' }).click();
  await page.getByRole('button', { name: 'Se déconnecter' }).click();
  // …l'administrateur le promeut
  await page.goto('/connexion?suite=/gestion');
  await page.getByLabel('E-mail').fill('admin@exemple.cm');
  await page.getByLabel('Mot de passe').fill('admin-123');
  await page.getByRole('button', { name: 'Se connecter' }).click();
  await page.getByRole('tab', { name: 'Utilisateurs' }).click();
  const rows = page.getByTestId('user-row');
  await expect(rows).toHaveCount(2);
  await expect(rows.first()).toContainText('admin@exemple.cm (vous)');
  await expect(rows.first().getByRole('button')).toHaveCount(0); // pas de rétrogradation de soi-même
  await rows.nth(1).getByRole('button', { name: 'Rendre administrateur' }).click();
  await expect(rows.nth(1)).toContainText('Administrateur');
  await expect(rows.nth(1).getByRole('button', { name: 'Retirer les droits' })).toBeVisible();
});

test('session expirée : retour à l’état déconnecté', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('centre-auth-token', 'jeton-perime'));
  await page.goto('/compte');
  await expect(page).toHaveURL(/\/connexion/);
  expect(await page.evaluate(() => localStorage.getItem('centre-auth-token'))).toBeNull();
});
