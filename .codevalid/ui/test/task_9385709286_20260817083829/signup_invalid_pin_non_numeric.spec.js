import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupUnauthenticatedSession } from "../../helpers/mock-api.js";

test("Signup fails when PIN contains non-numeric characters", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("signup_invalid_pin_non_numeric", "Signup fails when PIN contains non-numeric characters");

  await setupUnauthenticatedSession(page);

  let signupCalled = false;
  await page.route("**/api/users/signup", async (route) => {
    signupCalled = true;
    await route.abort();
  });

  recorder.recordStep("Open the create account page");
  await page.goto("/signup");

  recorder.recordStep("Enter valid name and non-numeric PIN");
  await page.locator("#signup-name").fill("Charlie");
  await page.locator("#signup-pin").fill("abc123");

  recorder.recordStep("Attempt signup");
  await page.getByRole("button", { name: "Create account" }).click();

  recorder.recordStep("Verify client validation blocks request");
  await expect(page.getByText("PIN must be numeric and 4 to 8 digits long.")).toBeVisible();
  await expect(page).toHaveURL(/\/signup$/);
  expect(signupCalled).toBe(false);

  console.log("CODEVALID_TEST_ASSERTION_OK:signup_invalid_pin_non_numeric");
  await recorder.save(testInfo);
});
