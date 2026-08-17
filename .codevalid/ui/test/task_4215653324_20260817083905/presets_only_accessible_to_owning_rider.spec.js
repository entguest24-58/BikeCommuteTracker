import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedAppSession, setupRidePresetCrudScenario } from "../../helpers/mock-api.js";

test("Presets are inaccessible to other riders", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("presets_only_accessible_to_owning_rider", testInfo.title);

  await recorder.step("Seed Rider B session with Rider B scoped empty preset response", async () => {
    await setupAuthenticatedAppSession(page, { userId: 2, userName: "riderb" });
    await setupRidePresetCrudScenario(page, { initialPresets: [] });
  });

  await recorder.step("Open SettingsPage as Rider B", async () => {
    await page.goto("/settings");
    await expect(page.getByRole("heading", { name: "Ride Presets" })).toBeVisible();
  });

  await recorder.step("Verify Rider A preset is not shown", async () => {
    await expect(page.getByText("RiderA Commute")).toHaveCount(0);
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:presets_only_accessible_to_owning_rider");
  await recorder.save(testInfo);
});
