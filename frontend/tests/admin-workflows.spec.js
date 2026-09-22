import { test, expect } from '@playwright/test';
import path from 'node:path';
const team = { teamId: 1000, teamName: 'Star Rangers', leaderName: 'Avery', totalPoints: 35 };
const game = { _id: 'game1', gameName: 'Memory Maze', gamePoints: 20 };
const reply = (route, data, status = 200, message = 'Success') => route.fulfill({ status, json: { data, message } });

test('games navigation creates a game with admin authorization and makes it available for scoring', async ({ page }) => {
  const games = [game];
  await page.route('**/api/games', route => {
    if (route.request().method() === 'POST') {
      expect(route.request().headers().authorization).toBe('Bearer organizer-token');
      expect(route.request().postDataJSON()).toEqual({ gameName: 'Treasure Hunt', gamePoints: 100, description: 'Find clues' });
      const created = { _id: 'game2', ...route.request().postDataJSON() };
      games.push(created);
      return reply(route, created, 201);
    }
    return reply(route, games);
  });
  await page.goto('/admin/games');
  await expect(page.getByRole('link', { name: 'Games', exact: true })).toHaveAttribute('aria-current', 'page');
  await page.getByLabel('Game name', { exact: true }).fill('Treasure Hunt');
  await page.getByLabel('Points per completion').fill('100');
  await page.getByLabel('Description (optional)').fill('Find clues');
  await page.getByRole('button', { name: 'Create game', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Treasure Hunt created');
  await expect(page.getByRole('row').filter({ hasText: 'Treasure Hunt' })).toContainText('100');
  await expect(page.getByLabel('Game name', { exact: true })).toHaveValue('');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: 'test-results/games-mobile.png', fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
  await page.getByRole('link', { name: 'Scoring / QR', exact: true }).click();
  await page.getByLabel('Game', { exact: true }).selectOption('game2');
});

test('game creation preserves inputs on duplicate name and handles expired sessions', async ({ page }) => {
  let expired = false;
  await page.route('**/api/games', route => route.request().method() === 'POST'
    ? reply(route, null, expired ? 401 : 409, expired ? 'Token expired' : 'Game already exists')
    : reply(route, [game]));
  await page.goto('/admin/games');
  await page.getByLabel('Game name', { exact: true }).fill('Memory Maze');
  await page.getByLabel('Points per completion').fill('20');
  await page.getByRole('button', { name: 'Create game', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveText('Game already exists');
  await expect(page.getByLabel('Game name', { exact: true })).toHaveValue('Memory Maze');
  expired = true;
  await page.getByRole('button', { name: 'Create game', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Session expired' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Create game', exact: true })).toHaveCount(0);
});
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('celestia.admin', JSON.stringify({ token: 'organizer-token', admin: { role: 'admin' } })));
  await page.route('**/api/**', route => {
    const endpoint = new URL(route.request().url()).pathname;
    if (endpoint === '/api/admin/profile') return reply(route, { name: 'Organizer', role: 'admin' });
    if (endpoint === '/api/games') return reply(route, [game]);
    if (endpoint === '/api/participants/1000' || endpoint === '/api/points/verify-qr') return reply(route, team);
    if (endpoint.startsWith('/api/points/assign')) return reply(route, { ...team, totalPoints: 55, pointsAwarded: 20, gameCompleted: game.gameName, timesCompletedThisGame: 2 });
    return reply(route, null, 404, 'Not found');
  });
});
test('all organizer routes reject unauthenticated access', async ({ browser }) => {
  const page = await browser.newPage();
  for (const route of ['/admin/register', '/admin/scoring', '/admin/bulkupdate', '/admin/games']) {
    await page.goto(`http://127.0.0.1:5178${route}`);
    await expect(page).toHaveURL(/\/admin\/login$/);
  }
  await page.close();
});
test('server profile role controls access, not the stored role', async ({ page }) => {
  await page.route('**/api/admin/profile', route => reply(route, { name: 'Guest', role: 'participant' }));
  await page.goto('/admin/scoring');
  await expect(page.getByRole('heading', { name: 'Access denied' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Award points' })).toHaveCount(0);
});
test('registration submits all fields and reports email delivery failure without losing the team', async ({ page }) => {
  await page.route('**/api/participants/register', route => reply(route, { ...team, emailSent: false, qrCode: 'data:image/png;base64,iVBORw0KGgo=' }, 201));
  await page.goto('/admin/register');
  await page.getByLabel('Team name', { exact: true }).fill(team.teamName);
  await page.getByLabel('Leader name').fill('Avery');
  await page.getByLabel('Leader email').fill('avery@example.com');
  await page.getByLabel('Team size').fill('4');
  const request = page.waitForRequest('**/api/participants/register');
  await page.getByRole('button', { name: 'Register team', exact: true }).click();
  const sent = await request;
  expect(sent.headers().authorization).toBe('Bearer organizer-token');
  expect(sent.postDataJSON()).toEqual({ teamName: team.teamName, leaderName: 'Avery', leaderEmail: 'avery@example.com', teamSize: 4 });
  await expect(page.getByRole('heading', { name: 'Team registered' })).toBeVisible();
  await expect(page.getByRole('status')).toContainText('Email could not be delivered');
  await expect(page.getByRole('link', { name: 'Download QR code' })).toBeVisible();
});
test('manual scoring requires verification and clears the award after success', async ({ page }) => {
  await page.goto('/admin/scoring');
  await page.getByLabel('Game', { exact: true }).selectOption('game1');
  await page.getByLabel('Team ID', { exact: true }).fill('1000');
  await page.getByRole('button', { name: 'Verify team', exact: true }).click();
  await expect(page.getByText('Memory Maze: +20 points', { exact: true })).toBeVisible();
  const request = page.waitForRequest('**/api/points/assign');
  await page.getByRole('button', { name: 'Award points' }).click();
  expect((await request).postDataJSON()).toEqual({ teamId: 1000, gameId: 'game1' });
  await expect(page.getByRole('heading', { name: 'Points awarded' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Award points' })).toHaveCount(0);
  await page.screenshot({ path: 'test-results/scoring.png', fullPage: true });
});
test('real QR image decoding verifies the team then uses the QR award endpoint', async ({ page }) => {
  await page.goto('/admin/scoring');
  await page.getByLabel('Game', { exact: true }).selectOption('game1');
  await page.getByRole('button', { name: 'Scan QR code', exact: true }).click();
  await page.getByText('Scan an Image File', { exact: false }).click();
  const verification = page.waitForRequest('**/api/points/verify-qr');
  await page.locator('.qr-scanner input[type=file]').setInputFiles(path.resolve('tests/fixtures/team-1000.png'));
  expect(JSON.parse((await verification).postDataJSON().qrData)).toEqual({ teamId: 1000 });
  const award = page.waitForRequest('**/api/points/assign-by-qr');
  await page.getByRole('button', { name: 'Award points' }).click();
  expect((await award).postDataJSON()).toEqual({ qrData: JSON.stringify({ teamId: 1000 }), gameId: 'game1' });
  await expect(page.getByRole('heading', { name: 'Points awarded' })).toBeVisible();
});
test('bulk partial success removes successful rows and preserves failed rows', async ({ page }) => {
  await page.route('**/api/admin/bulk-update-points', route => reply(route, { successful: [{ teamId: 1000, teamName: team.teamName, previousPoints: 35, newTotalPoints: 45 }], failed: [{ teamId: 1001, reason: 'Insufficient points' }] }, 207));
  await page.goto('/admin/bulkupdate');
  await page.getByLabel('Team ID 1', { exact: true }).fill('1000');
  await page.getByLabel('Points change 1').fill('10');
  await page.getByRole('button', { name: 'Add team', exact: true }).click();
  await page.getByLabel('Team ID 2', { exact: true }).fill('1001');
  await page.getByLabel('Points change 2').fill('-50');
  const request = page.waitForRequest('**/api/admin/bulk-update-points');
  await page.getByRole('button', { name: 'Submit scores' }).click();
  expect((await request).postDataJSON().updates).toEqual([{ teamId: 1000, scoreToAdd: 10, reason: '' }, { teamId: 1001, scoreToAdd: -50, reason: '' }]);
  await expect(page.getByRole('status')).toHaveText('1 succeeded · 1 failed');
  await expect(page.getByLabel('Team ID 1', { exact: true })).toHaveValue('1001');
  await expect(page.getByText('Team #1001: Insufficient points')).toBeVisible();
  await page.screenshot({ path: 'test-results/bulk-scoring.png', fullPage: true });
});
test('bulk all-failed response retains per-team reasons on HTTP 400', async ({ page }) => {
  await page.route('**/api/admin/bulk-update-points', route => reply(route, { successful: [], failed: [{ teamId: 9999, reason: 'Team not found' }] }, 400));
  await page.goto('/admin/bulkupdate');
  await page.getByLabel('Team ID 1', { exact: true }).fill('9999');
  await page.getByLabel('Points change 1').fill('10');
  await page.getByRole('button', { name: 'Submit scores' }).click();
  await expect(page.getByRole('status')).toHaveText('0 succeeded · 1 failed');
  await expect(page.getByText('Team #9999: Team not found')).toBeVisible();
});
test('expired token during a write hides organizer forms', async ({ page }) => {
  await page.route('**/api/admin/bulk-update-points', route => reply(route, null, 401, 'Token expired'));
  await page.goto('/admin/bulkupdate');
  await page.getByLabel('Team ID 1', { exact: true }).fill('1000');
  await page.getByLabel('Points change 1').fill('10');
  await page.getByRole('button', { name: 'Submit scores' }).click();
  await expect(page.getByRole('heading', { name: 'Session expired' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Submit scores' })).toHaveCount(0);
});

test('registration with deferred email shows pending delivery and a downloadable QR', async ({ page }) => {
  await page.route('**/api/participants/register', route => reply(route, { ...team, emailSent: false, emailStatus: 'pending', qrCode: 'data:image/png;base64,iVBORw0KGgo=' }, 201));
  await page.goto('/admin/register');
  await page.getByLabel('Team name', { exact: true }).fill(team.teamName);
  await page.getByLabel('Leader name').fill('Avery');
  await page.getByLabel('Leader email').fill('avery@example.com');
  await page.getByLabel('Team size').fill('4');
  await page.getByRole('button', { name: 'Register team', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Your QR email is awaiting delivery');
  await expect(page.getByRole('link', { name: 'Download QR code' })).toBeVisible();
});
