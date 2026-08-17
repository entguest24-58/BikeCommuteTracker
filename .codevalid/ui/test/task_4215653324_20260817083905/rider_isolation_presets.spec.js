import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupRideEntryScenario } from "../../mock/mock-server.js";

test("rider_isolation_presets", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("rider_isolation_presets", "Rider cannot view another rider's presets");

  await recorder.step("Seed authenticated rider A with empty scoped preset response", async () => {
    await setupRideEntryScenario(page, { scenario: "riderIsolation" });
  });

  await recorder.step("Open ride entry page as rider A", async () => {
    await page.goto("/rides/record");
    await expect(page.getByRole("heading", { name: "Record a Ride" })).toBeVisible();
  });

  await recorder.step("Verify foreign preset is not displayed", async () => {
    await expect(page.locator("#ridePreset")).toHaveCount(0);
    await expect(page.getByText("Evening Run")).toHaveCount(0);
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:rider_isolation_presets");
  await recorder.save(testInfo);
});
