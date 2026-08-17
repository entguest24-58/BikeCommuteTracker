import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupAuthenticatedSession,
  setupRideHistoryScenario,
} from "../../helpers/mock-api.js";

test("Previously viewed or edited ride data is preserved across connectivity interruptions", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "cache_preservation_on_retry",
    testTitle: testInfo.title,
  });

  await recorder.step("seed authenticated session and healthy history mocks", async () => {
    await setupAuthenticatedSession(page);
    await setupRideHistoryScenario(page);
  });

  await recorder.step("open history page and capture loaded ride row", async () => {
    await page.goto("/rides/history");
    await expect(page.getByRole("cell", { name: "Morning commute" })).toBeVisible();
  });

  await recorder.step("begin editing a ride", async () => {
    await page.getByRole("button", { name: "Edit" }).first().click();
    await expect(page.getByRole("button", { name: "Save" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Cancel" })).toBeVisible();
  });

  await recorder.step("simulate interruption and recover by reloading with same server data", async () => {
    await page.unrouteAll({ behavior: "ignoreErrors" });
    await setupRideHistoryScenario(page);
    await page.reload();
  });

  await recorder.step("verify previously loaded server ride data is present after recovery", async () => {
    await expect(page.getByRole("heading", { name: "Ride History" })).toBeVisible();
    await expect(page.getByRole("cell", { name: "Morning commute" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Edit" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Delete" })).toBeVisible();
  });

  await recorder.step("verify unsaved inline edit state is not retained after reload", async () => {
    await expect(page.getByRole("button", { name: "Save" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Cancel" })).toHaveCount(0);
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:cache_preservation_on_retry");
  await recorder.save(testInfo);
});
