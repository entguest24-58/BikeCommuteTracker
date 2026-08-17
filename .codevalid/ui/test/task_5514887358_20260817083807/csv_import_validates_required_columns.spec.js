import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedSession } from "../../helpers/mock-api.js";
import { authSession } from "../../mock/mock-data.js";

function json(route, status, body) {
  return route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
}

test("CSV import validates presence of Date and Amount columns", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({ testId: "csv_import_validates_required_columns", testTitle: testInfo.title });

  await recorder.step("seed preview api validation error", async () => {
    await setupAuthenticatedSession(page, authSession);
    await page.route("**/api/expense-imports/preview", async (route) =>
      json(route, 400, { message: "Required columns 'Date' and 'Amount' are missing." })
    );
  });

  await recorder.step("upload invalid-header csv and preview", async () => {
    await page.goto("/expenses/import");
    await page.locator("#expense-import-file").setInputFiles({
      name: "expenses.csv",
      mimeType: "text/csv",
      buffer: Buffer.from("date,price,description\n2024-06-15,10,abc"),
    });
    await page.getByRole("button", { name: "Preview Import" }).click();
  });

  await recorder.step("verify preview error and blocked confirmation", async () => {
    await expect(page.getByText("Required columns 'Date' and 'Amount' are missing.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Confirm Import" })).toHaveCount(0);
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:csv_import_validates_required_columns");
  await recorder.save(testInfo);
});
