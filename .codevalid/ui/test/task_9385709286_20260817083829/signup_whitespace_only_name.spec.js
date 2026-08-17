import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupUnauthenticatedSession } from "../../helpers/mock-api.js";

test("Signup fails when name field contains only whitespace", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("signup_whitespace_only_name", "Signup fails when name field contains only whitespace");

  await setupUnauthenticatedSession(page);

  let signupCalled = false;
  await page.route("**/api/users/signup", async (route) => {
    signupCalled = true;
    await route.abort();
  });

  recorder.recordStep("Open the create account page");
  await page.goto("/signup");

  recorder.recordStep("Enter whitespace-only name and valid PIN");
  await page.locator("#signup-name").fill("   ");
  await page.locator("#signup-pin").fill("5678");

  recorder.recordStep("Attempt signup");
  await page.getByRole("button", { name: "Create account" }).click();

  recorder.recordStep("Verify trimmed name is rejected and no request is made");
  await expect(page.getByText("Name is required.")).toBeVisible();
  await expect(page).toHaveURL(/\/signup$/);
  expect(signupCalled).toBe(false);

  console.log("CODEVALID_TEST_ASSERTION_OK:signup_whitespace_only_name");
  await recorder.save(testInfo);
});
