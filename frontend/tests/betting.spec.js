import { test, expect } from '@playwright/test';
const reply = (route, data) => route.fulfill({ json: { data, message: 'Success' } });
test('auction betting deducts, refunds and displays settlement', async ({ page }) => {
  let balance = 1000, active = null, completed = false;
  const game = () => ({ _id: 'g1', gameName: 'Betting Round', gameType: 'auction', gamePoints: 1, auctionConfig: { auctionCompleted: completed } });
  await page.addInitScript(() => sessionStorage.setItem('celestia.admin', JSON.stringify({ token: 'test-token' })));
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/admin/profile') return reply(route, { name: 'Organizer', role: 'admin' });
    if (path === '/api/games') return reply(route, [game()]);
    expect(route.request().headers().authorization).toBe('Bearer test-token');
    if (path.endsWith('/active-bet-status')) return reply(route, { teamId: 1000, teamName: 'Team One', totalPoints: balance, activeBet: active });
    if (path.endsWith('/bets')) return reply(route, { bets: active ? [{ ...active, teamId: 1000, teamName: 'Team One' }] : [] });
    if (path.endsWith('/bet')) {
      const body = route.request().postDataJSON();
      expect(body.pointsBet).toBe(100); expect(body.teamId).toBe(1000);
      expect(body.cupNumber).toBe(1);
      balance -= body.pointsBet; active = { ...body, gameName: 'Betting Round', gameType: 'auction' };
      return reply(route, { remainingPoints: balance });
    }
    if (path.endsWith('/cancel-bet')) { balance += active.pointsBet; active = null; return reply(route, { refundedPoints: 100 }); }
    if (path.endsWith('/reveal')) {
      const body = route.request().postDataJSON();
      expect(body.cupMultipliers).toEqual({ 1: 2.75, 2: 2.75, 3: 1.25, 4: 0 });
      const multiplier = 2.75;
      balance += 100 * multiplier; active = null; completed = true;
      const row = { teamId: 1000, teamName: 'Team One', pointsBet: 100, multiplier, pointsAwarded: 100 * multiplier, netChange: 100 * multiplier - 100, totalPoints: balance };
      return reply(route, { allResults: [row] });
    }
    return route.fulfill({ status: 404, json: { message: 'Unexpected endpoint' } });
  });
  await page.goto('/admin/betting');
  await page.getByLabel('Betting game').selectOption('g1');
  await page.getByLabel('Team ID').fill('1000');
  await page.getByRole('button', { name: 'Check team' }).click();
  await expect(page.getByText('Available points: 1000')).toBeVisible();
  await page.getByLabel('Points to bet').fill('100');
  await page.getByRole('button', { name: 'Place bet and deduct points' }).click();
  await expect(page.getByText('Available points: 900')).toBeVisible();
  await page.getByRole('button', { name: 'Cancel bet and refund' }).click();
  await expect(page.getByText('Available points: 1000')).toBeVisible();
  await page.getByLabel('Points to bet').fill('100');
  await page.getByRole('button', { name: 'Place bet and deduct points' }).click();
  await page.getByRole('button', { name: 'Review results' }).click();
  await expect(page.getByRole('alert')).toContainText('Enter a custom multiplier');
  for (const [index, value] of ['2.75', '2.75', '1.25', '0'].entries()) {
    await expect(page.getByLabel('Cup ' + (index + 1) + ' multiplier')).toHaveAttribute('type', 'number');
    await page.getByLabel('Cup ' + (index + 1) + ' multiplier').fill(value);
  }
  await page.getByRole('button', { name: 'Review results' }).click();
  await page.getByRole('button', { name: 'Confirm results and update points' }).click();
  await expect(page.getByRole('heading', { name: 'Results', exact: true })).toBeVisible();
  await expect(page.getByText('Available points: ' + 1175)).toBeVisible();
  await expect(page.getByText('This round is complete.', { exact: false })).toBeVisible();
});

test('betting controls and multiplier guide are visible before a game or team is selected', async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('celestia.admin', JSON.stringify({ token: 'test-token' })));
  await page.route('**/api/**', route => reply(route, route.request().url().endsWith('/admin/profile') ? { name: 'Organizer', role: 'admin' } : []));
  await page.goto('/admin/betting/rounds');
  await expect(page.getByLabel('Team ID')).toBeVisible();
  await expect(page.getByLabel('Points to bet')).toBeVisible();
  await expect(page.getByLabel('Points to bet')).toBeDisabled();
  await expect(page.getByText('Auction multipliers:', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Create an Auction in Games' })).toBeVisible();
});

test('old auction-round link redirects to the only betting page', async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('celestia.admin', JSON.stringify({ token: 'test-token' })));
  await page.route('**/api/**', route => reply(route, route.request().url().endsWith('/admin/profile') ? { name: 'Organizer', role: 'admin' } : []));
  await page.goto('/admin/betting/rounds');
  await expect(page).toHaveURL(/\/admin\/betting$/);
  await expect(page.getByRole('heading', { name: 'Auction cup betting' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Add team', exact: true })).toHaveCount(0);
});
