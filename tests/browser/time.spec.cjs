// Pointage des employés (développement) : l'API /time/… est simulée en mémoire, comme dans admin.spec.cjs.
const { test, expect } = require('@playwright/test');

const EMPLOYEE = { id: 2, email: 'awa@exemple.cm', role: 'employee', created_at: '2026-10-19T08:00:00', is_active: true };
const ADMIN = { id: 1, email: 'admin@exemple.cm', role: 'admin', created_at: '2026-10-19T08:00:00', is_active: true };
const MANAGER = { id: 3, email: 'resp@exemple.cm', role: 'manager', created_at: '2026-10-19T08:00:00', is_active: true };

// Simule l'API pour `me` ; `entries` est partagé, l'heure vient du « serveur » (Date du navigateur)
async function mockApi(page, me, entries) {
  let nextId = entries.length + 1;
  page.on('pageerror', (e) => { throw e; });
  await page.addInitScript(() => localStorage.setItem('centre-auth-token', 'jeton'));
  const json = (route, status, body) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
  await page.route('**/auth/me', (route) => json(route, 200, me));
  await page.route(/\/time\//, async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const open = () => entries.find((e) => e.user_id === me.id && !e.ended_at) ?? null;
    const inRange = (e) => e.started_at >= url.searchParams.get('start') && e.started_at < url.searchParams.get('end');
    if (url.pathname.endsWith('/time/staff')) return json(route, 200, [ADMIN, EMPLOYEE, MANAGER]);
    if (url.pathname.endsWith('/me/current')) return json(route, 200, open());
    if (url.pathname.endsWith('/me/clock-in')) {
      if (open()) return json(route, 409, { detail: 'Already clocked in' });
      const e = { id: nextId++, user_id: me.id, user_email: me.email, started_at: new Date().toISOString(), ended_at: null, edited_at: null, edited_by_id: null };
      entries.push(e);
      return json(route, 201, e);
    }
    if (url.pathname.endsWith('/me/clock-out')) {
      const e = open();
      if (!e) return json(route, 409, { detail: 'Not clocked in' });
      e.ended_at = new Date().toISOString();
      return json(route, 200, e);
    }
    if (url.pathname.endsWith('/me/entries')) return json(route, 200, entries.filter((e) => e.user_id === me.id && inRange(e)));
    if (url.pathname.endsWith('/time/entries')) return json(route, 200, entries.filter(inRange));
    const id = Number(url.pathname.split('/').pop());
    const e = entries.find((x) => x.id === id);
    if (req.method() === 'PUT') {
      Object.assign(e, req.postDataJSON(), { edited_at: new Date().toISOString(), edited_by_id: me.id });
      return json(route, 200, e);
    }
    entries.splice(entries.indexOf(e), 1);
    return route.fulfill({ status: 204 });
  });
}

// Pointage d'aujourd'hui à heure locale fixe
const todayAt = (h, m = 0) => { const d = new Date(); d.setHours(h, m, 0, 0); return d.toISOString(); };
const entry = (id, user, start, end) => ({ id, user_id: user.id, user_email: user.email, started_at: start, ended_at: end, edited_at: null, edited_by_id: null });

test('un employé pointe son entrée puis sa sortie', async ({ page }) => {
  const entries = [entry(1, EMPLOYEE, todayAt(0, 5), todayAt(0, 35))]; // 30 min déjà faites
  await mockApi(page, EMPLOYEE, entries);
  await page.goto('/compte');
  const clock = page.getByTestId('time-clock');
  await expect(clock).toContainText('Non pointé');
  await expect(page.getByTestId('total-day')).toHaveText('0 h 30');

  await clock.getByRole('button', { name: 'Pointer mon entrée' }).click();
  await expect(clock).toContainText('Présent depuis');
  await clock.getByRole('button', { name: 'Pointer ma sortie' }).click();
  await expect(clock).toContainText('Non pointé');
  expect(entries).toHaveLength(2);
  expect(entries[1].ended_at).not.toBeNull();
});

test('un client ne voit pas le pointage', async ({ page }) => {
  await mockApi(page, { ...EMPLOYEE, role: 'user' }, []);
  await page.goto('/compte');
  await expect(page.getByText('Connecté en tant que')).toBeVisible();
  await expect(page.getByTestId('time-clock')).toHaveCount(0);
});

test('le gérant voit les totaux et corrige un pointage', async ({ page }) => {
  // Deux passages aujourd'hui (pause entre les deux) : 3 h 00 + 1 h 30
  const entries = [
    entry(1, EMPLOYEE, todayAt(0, 0), todayAt(3, 0)),
    entry(2, EMPLOYEE, todayAt(4, 0), todayAt(5, 30)),
  ];
  await mockApi(page, ADMIN, entries);
  await page.goto('/gestion');
  await page.getByRole('tab', { name: 'Heures' }).click();
  await page.getByRole('button', { name: "Aujourd'hui" }).click();

  const awa = page.getByTestId('hours-row').filter({ hasText: 'awa@exemple.cm' });
  await expect(awa).toContainText('4 h 30');
  await expect(page.getByTestId('entry-row')).toHaveCount(2);

  await page.getByRole('button', { name: /Corriger le pointage de awa@exemple.cm/ }).last().click();
  const out = page.getByLabel('Sortie');
  const value = await out.inputValue();
  await out.fill(value.replace(/T\d\d:\d\d$/, 'T06:00'));
  await page.getByRole('button', { name: 'Enregistrer' }).click();
  await expect(awa).toContainText('5 h 00');
  await expect(page.getByTestId('entry-row').last()).toContainText('corrigé');
});

test('le responsable voit les commandes et les heures, et ne corrige pas les siennes', async ({ page }) => {
  const entries = [
    entry(1, EMPLOYEE, todayAt(0, 0), todayAt(2, 0)),
    entry(2, MANAGER, todayAt(0, 0), todayAt(1, 0)),
  ];
  await mockApi(page, MANAGER, entries);
  await page.route(/\/orders\/$/, (route) => route.fulfill({ contentType: 'application/json', body: '[]' }));
  await page.goto('/gestion');
  await expect(page.getByRole('heading', { name: 'Gestion', exact: true })).toBeVisible();
  // Ni articles ni utilisateurs ; les commandes s'ouvrent d'abord
  await expect(page.getByRole('tab')).toHaveText(['Commandes', 'Heures']);
  await expect(page.getByRole('tab', { name: 'Commandes' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByText('Aucune commande ici.')).toBeVisible();
  await page.getByRole('tab', { name: 'Heures' }).click();
  await page.getByRole('button', { name: "Aujourd'hui" }).click();
  await expect(page.getByTestId('entry-row')).toHaveCount(2);
  await expect(page.getByRole('button', { name: /Corriger le pointage de awa@exemple.cm/ })).toHaveCount(1);
  await expect(page.getByRole('button', { name: /Corriger le pointage de resp@exemple.cm/ })).toHaveCount(0);
  await expect(page.getByTestId('hours-row').filter({ hasText: 'resp@exemple.cm' })).toContainText('1 h 00');
});
