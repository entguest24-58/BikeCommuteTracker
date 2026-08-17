import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupRepoAppReady,
  setupUnauthenticatedSession,
  mockIdentifyInvalidCredentials,
} from "../../helpers/mock-api.js";

test("User enters unregistered username and receives clear error message", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("login_invalid_username_display_error", "User enters unregistered username and receives clear error message");

  await recorder.step("Mock API startup and invalid login response");
  await setupRepoAppReady(page);
  await setupUnauthenticatedSession(page);
  await mockIdentifyInvalidCredentials(page, { message: "Name or PIN is incorrect." });

  await recorder.step("Open the login page");
  await page.goto("/login");

  await recorder.step("Enter an unregistered user name");
  await page.locator("#login-name").fill("NonExistentUser");

  await recorder.step("Enter any PIN");
  await page.locator("#login-pin").fill("1234");

  await recorder.step("Submit the login form");
  await page.getByRole("button", { name: "Log in" }).click();

  await recorder.step("Verify the non-sensitive error and no redirect");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByText("Name or PIN is incorrect.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Log in" })).toBeVisible();

  console.log("CODEVALID_TEST_ASSERTION_OK:login_invalid_username_display_error");
  await recorder.save(testInfo);
});
