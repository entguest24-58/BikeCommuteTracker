import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupUnauthenticatedSession } from "../../helpers/mock-api.js";

test("Signup fails when name field is empty", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("signup_empty_name", "Signup fails when name field is empty");

  await setupUnauthenticatedSession(page);

  let signupCalled = false;
  await page.route("**/api/users/signup", async (route) => {
    signupCalled = true;
    await route.abort();
  });

  recorder.recordStep("Open the create account page");
  await page.goto("/signup");

  recorder.recordStep("Leave name empty and enter valid PIN");
  await page.locator("#signup-pin").fill("1234");

  recorder.recordStep("Attempt signup");
  await page.getByRole("button", { name: "Create account" }).click();

  recorder.recordStep("Verify required name validation blocks request");
  await expect(page.getByText("Name is required.")).toBeVisible();
  await expect(page).toHaveURL(/\/signup$/);
  expect(signupCalled).toBe(false);

  console.log("CODEVALID_TEST_ASSERTION_OK:signup_empty_name");
  await recorder.save(testInfo);
});
