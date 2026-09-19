import { test, expect } from '@playwright/test';
import path from 'node:path';
import { parseRegistrationCsv, registrationHeaders } from '../src/lib/registrationCsv';
const reply = (route, data, status = 200, message = 'Success') => route.fulfill({ status, json: { data, message } });
const game = { _id: 'g1', gameName: 'Maze', gamePoints: 20 };
const team = { teamId: 1000, teamName: 'Test Team', leaderName: 'Avery', leaderEmail: 'avery@example.com', teamSize: 4, totalPoints: 30, qrCode: 'data:image/png;base64,iVBORw0KGgo=' };
const admins = [{ _id: 'a1', name: 'Owner', email: 'owner@example.com', role: 'admin', isActive: true }, { _id: 'a2', name: 'Helper', email: 'helper@example.com', role: 'admin', isActive: true }];
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('celestia.admin', JSON.stringify({ token: 'test-token' })));
  await page.route('**/api/**', route => {
    const url = new URL(route.request().url()).pathname;
    if (url === '/api/admin/profile') return reply(route, admins[0]);
    if (url === '/api/games') return reply(route, [game]);
    if (url === '/api/admin/all') return reply(route, admins);
    if (url === '/api/participants') return reply(route, [team]);
    if (url === '/api/points/verify-qr' || url === '/api/participants/1000') return reply(route, team);
    return reply(route, null, 404, 'Not found');
  });
});

test('edit and deactivate games use authorized PUT and DELETE with confirmation', async ({ page }) => {
  await page.route('**/api/games/g1', route => {
    expect(route.request().headers().authorization).toBe('Bearer test-token');
    if (route.request().method() === 'PUT') return reply(route, { ...game, ...route.request().postDataJSON() });
    expect(route.request().method()).toBe('DELETE');
    return reply(route, { ...game, isActive: false });
  });
  await page.goto('/admin/games');
  await page.getByRole('button', { name: 'Edit Maze', exact: true }).click();
  await page.getByLabel('Points per completion').fill('40');
  await page.getByRole('button', { name: 'Save game' }).click();
  await expect(page.getByRole('row').filter({ hasText: 'Maze' })).toContainText('40');
  await page.getByRole('button', { name: 'Deactivate Maze' }).click();
  await expect(page.getByRole('region', { name: 'Confirm game deactivation' })).toBeVisible();
  await page.getByRole('button', { name: 'Confirm deactivation' }).click();
  await expect(page.getByText('No games yet. Create your first game above.')).toBeVisible();
});

test('admin creation, activity and deactivation work without exposing a password', async ({ page }) => {
  await page.route('**/api/admin/profile', route => reply(route, { ...admins[0], role: 'superadmin' }));
  let list = admins.map(admin => ({ ...admin }));
  await page.route('**/api/admin/all', route => reply(route, list));
  await page.route('**/api/admin/create', route => {
    expect(route.request().postDataJSON()).toEqual({ name: 'New Helper', email: 'new@example.com', password: 'sample-secret-123', role: 'admin' });
    list.push({ _id: 'a3', name: 'New Helper', email: 'new@example.com', role: 'admin', isActive: true });
    return reply(route, list[2], 201);
  });
  await page.route('**/api/admin/activity-logs/a2', route => reply(route, { activityLog: [{ action: 'CREATE_GAME', description: 'Created Maze', timestamp: '2026-09-19T10:00:00Z' }] }));
  await page.route('**/api/admin/deactivate/a2', route => {
    expect(route.request().method()).toBe('PATCH');
    expect(route.request().headers().authorization).toBe('Bearer test-token');
    list[1].isActive = false; return reply(route, list[1]);
  });
  await page.goto('/admin/admins');
  await expect(page.getByRole('button', { name: 'Deactivate Owner' })).toHaveCount(0);
  await page.getByLabel('Admin name').fill('New Helper');
  await page.getByLabel('Admin email').fill('new@example.com');
  await page.getByLabel('Password', { exact: true }).fill('sample-secret-123');
  await page.getByRole('button', { name: 'Create admin', exact: true }).click();
  await expect(page.getByLabel('Password', { exact: true })).toHaveValue('');
  await expect(page.getByRole('row').filter({ hasText: 'New Helper' })).toBeVisible();
  await page.getByRole('button', { name: 'Activity for Helper', exact: true }).click();
  await expect(page.getByText('Created Maze')).toBeVisible();
  await page.getByRole('button', { name: 'Deactivate Helper', exact: true }).click();
  await page.getByRole('button', { name: 'Confirm deactivation' }).click();
  await expect(page.getByRole('row').filter({ hasText: 'helper@example.com' })).toContainText('Inactive');
});

test('regular admins can review accounts but cannot create or deactivate them', async ({ page }) => {
  await page.goto('/admin/admins');
  await expect(page.getByRole('heading', { name: 'Create admin' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Deactivate Helper', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Activity for Helper', exact: true })).toBeVisible();
});

test('team directory searches leader details and downloads stored QR', async ({ page }) => {
  await page.goto('/admin/teams');
  await page.getByLabel('Search registered teams').fill('avery@example.com');
  await expect(page.getByRole('row').filter({ hasText: 'Test Team' })).toBeVisible();
  await page.getByRole('button', { name: 'QR for #1000' }).click();
  await expect(page.getByRole('link', { name: 'Download QR code' })).toHaveAttribute('download', 'team-1000-qr.png');
  await page.getByLabel('Search registered teams').fill('not found');
  await expect(page.getByText('No matching teams.')).toBeVisible();
});

test('history displays adjustments and filters by deduction and reason', async ({ page }) => {
  await page.route('**/api/admin/history', route => reply(route, { pointsHistory: [
    { teamId: 1000, teamName: 'Test Team', gameName: 'Maze', pointsAwarded: 20, assignedBy: { adminName: 'Owner' } },
    { teamId: 1000, teamName: 'Test Team', gameId: null, gameName: 'Points deduction', pointsAwarded: -5, reason: 'Late arrival', assignedBy: { adminName: 'Helper' } },
  ] }));
  await page.goto('/admin/history');
  await expect(page.getByText('2 matching entries · Net points: 15')).toBeVisible();
  await page.getByLabel('Entry type').selectOption('deductions');
  await page.getByLabel('Search scoring history').fill('late');
  await expect(page.getByText('1 matching entries · Net points: -5')).toBeVisible();
  await expect(page.getByText('Late arrival')).toBeVisible();
});

test('CSV preview validates rows and reports partial results with QR fallback', async ({ page }) => {
  let calls = 0;
  await page.route('**/api/participants/register', route => {
    calls++;
    expect(route.request().headers().authorization).toBe('Bearer test-token');
    if (calls === 1) {
      expect(route.request().postDataJSON().teamName).toBe('Test, One');
      return reply(route, { ...team, emailSent: false }, 201);
    }
    return reply(route, null, 409, 'Email already registered');
  });
  const csv = `${registrationHeaders.join(',')}\r\n"Test, One",Avery,one@example.com,4\r\nTwo,Casey,two@example.com,2\r\nDuplicate,Avery,one@example.com,4\r\nBad,Jordan,invalid,0\r\n`;
  await page.goto('/admin/register');
  await page.getByLabel('Team CSV file').setInputFiles({ name: 'test.csv', mimeType: 'text/csv', buffer: Buffer.from(csv) });
  await expect(page.getByText('Duplicate leader email in this file')).toBeVisible();
  await page.getByRole('button', { name: 'Register 2 teams', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Download QR #1000' })).toBeVisible();
  await expect(page.getByText('Email already registered')).toBeVisible();
  expect(calls).toBe(2);
  await expect(page.getByRole('button', { name: 'Register 0 teams', exact: true })).toBeDisabled();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: 'test-results/csv-mobile.png', fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
});

test('CSV stops after ambiguous failure instead of retrying a possible registration', async ({ page }) => {
  let calls = 0;
  await page.route('**/api/participants/register', route => { calls++; return route.abort(); });
  await page.goto('/admin/register');
  await page.getByLabel('Team CSV file').setInputFiles({ name: 'test.csv', mimeType: 'text/csv', buffer: Buffer.from(`${registrationHeaders.join(',')}\nOne,Avery,one@example.com,4\nTwo,Casey,two@example.com,3`) });
  await page.getByRole('button', { name: 'Register 2 teams' }).click();
  await expect(page.getByRole('row').filter({ hasText: 'Check team directory' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Register 1 teams' })).toBeEnabled();
  expect(calls).toBe(1);
});

test('QR deductions require confirmation and submit the scanned team with positive amount', async ({ page }) => {
  let deductions = 0;
  await page.route('**/api/admin/subtract-points-qr', route => {
    deductions++;
    const body = route.request().postDataJSON();
    expect(JSON.parse(body.qrData)).toEqual({ teamId: 1000 });
    expect(body.points).toBe(5); expect(body.reason).toBe('Late');
    return reply(route, { ...team, pointsSubtracted: 5, newTotalPoints: 25 });
  });
  await page.goto('/admin/scoring');
  await page.getByLabel('Scoring action').selectOption('deduct');
  await page.getByLabel('Points to deduct').fill('5');
  await page.getByLabel('Deduction reason').fill('Late');
  await page.getByRole('button', { name: 'Scan QR code', exact: true }).click();
  await page.getByText('Scan an Image File', { exact: false }).click();
  await page.locator('.qr-scanner input[type=file]').setInputFiles(path.resolve('tests/fixtures/team-1000.png'));
  await expect(page.getByRole('button', { name: 'Confirm deduction' })).toBeVisible();
  expect(deductions).toBe(0);
  await page.getByRole('button', { name: 'Confirm deduction' }).click();
  await expect(page.getByRole('heading', { name: 'Points deducted' })).toBeVisible();
  await expect(page.getByText('New total: 25')).toBeVisible();
});

test('new admin pages reject unauthenticated visitors', async ({ browser }) => {
  const page = await browser.newPage();
  for (const route of ['teams', 'admins', 'history']) {
    await page.goto(`http://127.0.0.1:5178/admin/${route}`);
    await expect(page).toHaveURL(/\/admin\/login$/);
  }
  await page.close();
});

test('CSV parser handles BOM, quoting and rejects malformed input', () => {
  const rows = parseRegistrationCsv(`\uFEFF${registrationHeaders.join(',')}\r\n"The ""Stars"", Team","Leader\nName",test@example.com,4\r\n`);
  expect(rows[0].body.teamName).toBe('The "Stars", Team');
  expect(rows[0].body.leaderName).toBe('Leader\nName');
  expect(rows[0].status).toBe('Ready');
  expect(() => parseRegistrationCsv('bad,headers\n1,2')).toThrow('Required columns');
  expect(() => parseRegistrationCsv(`${registrationHeaders.join(',')}\n"Unclosed`)).toThrow('not closed');
});
