import { test, expect } from '@playwright/test';
const team = { teamId: 1000, teamName: 'Star Rangers', leaderName: 'Avery', totalPoints: 35 };
const standings = [{ ...team, teamSize: 4 }, { teamId: 1001, teamName: 'Moon Walkers', totalPoints: 20, teamSize: 3 }];
const progress = { ...team, totalGamesPlayed: 2, uniqueGamesCompleted: 1,
  gameStatistics: [{ gameId: 'game1', gameName: 'Memory Maze', gamePoints: 20, timesCompleted: 2, totalPointsEarned: 40 }],
  gameDetails: [{ gameName: 'Memory Maze', points: 40, assignedBy: 'Organizer', completedAt: '2026-09-18T10:00:00Z' }, { gameName: 'Points adjustment', points: -5, reason: 'Correction', assignedBy: 'Organizer', completedAt: '2026-09-18T11:00:00Z' }],
};
const reply = (route, data, status = 200) => route.fulfill({ status, json: { data, message: status === 401 ? 'Invalid credentials' : 'Success' } });
test.beforeEach(async ({ page }) => {
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith('/leaderboard/top')) return reply(route, standings);
    if (path.endsWith('/participants/login')) return reply(route, team);
    if (path.endsWith('/progress/1000')) return reply(route, progress);
    if (path.endsWith('/admin/login')) return reply(route, { token: 'test-token', admin: { name: 'Organizer', role: 'admin' } });
    if (path.endsWith('/admin/profile')) return reply(route, { name: 'Organizer', email: 'organizer@example.com', role: 'admin' });
    return reply(route, null, 404);
  });
});
test('live leaderboard refreshes and searches real team names and IDs', async ({ page }) => {
  await page.clock.install();
  let points = 35;
  await page.route('**/api/participants/leaderboard/top', route => reply(route, [{ ...team, totalPoints: points, teamSize: 4 }, standings[1]]));
  await page.goto('/leaderboard');
  await expect(page.getByText('Star Rangers', { exact: true })).toBeVisible();
  await page.getByRole('textbox', { name: 'Search team' }).fill('1001');
  await page.getByRole('textbox', { name: 'Search team' }).press('Enter');
  await expect(page.getByText('Star Rangers', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Moon Walkers', { exact: true })).toBeVisible();
  await page.getByRole('textbox', { name: 'Search team' }).fill('');
  points = 99;
  await page.clock.fastForward(11000);
  await expect(page.locator('.score').first()).toHaveText('99');
});
test('leaderboard handles failure, retry, and an empty event', async ({ page }) => {
  let fail = true;
  await page.route('**/api/participants/leaderboard/top', route => fail ? route.abort() : reply(route, []));
  await page.goto('/leaderboard');
  await expect(page.getByRole('alert')).toContainText('Cannot reach');
  fail = false;
  await page.getByRole('button', { name: 'Retry' }).click();
  await expect(page.getByText('No teams registered yet.', { exact: false })).toBeVisible();
});
test('participant login opens progress, persists on reload, and signs out', async ({ page }) => {
  await page.goto('/teamprogress');
  await expect(page).toHaveURL(/\/login$/);
  await page.getByLabel('Team name', { exact: true }).fill(team.teamName);
  await page.getByLabel('Team ID', { exact: true }).fill('1000');
  const request = page.waitForRequest('**/api/participants/login');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  expect((await request).postDataJSON()).toEqual({ teamName: team.teamName, teamId: 1000 });
  await expect(page.getByRole('heading', { name: team.teamName })).toBeVisible();
  await expect(page.getByText('Correction', { exact: true })).toBeVisible();
  await page.getByLabel('Search games').fill('nothing');
  await expect(page.getByText('No matching games.')).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: team.teamName })).toBeVisible();
  await page.getByText('Correction', { exact: true }).scrollIntoViewIfNeeded();
  await expect(page.getByText('Correction', { exact: true })).toBeInViewport();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: 'test-results/team-progress.png', fullPage: true });
  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page).toHaveURL(/\/login$/);
});
test('invalid participant login stays on the form', async ({ page }) => {
  await page.route('**/api/participants/login', route => reply(route, null, 401));
  await page.goto('/login');
  await page.getByLabel('Team name', { exact: true }).fill('Wrong');
  await page.getByLabel('Team ID', { exact: true }).fill('1000');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Invalid credentials');
  await expect(page).toHaveURL(/\/login$/);
});
test('admin login verifies the bearer token and signs out', async ({ page }) => {
  await page.goto('/admin');
  await expect(page).toHaveURL(/\/admin\/login$/);
  await page.getByLabel('Email', { exact: true }).fill('organizer@example.com');
  await page.getByLabel('Password', { exact: true }).fill('test-password');
  const profileRequest = page.waitForRequest('**/api/admin/profile');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  expect((await profileRequest).headers().authorization).toBe('Bearer test-token');
  await expect(page.getByRole('heading', { name: 'Welcome, Organizer' })).toBeVisible();
  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page).toHaveURL(/\/admin\/login$/);
});
test('expired admin session asks for login again', async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('celestia.admin', JSON.stringify({ token: 'expired', admin: {} })));
  await page.route('**/api/admin/profile', route => reply(route, null, 401));
  await page.goto('/admin');
  await expect(page.getByRole('heading', { name: 'Session expired' })).toBeVisible();
  await page.getByRole('button', { name: 'Return to login' }).click();
  await expect(page).toHaveURL(/\/admin\/login$/);
});
test('mobile navigation and login fit the viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/leaderboard');
  await page.getByRole('button', { name: 'Toggle menu' }).click();
  await page.getByRole('link', { name: 'TEAM LOGIN', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Welcome, adventurers' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/mobile-login.png', fullPage: true });
});
