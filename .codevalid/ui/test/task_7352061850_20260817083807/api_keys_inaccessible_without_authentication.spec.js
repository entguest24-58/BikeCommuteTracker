import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupUnauthenticatedSession, mockProtectedUserSettingsUnauthorized } from "../../helpers/mock-api.js";

test("API keys are inaccessible to unauthenticated users", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "api_keys_inaccessible_without_authentication",
    testTitle: "API keys are inaccessible to unauthenticated users",
  });

  await recorder.step("setup unauthenticated session and unauthorized settings route", async () => {
    await setupUnauthenticatedSession(page);
    await mockProtectedUserSettingsUnauthorized(page);
  });

  await recorder.step("call protected settings api without authentication", async () => {
    const response = await page.request.get(`${testInfo.project.use.baseURL}/api/users/me/settings`);
    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body.message).toBe("Unauthorized");
  });

  await recorder.step("verify unauthenticated user cannot access settings page", async () => {
    await page.goto("/settings");
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("heading", { name: "Log in" })).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:api_keys_inaccessible_without_authentication");
  await recorder.save(testInfo);
});
