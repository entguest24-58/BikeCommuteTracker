import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupRepoAppReady,
  setupUnauthenticatedSession,
  mockUserSettingsUnauthenticated,
} from "../../helpers/mock-api.js";

test("Per-rider API keys remain inaccessible to unauthenticated users", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("api_keys_are_not_accessible_without_auth", "Per-rider API keys remain inaccessible to unauthenticated users");

  await recorder.step("Mock startup, unauthenticated session, and unauthenticated settings response");
  await setupRepoAppReady(page);
  await setupUnauthenticatedSession(page);
  await mockUserSettingsUnauthenticated(page);

  await recorder.step("Attempt to navigate to protected dashboard and settings pages without authentication");
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login$/);
  await page.goto("/settings");
  await expect(page).toHaveURL(/\/login$/);

  await recorder.step("Verify API key fields are not rendered on the login page before authentication");
  await expect(page.getByPlaceholder("Enter EIA API key to enable gas price lookup")).toHaveCount(0);
  await expect(page.getByPlaceholder("Optional — leave blank to use free tier")).toHaveCount(0);
  await expect(page.getByText(/api key/i)).toHaveCount(0);

  console.log("CODEVALID_TEST_ASSERTION_OK:api_keys_are_not_accessible_without_auth");
  await recorder.save(testInfo);
});
