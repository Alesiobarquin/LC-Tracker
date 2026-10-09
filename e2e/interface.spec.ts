import { expect, test } from "@playwright/test";

test.skip(
  !!process.env.PLAYWRIGHT_BASE_URL,
  "Interface review uses isolated local fixtures",
);

const progress = ["two-sum", "valid-anagram", "contains-duplicate"].map(
  (problem_id) => ({
    problem_id,
    version: 1,
    first_solved_at: "2025-12-01T12:00:00Z",
    last_reviewed_at: "2025-12-01T12:00:00Z",
    next_review_at: "2025-12-05T12:00:00Z",
    review_count: 1,
    consecutive_threes: 0,
    consecutive_successes: 1,
    retired: false,
    notes: "Check the complement before adding each value to the hash map.",
    history: [{ date: "2025-12-01T12:00:00Z", rating: 3 }],
    study_state: null,
  }),
);

const surfaces = [
  { name: "login", path: "/login", heading: "Sign in to LC Tracker" },
  { name: "onboarding", path: "/onboarding", heading: "Welcome to LC Tracker" },
  { name: "landing", path: "/", heading: "Know what to solve next." },
  { name: "today", path: "/dashboard", heading: "Today’s study plan" },
  { name: "library", path: "/library", heading: "Problem Library" },
  { name: "patterns", path: "/patterns", heading: "Pattern learning" },
  { name: "lesson", path: "/patterns/two-pointers", heading: /Two Pointer/i },
  { name: "evidence", path: "/analytics", heading: "Learning evidence" },
  { name: "recall", path: "/recall/two-sum", heading: "Recall check" },
  { name: "coding", path: "/timer/two-sum", heading: "Two Sum" },
  { name: "settings", path: "/settings", heading: "Study settings" },
  { name: "syntax", path: "/syntax", heading: "Syntax Reference" },
];

for (const theme of ["light", "dark"] as const) {
  for (const width of [1440, 390]) {
    for (const surface of surfaces) {
      test(`${surface.name} · ${theme} · ${width}`, async ({
        page,
      }, testInfo) => {
        await page.setViewportSize({
          width,
          height: width === 390 ? 844 : 1000,
        });
        await page.addInitScript(
          ({ theme, signedIn }) => {
            localStorage.setItem("lc-tracker-theme", theme);
            localStorage.setItem("lc-tracker-features-modal-version", "1");
            if (signedIn)
              localStorage.setItem("lc-e2e-user", "user_interface_fixture");
          },
          { theme, signedIn: !["landing", "login"].includes(surface.name) },
        );
        const timings = [15, 30, 25, 18, 35, 22].map((minutes, i) => ({
          id: `00000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`,
          problem_id: "two-sum",
          category: "Arrays & Hashing",
          recorded_at: new Date(Date.now() - i * 86400000).toISOString(),
          elapsed_seconds: minutes * 60,
          session_type: "review",
          rating: 3,
        }));
        await page.route("https://test.supabase.co/**", async (route) => {
          const url = new URL(route.request().url());
          const path = url.pathname;
          const offset = Number(url.searchParams.get("offset") ?? 0);
          const limit = Number(url.searchParams.get("limit") ?? 500);
          const data = path.endsWith("/user_settings")
            ? {
                version: 1,
                onboarding_complete: surface.name !== "onboarding",
                target_interview_date: "",
                leetcode_username: null,
                settings_json: {
                  settings: {
                    learningMode: "EXPLORE",
                    studySchedule: {
                      weekdayMinutes: 30,
                      weekendMinutes: 45,
                      restDay: -1,
                      blackoutDates: [],
                    },
                  },
                },
              }
            : path.endsWith("/problem_progress")
              ? progress.slice(offset, offset + limit)
              : path.endsWith("/session_timings")
                ? timings.slice(offset, offset + limit)
                : path.endsWith("/sprint_state")
                  ? null
                  : [];
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify(data),
          });
        });
        const errors: string[] = [];
        page.on("pageerror", (error) => errors.push(error.message));
        await page.goto(surface.path);
        await expect(
          page.getByRole("heading", { name: surface.heading }).first(),
        ).toBeVisible();
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        if (surface.name === "syntax") {
          const row = await page.locator(".syntax-card").first().boundingBox();
          const book = await page.locator(".syntax-book").boundingBox();
          expect(row?.width ?? 0).toBeGreaterThan((book?.width ?? width) * 0.9);
          await page.screenshot({
            path: testInfo.outputPath("syntax-due.png"),
            animations: "disabled",
          });
          await page.getByRole("tab", { name: "Browse all" }).click();
        }
        if (surface.name === "library") {
          await page.getByPlaceholder("Search problems...").fill("two sum");
          await expect(
            page.getByRole("cell", { name: /^Two Sum/ }).first(),
          ).toBeVisible();
        }
        if (surface.name === "recall")
          await page
            .getByLabel("Your attempt · explanation or pseudocode")
            .fill("Check complements using a hash map. O(n) time and space.");
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth),
        ).toBeLessThanOrEqual(width);
        await page.screenshot({
          path: testInfo.outputPath("interface.png"),
          fullPage: true,
          animations: "disabled",
        });
        await page.screenshot({
          path: testInfo.outputPath("viewport.png"),
          animations: "disabled",
        });
        if (surface.name === "library" && width === 390) {
          const toggle = page.getByRole("button", { name: /Filters/ });
          await toggle.click();
          await expect(page.getByLabel("Filter by difficulty")).toBeVisible();
          await page.getByLabel("Filter by difficulty").selectOption("Easy");
          await expect(
            page.getByRole("cell", { name: /^Two Sum/ }).first(),
          ).toBeVisible();
          await toggle.click();
          await expect(
            page.getByLabel("Filter by difficulty"),
          ).not.toBeVisible();
          await expect(page.getByPlaceholder("Search problems...")).toHaveValue(
            "two sum",
          );
        }
        if (surface.name === "syntax" && width === 390) {
          const toggle = page.getByRole("button", { name: /Options/ });
          await toggle.click();
          await expect(page.getByLabel("Syntax language")).toBeVisible();
          await page.getByLabel("Syntax language").selectOption("cpp");
          await expect(page.locator(".syntax-card").first()).toBeVisible();
          await page.getByLabel("Syntax language").selectOption("python");
          await toggle.click();
          await expect(page.getByLabel("Syntax language")).not.toBeVisible();
        }
        if (surface.name === "recall" && width === 390) {
          const toggle = page.getByRole("button", {
            name: /Reasoning prompts/,
          });
          await toggle.click();
          await expect(page.locator("#recall-prompts")).toBeVisible();
          await toggle.click();
          await expect(page.locator("#recall-prompts")).not.toBeVisible();
          await expect(
            page.getByLabel("Your attempt · explanation or pseudocode"),
          ).toHaveText(
            "Check complements using a hash map. O(n) time and space.",
          );
        }
        if (surface.name === "patterns") {
          await page
            .getByLabel("Search patterns")
            .fill("no such pattern 928471");
          await expect(
            page.getByRole("heading", {
              name: "Pattern learning",
              exact: true,
            }),
          ).toBeVisible();
          await expect(
            page.getByText("No patterns match your filters."),
          ).toBeVisible();
          await page
            .getByRole("button", { name: "Clear filters", exact: true })
            .click();
          await expect(page.locator(".pattern-row").first()).toBeVisible();
        }
        if (surface.name === "today") {
          if (width === 390) {
            await page.getByRole("button", { name: "Open menu" }).click();
            await expect(
              page.getByRole("navigation", { name: "Workspace" }),
            ).toBeVisible();
            await page.keyboard.press("Escape");
            await expect(
              page.getByRole("button", { name: "Open menu" }),
            ).toHaveAttribute("aria-expanded", "false");
            await page.getByRole("button", { name: "Open menu" }).click();
          } else {
            await page
              .locator('summary[aria-label="Workspace options"]')
              .click();
          }
          await page.getByRole("button", { name: "Product tour" }).click();
          const dialog = page.getByRole("dialog");
          await expect(
            dialog.getByRole("button", { name: "Close dialog", exact: true }),
          ).toBeFocused();
          await page.keyboard.press("Shift+Tab");
          await expect(
            dialog.getByRole("button", { name: "Continue", exact: true }),
          ).toBeFocused();
          await dialog.getByRole("button", { name: "Next slide" }).click();
          await page.screenshot({
            path: testInfo.outputPath("tour.png"),
            animations: "disabled",
          });
          await page.keyboard.press("Escape");
          await expect(dialog).not.toBeVisible();
        }
        if (surface.name === "coding") {
          await page
            .getByRole("button", { name: "I'm Done", exact: true })
            .click();
          await page.getByRole("button", { name: /^Solved independently/ }).click();
          await page
            .getByRole("heading", { name: "Session Complete" })
            .scrollIntoViewIfNeeded();
          await page.evaluate(() => window.scrollTo(0, 0));
          await page.screenshot({
            path: testInfo.outputPath("assessment.png"),
            fullPage: true,
            animations: "disabled",
          });
        }
        if (surface.name === "recall") {
          await page
            .getByRole("button", { name: "Compare with a reference" })
            .click();
          await page
            .getByRole("button", { name: "I’ve compared my answer — continue" })
            .click();
          await page.evaluate(() => window.scrollTo(0, 0));
          await page.screenshot({
            path: testInfo.outputPath("comparison.png"),
            fullPage: true,
            animations: "disabled",
          });
        }
        if (surface.name === "evidence") {
          await page.locator(".session-history-row").first().click();
          const dialog = page.getByRole("dialog");
          await expect(
            dialog.getByRole("button", { name: "Close dialog", exact: true }),
          ).toBeFocused();
          await page.screenshot({
            path: testInfo.outputPath("session-detail.png"),
            animations: "disabled",
          });
          await page.keyboard.press("Escape");
          await expect(dialog).not.toBeVisible();
        }
        if (surface.name === "syntax") {
          await page
            .getByRole("button", { name: "Practice All", exact: true })
            .click();
          await expect(
            page.getByRole("heading", { name: "Syntax practice", exact: true }),
          ).toBeVisible();
          await expect(page.locator("#root")).toHaveAttribute("inert", "");
          const help = page.getByRole("dialog", {
            name: "Syntax practice",
            exact: true,
          });
          await expect(
            help.getByRole("button", { name: "Close dialog", exact: true }),
          ).toBeFocused();
          await help
            .getByRole("button", { name: "By category", exact: true })
            .click();
          await page.screenshot({
            path: testInfo.outputPath("syntax-help.png"),
            animations: "disabled",
          });
          await help
            .getByRole("button", { name: "Start Session", exact: true })
            .click();
          await page.screenshot({
            path: testInfo.outputPath("syntax-prompt.png"),
            animations: "disabled",
          });
          await page.keyboard.press("Space");
          await expect(page.locator(".syntax-session-flip")).toHaveAttribute(
            "style",
            /rotateY\(180deg\)/,
          );
          await expect(
            page.getByRole("button", { name: "Hide answer", exact: true }),
          ).toBeVisible();
          await page.screenshot({
            path: testInfo.outputPath("syntax-answer.png"),
            animations: "disabled",
          });
          await page
            .getByRole("button", { name: "Hide answer", exact: true })
            .focus();
          await page.keyboard.press("Space");
          await expect(page.locator(".syntax-session-flip")).toHaveCSS(
            "transform",
            "none",
          );
          await page
            .getByRole("button", { name: "Exit session", exact: true })
            .click();
          await expect(
            page.getByRole("heading", {
              name: "Syntax Reference",
              exact: true,
            }),
          ).toBeVisible();
          await expect(page.locator("#root")).not.toHaveAttribute("inert", "");
          await expect(
            page.getByRole("button", { name: "Practice All", exact: true }),
          ).toBeFocused();
          expect(
            await page.evaluate(() => document.documentElement.scrollWidth),
          ).toBeLessThanOrEqual(width);
        }
        if (surface.name === "onboarding") {
          await page
            .getByRole("button", { name: "Continue without connecting" })
            .click();
          await page
            .getByRole("button", { name: "Mixed", exact: false })
            .click();
          await page
            .getByRole("button", { name: "Continue", exact: true })
            .click();
          await page.screenshot({
            path: testInfo.outputPath("schedule-setup.png"),
            fullPage: true,
            animations: "disabled",
          });
          await page
            .getByRole("button", { name: "Continue", exact: true })
            .click();
          await expect(
            page.getByRole("button", { name: "Open today’s plan" }),
          ).toBeVisible();
          expect(
            await page.evaluate(() => document.documentElement.scrollWidth),
          ).toBeLessThanOrEqual(width);
        }
        expect(errors).toEqual([]);
      });
    }
  }
}
