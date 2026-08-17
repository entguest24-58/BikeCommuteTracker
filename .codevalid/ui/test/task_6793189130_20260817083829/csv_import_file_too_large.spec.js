import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession } from "../../helpers/mock-api.js";

test("csv_import_file_too_large", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({ testId: "csv_import_file_too_large", testTitle: testInfo.title });

  await recorder.step("seed authenticated session", async () => {
    await setupAuthenticatedSession(page);
  });

  await recorder.step("open import page", async () => {
    await page.goto("/expenses/import");
    await expect(page.getByRole("heading", { name: "Import Expenses" })).toBeVisible();
  });

  await recorder.step("select oversized csv", async () => {
    const largeContent = "a".repeat(6 * 1024 * 1024);
    await page.locator("#expense-import-file").setInputFiles({
      name: "expenses.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(largeContent),
    });
    await expect(page.getByRole("alert")).toHaveText("CSV file must be 5 MB or smaller.");
    await expect(page.getByRole("heading", { name: "Preview" })).not.toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:csv_import_file_too_large");
  await recorder.save(testInfo);
});
