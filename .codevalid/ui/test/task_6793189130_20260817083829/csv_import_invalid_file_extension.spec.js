import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession } from "../../helpers/mock-api.js";

test("csv_import_invalid_file_extension", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({ testId: "csv_import_invalid_file_extension", testTitle: testInfo.title });

  await recorder.step("seed authenticated session", async () => {
    await setupAuthenticatedSession(page);
  });

  await recorder.step("open import page", async () => {
    await page.goto("/expenses/import");
    await expect(page.getByRole("heading", { name: "Import Expenses" })).toBeVisible();
  });

  await recorder.step("select non csv file", async () => {
    await page.locator("#expense-import-file").setInputFiles({
      name: "data.xlsx",
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      buffer: Buffer.from("xlsx-content"),
    });
    await expect(page.getByRole("alert")).toHaveText("Please upload a .csv file.");
    await expect(page.getByRole("heading", { name: "Preview" })).not.toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:csv_import_invalid_file_extension");
  await recorder.save(testInfo);
});
