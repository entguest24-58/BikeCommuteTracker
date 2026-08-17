import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupAuthenticatedSession,
  setupRecordRidePageScenario,
} from "../../helpers/mock-api.js";

test("user can override difficulty, but changing travel direction clears override and recalculates", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "difficulty_override_and_direction_change_clears_override",
    testTitle: testInfo.title,
  });

  await recorder.step("setup session and open page", async () => {
    await setupAuthenticatedSession(page);
    await setupRecordRidePageScenario(page);
    await page.goto("/rides/record");
  });

  await recorder.step("create initial suggestion then override", async () => {
    await page.locator("#windSpeedMph").fill("10");
    await page.locator("#windDirectionDeg").fill("0");
    await page.locator("#primaryTravelDirection").selectOption("South");
    await expect(page.locator("#difficulty")).toHaveValue("5");
    await page.locator("#difficulty").selectOption("3");
    await expect(page.locator("#difficulty")).toHaveValue("3");
  });

  await recorder.step("change direction and verify override cleared", async () => {
    await page.locator("#primaryTravelDirection").selectOption("North");
    await expect(page.locator("#difficulty")).toHaveValue("1");
    await expect(page.getByText("auto-suggested")).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:difficulty_override_and_direction_change_clears_override");
  await recorder.save(testInfo);
});
