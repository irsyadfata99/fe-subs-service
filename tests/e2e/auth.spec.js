const { test, expect } = require("@playwright/test");

test.describe("Authentication Flow", () => {
  test("Login flow", async ({ page }) => {
    await page.goto("/login");

    // Wait for page to load
    await page.waitForLoadState("networkidle");

    // Use more specific selectors
    await page.locator('input[type="email"]').first().fill("admin@platform.com");
    await page.locator('input[type="password"]').first().fill("password123");
    await page.locator('button:has-text("Login")').click();

    // Wait for navigation
    await page.waitForURL("**/dashboard", { timeout: 10000 });
    await expect(page).toHaveURL(/dashboard/);
  });

  test("Register flow", async ({ page }) => {
    await page.goto("/register");
    await page.waitForLoadState("networkidle");

    // Fill form dengan selector yang lebih reliable
    await page.locator('input[type="text"]').first().fill("E2E Test Gym");
    await page.locator('input[type="email"]').fill(`test${Date.now()}@test.com`);
    await page.locator('input[type="password"]').first().fill("Test123456");
    await page.locator('button:has-text("Register")').click();

    await page.waitForURL("**/dashboard", { timeout: 10000 });
    await expect(page).toHaveURL(/dashboard/);
  });
});

test.describe("Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await page.locator('input[type="email"]').fill("admin@platform.com");
    await page.locator('input[type="password"]').fill("password123");
    await page.locator('button:has-text("Login")').click();
    await page.waitForURL("**/dashboard");
  });

  test("Dashboard loads correctly", async ({ page }) => {
    await expect(page.locator("h1")).toContainText(/Welcome|Dashboard/);
  });

  test("Navigate to End Users", async ({ page }) => {
    await page.click("text=End Users");
    await expect(page).toHaveURL(/end-users/);
  });
});
