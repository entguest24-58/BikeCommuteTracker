import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession } from "../../helpers/mock-api.js";

test("csv_import_no_files_selected", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({ testId: "csv_import_no_files_selected", testTitle: testInfo.title });

  await recorder.step("seed authenticated session", async () => {
    await setupAuthenticatedSession(page);
  });

  await recorder.step("open import page and preview without file", async () => {
    await page.goto("/expenses/import");
    await page.getByRole("button", { name: "Preview Import" }).click();
  });

  await recorder.step("assert no-file validation", async () => {
    await expect(page.getByRole("alert")).toHaveText("Select a CSV file before previewing import results.");
    await expect(page.getByRole("heading", { name: "Preview" })).not.toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:csv_import_no_files_selected");
  await recorder.save(testInfo);
});
