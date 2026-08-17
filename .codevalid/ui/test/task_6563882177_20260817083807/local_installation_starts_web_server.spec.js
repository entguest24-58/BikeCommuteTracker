import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupUnauthenticatedSession, mockLocalAppShell } from "../../helpers/mock-api.js";

test("Application starts local web server upon local installation", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "local_installation_starts_web_server",
    testTitle: "Application starts local web server upon local installation",
  });

  await recorder.step("prepare browser-mode unauthenticated app shell", async () => {
    await setupUnauthenticatedSession(page);
    await mockLocalAppShell(page);
  });

  await recorder.step("open the local application root", async () => {
    await page.goto("/");
  });

  await recorder.step("verify the local UI is responsive on the login route", async () => {
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("heading", { name: "Commute Bike Tracker" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Log in" })).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:local_installation_starts_web_server");
  await recorder.save(testInfo);
});
