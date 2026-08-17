import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupUnauthenticatedSession } from "../../helpers/mock-api.js";

test("csv_import_unauthenticated_redirect", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({ testId: "csv_import_unauthenticated_redirect", testTitle: testInfo.title });

  await recorder.step("clear session", async () => {
    await setupUnauthenticatedSession(page);
  });

  await recorder.step("navigate directly to protected import page", async () => {
    await page.goto("/expenses/import");
  });

  await recorder.step("verify redirect to login", async () => {
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("heading", { name: "Log in" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Import Expenses" })).not.toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:csv_import_unauthenticated_redirect");
  await recorder.save(testInfo);
});
