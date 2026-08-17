import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";

test("Installed app detects and applies update automatically when online and outdated", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("auto_update_detected_and_applied_on_launch", "Installed app detects and applies update automatically when online and outdated");

  await recorder.step("Launch the app online with startup health available.");
  await page.route("**/health", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ status: "ok" }),
    });
  });
  await page.route("**/api/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({}),
    });
  });

  await recorder.step("Open the application entry route.");
  await page.goto("/");

  await recorder.step("Assert the required distinct update-status message is shown during automatic update flow.");
  await expect(
    page.getByText("Updating to latest version... Please wait.")
  ).toBeVisible();

  await recorder.step("Assert update messaging is distinct from normal connecting/loading messaging.");
  await expect(page.getByText("Connecting…")).not.toBeVisible();

  console.log("CODEVALID_TEST_ASSERTION_OK:auto_update_detected_and_applied_on_launch");
  await recorder.save(testInfo);
});
