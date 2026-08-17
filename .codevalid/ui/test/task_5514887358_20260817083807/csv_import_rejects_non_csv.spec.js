import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession } from "../../helpers/mock-api.js";
import { authSession } from "../../mock/mock-data.js";

test("CSV import rejects non-.csv files and displays error", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({ testId: "csv_import_rejects_non_csv", testTitle: testInfo.title });

  await recorder.step("seed authenticated session", async () => {
    await setupAuthenticatedSession(page, authSession);
  });

  await recorder.step("select non-csv file", async () => {
    await page.goto("/expenses/import");
    await page.locator("#expense-import-file").setInputFiles({
      name: "expenses.xlsx",
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      buffer: Buffer.from("xlsx"),
    });
  });

  await recorder.step("verify actual client-side validation message", async () => {
    await expect(page.getByText("Please upload a .csv file.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Preview Import" })).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:csv_import_rejects_non_csv");
  await recorder.save(testInfo);
});
