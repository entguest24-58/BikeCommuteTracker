import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupAuthenticatedAppSession, setupRidePresetCrudScenario } from "../../helpers/mock-api.js";

test("Authenticated rider can access Ride Preset Settings via username menu", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("settings_access_authenticated_user", testInfo.title);

  await recorder.step("Seed authenticated session and settings/presets APIs", async () => {
    await setupAuthenticatedAppSession(page, { userId: 1, userName: "johndoe" });
    await setupRidePresetCrudScenario(page, { initialPresets: [] });
  });

  await recorder.step("Open dashboard", async () => {
    await page.goto("/dashboard");
    await expect(page.getByRole("link", { name: "Dashboard" })).toBeVisible();
  });

  await recorder.step("Open username menu", async () => {
    await page.getByRole("button", { name: "johndoe" }).click();
    await expect(page.getByRole("link", { name: "Settings" })).toBeVisible();
  });

  await recorder.step("Navigate to Settings", async () => {
    await page.getByRole("link", { name: "Settings" }).click();
    await expect(page).toHaveURL(/\/settings$/);
  });

  await recorder.step("Verify Ride Presets section is visible", async () => {
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Ride Presets" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Add Preset" })).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:settings_access_authenticated_user");
  await recorder.save(testInfo);
});
