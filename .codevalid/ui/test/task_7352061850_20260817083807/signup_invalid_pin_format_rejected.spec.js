import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupUnauthenticatedSession } from "../../helpers/mock-api.js";

test("Signup with invalid PIN format (e.g., letters) is rejected", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "signup_invalid_pin_format_rejected",
    testTitle: "Signup with invalid PIN format (e.g., letters) is rejected",
  });

  await recorder.step("setup unauthenticated session", async () => {
    await setupUnauthenticatedSession(page);
  });

  await recorder.step("open signup page", async () => {
    await page.goto("/signup");
    await expect(page.getByRole("heading", { name: "Create account" })).toBeVisible();
  });

  await recorder.step("fill name and invalid pin", async () => {
    await page.locator("#signup-name").fill("alex");
    await page.locator("#signup-pin").fill("abc");
  });

  await recorder.step("submit invalid signup form", async () => {
    await page.getByRole("button", { name: "Create account" }).click();
  });

  await recorder.step("assert pin validation error and retained name", async () => {
    await expect(page).toHaveURL(/\/signup$/);
    await expect(page.getByText("PIN must be numeric and 4 to 8 digits long.")).toBeVisible();
    await expect(page.locator("#signup-name")).toHaveValue("alex");
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:signup_invalid_pin_format_rejected");
  await recorder.save(testInfo);
});
