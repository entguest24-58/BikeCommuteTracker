import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupUnauthenticatedSession } from "../../helpers/mock-api.js";

test("Year Stats Dashboard link is hidden for unauthenticated users", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "year_stats_link_hidden_for_unauthenticated_user",
    testTitle: testInfo.title,
  });

  await recorder.step("Clear any authenticated session", async () => {
    await setupUnauthenticatedSession(page);
  });

  await recorder.step("Attempt to load a protected page without authentication", async () => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("heading", { name: "Log in" })).toBeVisible();
  });

  await recorder.step("Verify the Year Stats navigation link is not rendered", async () => {
    await expect(page.getByRole("link", { name: "Year Stats" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Dashboard" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Advanced Stats" })).toHaveCount(0);
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:year_stats_link_hidden_for_unauthenticated_user");
  await recorder.save(testInfo);
});
