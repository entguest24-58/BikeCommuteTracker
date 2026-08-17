import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupUnauthenticatedSession,
  mockSignupSuccess,
} from "../../helpers/mock-api.js";

test("User is redirected to Login page after successful signup", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("signup_redirects_to_login_on_success", "User is redirected to Login page after successful signup");

  await setupUnauthenticatedSession(page);
  await mockSignupSuccess(page, {
    response: {
      userId: 303,
      userName: "Alice",
      createdAtUtc: "2026-08-17T08:38:29.000Z",
      eventStatus: "queued",
    },
  });

  recorder.recordStep("Open the create account page");
  await page.goto("/signup");

  recorder.recordStep("Enter valid signup credentials");
  await page.locator("#signup-name").fill("Alice");
  await page.locator("#signup-pin").fill("1111");

  recorder.recordStep("Submit signup");
  await page.getByRole("button", { name: "Create account" }).click();

  recorder.recordStep("Verify user lands on login page, not dashboard");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Log in" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Your riding story, one screen." })).toHaveCount(0);

  console.log("CODEVALID_TEST_ASSERTION_OK:signup_redirects_to_login_on_success");
  await recorder.save(testInfo);
});
