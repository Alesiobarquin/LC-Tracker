import { expect, test } from "@playwright/test";

test.skip(!!process.env.PLAYWRIGHT_BASE_URL, "Uses the local onboarding account fixture");

test("Study chat setup is optional and the final step launches without a key", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    localStorage.setItem("lc-e2e-user", "user_coach_onboarding");
    localStorage.setItem("lc-tracker-features-modal-version", "1");
    localStorage.setItem("lc-tracker-theme", "dark");
  });
  const settings = { version: 1, onboarding_complete: false, settings_json: {} };
  await page.route("https://test.supabase.co/**", (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/commit_user_change")) {
      Object.assign(settings, route.request().postDataJSON().p_payload.settings, { version: settings.version + 1 });
      return route.fulfill({ json: { duplicate: false } });
    }
    return route.fulfill({ json: path.endsWith("/user_settings") ? settings : [] });
  });
  const modelRequests: string[] = [];
  await page.route("**/api/coach", (route) => route.fulfill({ status: 503, json: { code: "disabled" } }));
  await page.route("**/__coach_fixture", (route) => {
    modelRequests.push(route.request().url());
    return route.abort();
  });

  await page.goto("/onboarding");
  await page.getByRole("button", { name: "Continue without connecting" }).click();
  const continueSetup = page.getByRole("button", { name: "Continue", exact: true });
  await continueSetup.click();
  await continueSetup.click();

  const chat = page.getByRole("region", { name: "Study chat Optional" });
  await expect(chat).toContainText("Plan and evidence shortcuts work without a key");
  await expect(chat).toContainText("later under Study chat in Settings");
  const key = chat.getByLabel("OpenRouter API key", { exact: true });
  await expect(key).toBeHidden();
  await chat.getByText("Connect a provider", { exact: true }).click();
  await expect(key).toBeVisible();
  await expect(key).toHaveAttribute("type", "password");
  await expect(chat.getByRole("button", { name: "Connect OpenRouter" })).toBeDisabled();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.screenshot({ path: testInfo.outputPath("study-chat-review.png"), fullPage: true, animations: "disabled" });

  const launch = page.getByRole("button", { name: "Open today’s plan", exact: true });
  await expect(launch).toBeEnabled();
  await launch.click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Today’s study plan" })).toBeVisible();
  expect(modelRequests).toHaveLength(0);
});
