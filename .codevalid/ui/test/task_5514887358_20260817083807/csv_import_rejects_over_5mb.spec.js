import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession } from "../../helpers/mock-api.js";
import { authSession } from "../../mock/mock-data.js";

test("CSV import rejects files over 5MB", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({ testId: "csv_import_rejects_over_5mb", testTitle: testInfo.title });

  await recorder.step("seed session", async () => {
    await setupAuthenticatedSession(page, authSession);
  });

  await recorder.step("select oversized csv file", async () => {
    await page.goto("/expenses/import");
    await page.locator("#expense-import-file").setInputFiles({
      name: "large_expenses.csv",
      mimeType: "text/csv",
      buffer: Buffer.alloc(6 * 1024 * 1024, "a"),
    });
  });

  await recorder.step("verify actual size error message", async () => {
    await expect(page.getByText("CSV file must be 5 MB or smaller.")).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:csv_import_rejects_over_5mb");
  await recorder.save(testInfo);
});
