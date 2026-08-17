import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupAuthenticatedSession,
  setupImportRidesPageScenario,
} from "../../helpers/mock-api.js";

test("Import workflow performs no network requests to external services", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("import_uses_no_external_apis", "Import workflow performs no network requests to external services");
  const externalRequests = [];

  await recorder.step("Track outbound requests and seed import scenario", async () => {
    page.on("request", (request) => {
      const url = request.url();
      if (/eia|open-meteo|analytics|telemetry|segment|google-analytics|api\.open-meteo/i.test(url)) {
        externalRequests.push(url);
      }
    });

    await setupAuthenticatedSession(page);
    await setupImportRidesPageScenario(page, {
      preview: "duplicatesRequireResolution",
      start: "processing",
      statusSequence: "completedAfterResolution",
      enableRealtime: false,
    });
  });

  await recorder.step("Run the full import flow including duplicate resolution", async () => {
    await page.goto("/rides/import");
    await page.locator("#csv-upload-input").setInputFiles({
      name: "no-external.csv",
      mimeType: "text/csv",
      buffer: Buffer.from("date,miles\n2026-08-01,12.4\n", "utf-8"),
    });
    await page.getByRole("button", { name: "Preview Import" }).click();
    await page.getByRole("button", { name: "Start Import" }).click();
    await page.getByText("Row 1 replace with import").click();
    await page.getByRole("button", { name: "Start Import" }).click();
    await expect(page.getByRole("heading", { name: "Import Complete" })).toBeVisible();
  });

  await recorder.step("Verify no external-service requests were observed", async () => {
    expect(externalRequests).toEqual([]);
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:import_uses_no_external_apis");
  await recorder.save(testInfo);
});
