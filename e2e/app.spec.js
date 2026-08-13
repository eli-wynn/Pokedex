const { test, expect } = require('@playwright/test');

test.describe('Pokedex core flows', () => {
  test('loads the Pokédex list with no console errors', async ({ page }) => {
    const errors = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    page.on('pageerror', err => errors.push(String(err)));

    await page.goto('/');
    await expect(page.getByRole('heading', { name: "Eli's Pokédex" })).toBeVisible();

    // At least one card should resolve to real data (not stuck on "Loading...")
    await expect(page.locator('.pokemon-card:not(.loading)').first()).toBeVisible({ timeout: 15000 });

    expect(errors).toEqual([]);
  });

  test('search filters the list by name', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.pokemon-card:not(.loading)').first()).toBeVisible({ timeout: 15000 });

    await page.getByRole('textbox').first().fill('pikachu');
    await expect(page.locator('.pokemon-name')).toHaveText(['pikachu'], { timeout: 10000 });
  });

  test('type filter narrows results to a single type', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.pokemon-card:not(.loading)').first()).toBeVisible({ timeout: 15000 });

    await page.locator('.dropdown-toggle').click();
    await page.locator('.type-badge.fire').first().click();

    // give the background backfill fetch a moment to resolve some fire types
    await expect(page.locator('.pokemon-card:not(.loading)').first()).toBeVisible({ timeout: 20000 });
    const names = await page.locator('.pokemon-name').allTextContents();
    expect(names.length).toBeGreaterThan(0);
    expect(names).toContain('charmander');
  });

  test('clicking a card navigates to its detail page', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.pokemon-card:not(.loading)').first()).toBeVisible({ timeout: 15000 });

    await page.locator('.pokemon-card:not(.loading)').first().click();
    await expect(page).toHaveURL(/\/pokemon\/\d+/);
    await expect(page.locator('.detail-header')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('.detail-stats')).toBeVisible();
  });

  test('generation filter narrows the list', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.pokemon-card:not(.loading)').first()).toBeVisible({ timeout: 15000 });

    await page.locator('.gen-toggle').click();
    await page.getByText('Gen I', { exact: true }).click();

    await expect(page.locator('.pokemon-card:not(.loading)').first()).toBeVisible({ timeout: 15000 });
    const firstName = await page.locator('.pokemon-name').first().textContent();
    expect(firstName).toBe('bulbasaur');
  });
});
