// Connexion et rôles (développement) : l'API /auth et /users est simulée en mémoire.
const { test, expect } = require('@playwright/test');

const ADMIN = { id: 1, email: 'admin@exemple.cm', role: 'admin', created_at: '2026-10-19T08:00:00', is_active: true, last_login_at: null };
const LOGIN_TIME = '2026-10-25T11:40:00Z';

test.beforeEach(async ({ page }) => {
  const users = new Map([[1, { ...ADMIN, password: 'admin-123' }]]);
  const tokens = new Map(); // jeton → id
  let nextId = 2;
  page.on('pageerror', (e) => { throw e; });
  const json = (route, status, body) =>
    route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
  // /auth/* ne renvoie pas last_login_at, seule la liste /users/ (administrateurs) le donne
  const publicUser = ({ password, last_login_at, ...u }) => u;
  const adminUser = ({ password, ...u }) => u;
  const session = (route, user) => {
    const token = `jeton-${user.id}-${tokens.size}`;
    user.last_login_at = LOGIN_TIME;
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
      const user = { id: nextId++, email: body.email, role: 'user', created_at: '2026-10-19T09:00:00', is_active: true, password: body.password };
      users.set(user.id, user);
      return session(route, user);
    }
    if (path === '/auth/login') {
      const user = [...users.values()].find((u) => u.email === body.email && u.password === body.password);
      if (!user) return json(route, 401, { detail: 'Invalid e-mail or password' });
      return user.is_active ? session(route, user) : json(route, 403, { detail: 'This account is blocked' });
    }
    const user = current(req);
    if (!user) return json(route, 401, { detail: 'Not authenticated' });
    if (path === '/auth/me') return json(route, 200, publicUser(user));
    if (path === '/auth/logout') return route.fulfill({ status: 204 });
    if (user.role !== 'admin') return json(route, 403, { detail: 'Administrator access required' });
    if (path === '/users/') return json(route, 200, [...users.values()].map(adminUser));
    const id = Number(path.split('/')[2]);
    if (req.method() === 'DELETE') {
      if (users.get(id).hasHours) return json(route, 409, { detail: 'This account has recorded hours and cannot be deleted; block it instead' });
      users.delete(id);
      return route.fulfill({ status: 204 });
    }
    if (path.endsWith('/active')) users.get(id).is_active = body.active;
    else users.get(id).role = body.role;
    return json(route, 200, adminUser(users.get(id)));
  });
  await page.route(/\/products\/$/, (route) => json(route, 200, []));
  // Mes commandes : l'API filtre sur le jeton ; ici, celles de l'utilisateur 2 (premier compte créé)
  await page.route(/\/orders\/mine$/, (route) => {
    const user = current(route.request());
    if (!user) return json(route, 401, { detail: 'Not authenticated' });
    return json(route, 200, user.id === 2 ? MY_ORDERS : []);
  });
});

const MY_ORDERS = [
  {
    id: 41, kind: 'order', customer_name: 'Awa', phone: '+237 690 00 00 00', status: 'confirmed', total: 3500,
    delivery_fee: 1000, area: 'Bastos', address: 'Près de l\'ambassade', slot: 'morning', payment: 'cash',
    notes: 'Référence : LC-2610-4821\nSonner deux fois', created_at: '2026-10-26T09:00:00Z', status_changed_at: null,
    items: [{ id: 1, product_id: 7, product_name: 'Cahier 200 pages', quantity: 5, unit_price: 700, line_total: 3500 }],
  },
  {
    id: 12, kind: 'quote', customer_name: 'Awa', phone: '+237 690 00 00 00', status: 'new', total: 0,
    delivery_fee: null, area: null, address: null, slot: null, payment: null, notes: null,
    created_at: '2026-10-20T09:00:00Z', status_changed_at: null, items: [],
  },
];

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

test('un administrateur change le rôle d’un client', async ({ page }) => {
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
  await expect(rows.first().getByRole('combobox')).toHaveCount(0); // pas de rétrogradation de soi-même
  await rows.nth(1).getByRole('combobox', { name: 'Rôle' }).click();
  await page.getByRole('option', { name: 'Employé' }).click();
  await expect(rows.nth(1).getByText('Employé', { exact: true }).first()).toBeVisible();
  await rows.nth(1).getByRole('combobox', { name: 'Rôle' }).click();
  await page.getByRole('option', { name: 'Administrateur' }).click();
  await expect(rows.nth(1).locator('.MuiChip-root')).toHaveText('Administrateur');
});

test.describe('dernière connexion', () => {
  test.use({ timezoneId: 'Africa/Douala' });

  test('l’administrateur voit la dernière connexion de chaque compte, à l’heure de Yaoundé', async ({ page }) => {
    await page.goto('/connexion?suite=/gestion');
    await page.getByLabel('E-mail').fill('admin@exemple.cm');
    await page.getByLabel('Mot de passe').fill('admin-123');
    await page.getByRole('button', { name: 'Se connecter' }).click();
    // Un compte créé avant le suivi n'a pas encore de date
    await page.route(/\/users\/$/, (route) => route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify([
        { ...ADMIN, last_login_at: LOGIN_TIME },
        { id: 2, email: 'ancien@exemple.cm', role: 'user', created_at: '2026-10-01T08:00:00', is_active: true, last_login_at: null },
      ]),
    }));
    await page.getByRole('tab', { name: 'Utilisateurs' }).click();
    const rows = page.getByTestId('user-row');
    await expect(rows.first()).toContainText('Dernière connexion : 25/10/2026 12:40');
    await expect(rows.nth(1)).toContainText('Dernière connexion : pas encore enregistrée');
  });
});

test('session expirée : retour à l’état déconnecté', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('centre-auth-token', 'jeton-perime'));
  await page.goto('/compte');
  await expect(page).toHaveURL(/\/connexion/);
  expect(await page.evaluate(() => localStorage.getItem('centre-auth-token'))).toBeNull();
});

test('un administrateur bloque puis supprime un compte', async ({ page }) => {
  await page.goto('/inscription');
  await page.getByLabel('E-mail').fill('bob@exemple.cm');
  await page.getByLabel('Mot de passe', { exact: false }).first().fill('motdepasse');
  await page.getByLabel('Confirmer le mot de passe').fill('motdepasse');
  await page.getByRole('button', { name: 'Créer mon compte' }).click();
  await page.getByRole('button', { name: 'Se déconnecter' }).click();

  await page.goto('/connexion?suite=/gestion');
  await page.getByLabel('E-mail').fill('admin@exemple.cm');
  await page.getByLabel('Mot de passe').fill('admin-123');
  await page.getByRole('button', { name: 'Se connecter' }).click();
  await page.getByRole('tab', { name: 'Utilisateurs' }).click();
  const bob = page.getByTestId('user-row').filter({ hasText: 'bob@exemple.cm' });
  await bob.getByRole('button', { name: 'Bloquer' }).click();
  await expect(bob).toContainText('Bloqué');
  await expect(bob.getByRole('button', { name: 'Débloquer' })).toBeVisible();

  // Le compte bloqué ne peut plus se connecter
  await page.evaluate(() => localStorage.clear());
  await page.goto('/connexion');
  await page.getByLabel('E-mail').fill('bob@exemple.cm');
  await page.getByLabel('Mot de passe').fill('motdepasse');
  await page.getByRole('button', { name: 'Se connecter' }).click();
  await expect(page.getByText('Ce compte est bloqué. Contactez la librairie.')).toBeVisible();

  // Suppression avec confirmation
  await page.getByLabel('E-mail').fill('admin@exemple.cm');
  await page.getByLabel('Mot de passe').fill('admin-123');
  await page.getByRole('button', { name: 'Se connecter' }).click();
  await page.goto('/gestion');
  await page.getByRole('tab', { name: 'Utilisateurs' }).click();
  await page.getByRole('button', { name: 'Supprimer bob@exemple.cm' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Supprimer' }).click();
  await expect(page.getByTestId('user-row')).toHaveCount(1);
});

test('inscription refusée par la limite de l’API : message clair', async ({ page }) => {
  await page.route(/\/auth\/register$/, (route) => route.fulfill({ status: 429, contentType: 'application/json', body: '{"detail":"Too many failed attempts; try again in a few minutes"}' }));
  await page.goto('/inscription');
  await page.getByLabel('E-mail').fill('nouveau@exemple.cm');
  await page.getByLabel('Mot de passe', { exact: false }).first().fill('motdepasse');
  await page.getByLabel('Confirmer le mot de passe').fill('motdepasse');
  await page.getByRole('button', { name: 'Créer mon compte' }).click();
  await expect(page.getByText('Trop de comptes ont été créés récemment')).toBeVisible();
});

test('serveur en veille : après 15 s sans réponse, nouvel essai automatique sans recliquer', async ({ page }) => {
  await page.clock.install();
  let first = true;
  // Premier essai : l'API ne répond jamais (serveur en train de démarrer)
  await page.route(/\/auth\/login$/, (route) => {
    if (!first) return route.fallback();
    first = false;
  });
  await page.goto('/connexion');
  await page.getByLabel('E-mail').fill(ADMIN.email);
  await page.getByLabel('Mot de passe').fill('admin-123');
  await page.getByRole('button', { name: 'Se connecter' }).click();
  await expect(page.getByText('Connexion au serveur…')).toBeVisible();
  await page.clock.runFor(15_000);
  await expect(page.getByText(`Connecté en tant que ${ADMIN.email}`)).toBeVisible();
  // Aucune erreur affichée pendant le réveil
  await expect(page.getByText('Le serveur ne répond toujours pas')).toHaveCount(0);
});

test('serveur en veille : message d’attente pendant les essais, erreur et « Réessayer » après une minute', async ({ page }) => {
  await page.clock.install();
  let calls = 0;
  await page.route(/\/auth\/login$/, (route) => {
    calls += 1;
    if (calls > 4) return route.fallback();
  });
  await page.goto('/connexion');
  await page.getByLabel('E-mail').fill(ADMIN.email);
  await page.getByLabel('Mot de passe').fill('admin-123');
  await page.getByRole('button', { name: 'Se connecter' }).click();
  await page.clock.runFor(15_000);
  await expect(page.getByRole('status').filter({ hasText: 'Nouvel essai automatique, 2 sur 4' })).toBeVisible();
  await page.clock.runFor(45_000);
  await expect(page.getByText('Le serveur ne répond toujours pas après une minute')).toBeVisible();
  expect(calls).toBe(4);
  await page.getByRole('button', { name: 'Réessayer' }).click();
  await expect(page.getByText(`Connecté en tant que ${ADMIN.email}`)).toBeVisible();
});

test('serveur en veille à l’inscription : compte créé par l’essai perdu (409), connexion automatique', async ({ page }) => {
  await page.clock.install();
  let first = true;
  // Le premier essai n'obtient pas de réponse ; l'adresse existe déjà au deuxième (créée par le premier)
  await page.route(/\/auth\/register$/, (route) => {
    if (!first) return route.fallback();
    first = false;
  });
  await page.goto('/inscription');
  await page.getByLabel('E-mail').fill(ADMIN.email);
  await page.getByLabel('Mot de passe', { exact: false }).first().fill('admin-123');
  await page.getByLabel('Confirmer le mot de passe').fill('admin-123');
  await page.getByRole('button', { name: 'Créer mon compte' }).click();
  await page.clock.runFor(15_000);
  await expect(page.getByText(`Connecté en tant que ${ADMIN.email}`)).toBeVisible();
  await expect(page.getByText('déjà utilisée')).toHaveCount(0);
});

test('bouton « Votre compte » en haut : connexion si déconnecté, page du compte si connecté', async ({ page }) => {
  await page.goto('/');
  const banner = page.getByRole('banner');
  await banner.getByRole('link', { name: 'Votre compte' }).click();
  await expect(page).toHaveURL(/\/connexion$/);
  await page.getByLabel('E-mail').fill('admin@exemple.cm');
  await page.getByLabel('Mot de passe').fill('admin-123');
  await page.getByRole('button', { name: 'Se connecter' }).click();
  await expect(page).toHaveURL(/\/compte$/);
  await page.goto('/');
  await banner.getByRole('link', { name: 'Votre compte' }).click();
  await expect(page).toHaveURL(/\/compte$/);
});

test('le client retrouve ses commandes dans Mon compte', async ({ page }) => {
  await page.goto('/inscription');
  await page.getByLabel('E-mail').fill('awa@exemple.cm');
  await page.getByLabel('Mot de passe', { exact: false }).first().fill('motdepasse');
  await page.getByLabel('Confirmer le mot de passe').fill('motdepasse');
  await page.getByRole('button', { name: 'Créer mon compte' }).click();
  await expect(page).toHaveURL(/\/compte$/);

  await expect(page.getByRole('heading', { name: 'Mes commandes' })).toBeVisible();
  const rows = page.getByTestId('my-order');
  await expect(rows).toHaveCount(2);
  await expect(rows.first()).toContainText('Commande LC-2610-4821');
  await expect(rows.first()).toContainText('Envoyée le 26/10/2026');
  await expect(rows.first()).toContainText('4 500 FCFA');
  await expect(rows.first()).toContainText('Confirmée');
  await expect(rows.nth(1)).toContainText('Devis N° 12');
  await expect(rows.nth(1)).toContainText('Envoyé le 20/10/2026');
  await expect(rows.nth(1)).toContainText('En attente de confirmation');

  await rows.first().getByRole('button', { name: 'Détails' }).click();
  await expect(rows.first()).toContainText('5 × Cahier 200 pages');
  await expect(rows.first()).toContainText('Bastos, Près de l\'ambassade');
  // La référence n'est pas répétée dans les remarques
  await expect(rows.first().getByText('Sonner deux fois')).toBeVisible();
  await expect(rows.first().getByText(/Référence :/)).toHaveCount(0);
});

test('un compte sans commande voit pourquoi la liste est vide, sans renvoi au catalogue', async ({ page }) => {
  await page.goto('/connexion');
  await page.getByLabel('E-mail').fill('admin@exemple.cm');
  await page.getByLabel('Mot de passe').fill('admin-123');
  await page.getByRole('button', { name: 'Se connecter' }).click();
  await expect(page).toHaveURL(/\/compte$/);
  await expect(page.getByText('Aucune commande enregistrée sur ce compte', { exact: false })).toBeVisible();
  await expect(page.getByRole('main').getByRole('link', { name: /catalogue/i })).toHaveCount(0);
});
