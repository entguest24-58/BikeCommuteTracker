import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupAuthenticatedSession,
  setupImportRidesPageScenario,
  setupDashboardPageRoutes,
} from "../../helpers/mock-api.js";

test("After successful import, user can navigate to dashboard", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("navigation_to_dashboard_after_import", "After successful import, user can navigate to dashboard");

  await recorder.step("Seed authenticated session, import completion routes, and dashboard routes", async () => {
    await setupAuthenticatedSession(page);
    await setupImportRidesPageScenario(page, {
      preview: "processingNoDuplicates",
      start: "processing",
      statusSequence: "completed",
      enableRealtime: false,
    });
    await setupDashboardPageRoutes(page);
  });

  await recorder.step("Upload CSV, preview import, and start import", async () => {
    await page.goto("/rides/import");
    await page.locator("#csv-upload-input").setInputFiles({
      name: "complete.csv",
      mimeType: "text/csv",
      buffer: Buffer.from("date,miles\n2026-08-01,10\n2026-08-02,11\n", "utf-8"),
    });
    await page.getByRole("button", { name: "Preview Import" }).click();
    await page.getByRole("button", { name: "Start Import" }).click();
  });

  await recorder.step("Verify completion UI and navigate to dashboard", async () => {
    await expect(page.getByRole("heading", { name: "Import Complete" })).toBeVisible();
    await expect(page.getByText(/rides were imported successfully/i)).toBeVisible();
    await page.getByRole("link", { name: "Go To Dashboard" }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole("heading", { name: "Your riding story, one screen." })).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:navigation_to_dashboard_after_import");
  await recorder.save(testInfo);
});
