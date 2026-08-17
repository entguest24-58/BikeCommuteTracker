import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedAppSession, setupRidePresetCrudScenario } from "../../helpers/mock-api.js";
import { weekendRidePreset } from "../../mock/mock-data.js";

test("Valid preset creation succeeds and appears in list", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("create_preset_valid_success", testInfo.title);

  await recorder.step("Seed authenticated session and empty preset list", async () => {
    await setupAuthenticatedAppSession(page, { userId: 1, userName: "johndoe" });
    await setupRidePresetCrudScenario(page, {
      initialPresets: [],
      createdPresets: [weekendRidePreset],
    });
  });

  await recorder.step("Open SettingsPage", async () => {
    await page.goto("/settings");
  });

  await recorder.step("Create a valid ride preset", async () => {
    await page.locator("#presetName").fill("Weekend Ride");
    await page.locator("#presetPeriodTag").selectOption("morning");
    await page.locator("#presetExactStartTimeLocal").fill("08:00");
    await page.locator("#presetDurationMinutes").fill("60");
    await page.locator("#presetMiles").fill("10.5");
    await page.locator("#presetPrimaryDirection").selectOption("NE");
    await page.getByRole("button", { name: "Add Preset" }).click();
  });

  await recorder.step("Verify saved preset appears in list and form resets", async () => {
    await expect(page.getByText("Weekend Ride (NE, morning, 08:00, 60 min, 10.5 mi)")).toBeVisible();
    await expect(page.getByText("Preset created.")).toBeVisible();
    await expect(page.locator("#presetName")).toHaveValue("");
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:create_preset_valid_success");
  await recorder.save(testInfo);
});
