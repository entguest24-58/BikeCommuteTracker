import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupUnauthenticatedSession,
  mockSignupSuccess,
} from "../../helpers/mock-api.js";

test("No authenticated session is established after signup", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("signup_no_session_established", "No authenticated session is established after signup");

  await setupUnauthenticatedSession(page);
  await mockSignupSuccess(page, {
    response: {
      userId: 404,
      userName: "New Rider",
      createdAtUtc: "2026-08-17T08:38:29.000Z",
      eventStatus: "queued",
    },
  });

  recorder.recordStep("Complete signup successfully");
  await page.goto("/signup");
  await page.locator("#signup-name").fill("New Rider");
  await page.locator("#signup-pin").fill("1234");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/login$/);

  recorder.recordStep("Navigate directly to protected dashboard route");
  await page.goto("/dashboard");

  recorder.recordStep("Verify protected route redirects back to login");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Log in" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Your riding story, one screen." })).toHaveCount(0);

  console.log("CODEVALID_TEST_ASSERTION_OK:signup_no_session_established");
  await recorder.save(testInfo);
});
