import { expect, test } from "@playwright/test";

test.skip(!!process.env.PLAYWRIGHT_BASE_URL, "Study chat uses a local account and scripted provider");

test("chat links to Settings and the OpenRouter key lasts only for this tab session", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("lc-e2e-user", "user_coach_connection");
    localStorage.setItem("lc-tracker-features-modal-version", "1");
  });
  const mutations: string[] = [];
  await page.route("https://test.supabase.co/**", route => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/commit_user_change")) mutations.push(path);
    return route.fulfill({ json: path.endsWith("/user_settings") ? {
      version: 1, onboarding_complete: true, settings_json: { settings: { learningMode: "EXPLORE" } },
    } : [] });
  });

  await page.goto("/dashboard");
  await page.getByRole("button", { name: "Open study chat", exact: true }).click();
  const chat = page.getByRole("complementary", { name: "Study chat" });
  await chat.getByRole("link", { name: "Study chat settings" }).click();
  await expect(page).toHaveURL(/\/settings#section-study-chat$/);
  await expect(chat).toBeHidden();
  const setup = page.getByRole("region", { name: "Study chat", exact: true });
  const key = "sk-or-v1-fixture-key-not-for-network";
  const field = setup.getByLabel("OpenRouter API key");
  await expect(field).toBeInViewport();
  await field.fill(key);
  await setup.getByRole("checkbox").check();
  await setup.getByRole("button", { name: "Connect OpenRouter" }).click();
  await expect(setup.getByRole("status")).toHaveText("OpenRouter key added for this tab");
  expect(await page.evaluate(token =>
    !JSON.stringify([Object.entries(localStorage), Object.entries(sessionStorage)]).includes(token), key)).toBe(true);
  expect(mutations).toHaveLength(0);

  await page.getByRole("link", { name: "Today", exact: true }).first().click();
  await page.getByRole("button", { name: "Open study chat", exact: true }).click();
  await chat.getByRole("link", { name: "Study chat settings" }).click();
  await expect(setup.getByRole("status")).toHaveText("OpenRouter key added for this tab");
  await setup.getByRole("button", { name: "Disconnect OpenRouter" }).click();
  await expect(field).toHaveValue("");
  await field.fill(key);
  await setup.getByRole("checkbox").check();
  await setup.getByRole("button", { name: "Connect OpenRouter" }).click();
  await page.reload();
  await expect(field).toHaveValue("");
});

test("chat edits the live study target draft and observes changes saved in Settings", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("lc-e2e-user", "user_coach_settings");
    localStorage.setItem("lc-tracker-features-modal-version", "1");
  });
  const settings = { version: 1, onboarding_complete: true, settings_json: {} };
  const saves: { p_kind: string }[] = [];
  await page.route("https://test.supabase.co/**", route => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/commit_user_change")) {
      const input = route.request().postDataJSON();
      saves.push(input);
      Object.assign(settings, input.p_payload.settings, { version: settings.version + 1 });
      return route.fulfill({ json: { duplicate: false } });
    }
    return route.fulfill({ json: path.endsWith("/user_settings") ? settings : [] });
  });
  await page.route("**/__coach_fixture", route => {
    const request = route.request().postDataJSON();
    const question = request.messages.at(-1).content;
    const result = request.response_format.json_schema.name === "answer"
      ? { suggestion: "" }
      : { calls: [question === "Check my draft"
        ? { name: "settings_read_time_targets", arguments: "{}" }
        : { name: "settings_prepare_time_targets", arguments: '{"weekdayMinutes":45}' }], clarification: "" };
    return route.fulfill({ json: { choices: [{ finish_reason: "stop", message: { content: JSON.stringify(result) } }] } });
  });

  await page.goto("/settings");
  await page.getByRole("button", { name: "Open study chat", exact: true }).click();
  const chat = page.getByRole("complementary", { name: "Study chat" });
  async function ask(question: string) {
    await chat.getByLabel("Message", { exact: true }).fill(question);
    await chat.getByRole("button", { name: "Send", exact: true }).click();
  }
  await ask("Set my weekday target to 45 minutes");
  await chat.getByRole("button", { name: "Apply settings prepare time targets" }).click();
  const slider = page.getByRole("slider", { name: "Weekday Daily Target" });
  await expect(slider).toHaveValue("45");
  expect(saves).toHaveLength(0);
  const save = page.getByRole("button", { name: "Save study time targets", exact: true });
  await save.click();
  await expect(page.getByText("Study time targets saved.", { exact: true })).toBeVisible();
  expect(saves).toHaveLength(1);
  expect(saves[0].p_kind).toBe("settings");
  await slider.press("ArrowRight");
  await ask("Check my draft");
  await expect(chat.getByText("Study time target changes are awaiting Save.")).toBeVisible();
  expect(saves).toHaveLength(1);
});

test("restore shows a local preview and preserves its operation ID after an unconfirmed save", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("lc-e2e-user", "user_coach_restore");
    localStorage.setItem("lc-tracker-features-modal-version", "1");
  });
  const saves: { p_kind: string; p_operation_id: string; p_payload: unknown }[] = [];
  await page.route("https://test.supabase.co/**", route => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/commit_user_change")) {
      saves.push(route.request().postDataJSON());
      return saves.length === 1
        ? route.fulfill({ json: { message: "Lost response" }, status: 503 })
        : route.fulfill({ json: { duplicate: true } });
    }
    return route.fulfill({ json: path.endsWith("/user_settings") ? { version: 1, onboarding_complete: true, settings_json: {} } : [] });
  });
  await page.goto("/settings");
  await expect(page.getByRole("button", { name: "Restore backup", exact: true })).toBeEnabled();
  await page.locator('input[type="file"]').setInputFiles({
    name: "study-backup.json", mimeType: "application/json", buffer: Buffer.from('{"progress":{}}'),
  });
  const dialog = page.getByRole("dialog", { name: "Restore selected backup?" });
  await expect(dialog).toContainText("study-backup.json");
  expect(saves).toHaveLength(0);
  const confirm = dialog.getByRole("button", { name: "Confirm restore" });
  await confirm.click();
  await expect(dialog.getByRole("alert")).toBeVisible();
  await confirm.click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByText("Backup restored.", { exact: true })).toBeVisible();
  expect(saves).toHaveLength(2);
  expect(saves[0].p_kind).toBe("restore");
  expect(saves[1]).toEqual(saves[0]);
});
