import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedBikeTrackingSession, mockProtectedUserSettingsAuthorized } from "../../helpers/mock-api.js";

test("Authenticated session persists across protected page navigations", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "session_preserved_across_protected_routes",
    testTitle: "Authenticated session persists across protected page navigations",
  });

  await recorder.step("seed authenticated bike tracking session and protected settings mock", async () => {
    await setupAuthenticatedBikeTrackingSession(page, {
      userId: 101,
      userName: "alex",
    });
    await mockProtectedUserSettingsAuthorized(page);
  });

  await recorder.step("open dashboard as authenticated user", async () => {
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: "Your riding story, one screen." })).toBeVisible();
  });

  await recorder.step("navigate to advanced dashboard and preserve session", async () => {
    await page.goto("/dashboard/advanced");
    await expect(page).toHaveURL(/\/dashboard\/advanced$/);
    await expect(page.getByRole("heading", { name: "Deep-dive into your savings." })).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:session_preserved_across_protected_routes");
  await recorder.save(testInfo);
});
