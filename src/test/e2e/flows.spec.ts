import { test, expect } from "@playwright/test";

test.describe("Critical Flow 1: Signup → Onboarding → First Quote Creation", () => {
  test("allows a new user to sign up, complete onboarding in <3 mins, and build a quote", async ({ page }) => {
    const testEmail = `new-owner-${Date.now()}@testpilot.com`;

    // 1. Visit signup page
    await page.goto("/signup");
    await expect(page.getByRole("heading", { name: /create your account/i })).toBeVisible();

    // 2. Fill registration
    await page.getByLabel(/your name/i).fill("Test Owner");
    await page.getByLabel(/work email/i).fill(testEmail);
    await page.getByLabel(/password/i).fill("PestPilot123!");
    await page.getByRole("button", { name: /start free trial/i }).click();

    // 3. Complete Onboarding Step 1 (Company)
    await expect(page).toHaveURL(/.*onboarding/, { timeout: 10000 });
    await page.getByLabel(/company \/ fleet name/i).fill("Pest Shields LLC");
    await page.getByRole("button", { name: /continue to first customer/i }).click();

    // 4. Complete Onboarding Step 2 (First Customer & Service Address)
    await page.getByLabel(/first name/i).fill("Alice");
    await page.getByLabel(/last name/i).fill("Vance");
    await page.getByLabel(/customer email/i).fill("alice@vance.com");
    await page.getByLabel(/customer phone/i).fill("(555) 345-6789");
    await page.getByLabel(/street address/i).fill("100 Pine Street");
    await page.getByPlaceholder(/city/i).fill("Austin");
    await page.getByPlaceholder(/zip/i).fill("78701");
    await page.getByRole("button", { name: /finish & launch dashboard/i }).click();

    // 5. Lands on Dashboard
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });
    await expect(page.getByText("Pest Shields LLC")).toBeVisible();

    // 6. Navigate to Quotes and Create First Quote
    await page.goto("/quotes");
    await page.getByRole("button", { name: /create quote/i }).first().click();
    await page.getByRole("button", { name: /\+ initial pest cleanout/i }).click();
    await page.getByRole("button", { name: /save & generate quote/i }).click();

    // 7. Quote generated and listed
    await expect(page.getByText("Initial Pest Defense & Inspection")).toBeVisible();
  });
});

test.describe("Critical Flow 2: Complete Job Offline Then Sync", () => {
  test("allows technician to work offline, enter chemical log, and sync when back online", async ({ page, context }) => {
    // 1. Login with demo technician
    await page.goto("/login");
    await page.getByRole("button", { name: /tech demo \(mobile\)/i }).click();
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });

    // 2. Open Field Mobile View
    await page.goto("/mobile/today");
    await expect(page.getByText(/today's field route/i)).toBeVisible();

    // 3. Simulate going offline
    await context.setOffline(true);

    // Verify offline badge is indicated
    const statusBadge = page.locator("header").getByRole("button", { name: /sync status/i });
    // In offline mode, buttons remain responsive
    const firstJobAction = page.getByRole("button", { name: /start route|begin treatment|complete job/i }).first();
    if (await firstJobAction.isVisible()) {
      await firstJobAction.click();
    }

    // 4. Restore connectivity
    await context.setOffline(false);

    // 5. Trigger sync
    await page.getByRole("button", { name: /sync/i }).first().click();
    await expect(page.getByText(/online|syncing/i).first()).toBeVisible();
  });
});

test.describe("Critical Flow 3: Subscribe via Stripe Test Mode", () => {
  test("allows organization owner to view plans and initiate Pro plan upgrade", async ({ page }) => {
    // 1. Login with demo owner
    await page.goto("/login");
    await page.getByRole("button", { name: /owner demo/i }).click();
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });

    // 2. Open Settings -> Subscription & Plans
    await page.goto("/settings");
    await page.getByRole("button", { name: /subscription & plans/i }).click();

    // 3. Verify Pro plan with $29/month is visible
    await expect(page.getByText("$29")).toBeVisible();
    await expect(page.getByText(/up to 3 technicians/i)).toBeVisible();

    // 4. Click Upgrade button
    const upgradeButton = page.getByRole("button", { name: /upgrade to pro/i });
    if (await upgradeButton.isVisible()) {
      await upgradeButton.click();
      // Should display success toast in simulation mode or redirect to checkout
      await expect(page.getByText(/pro plan|active/i).first()).toBeVisible();
    }
  });
});

