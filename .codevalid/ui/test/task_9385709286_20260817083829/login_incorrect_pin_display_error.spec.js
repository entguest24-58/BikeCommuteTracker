import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupRepoAppReady,
  setupUnauthenticatedSession,
  mockIdentifyInvalidCredentials,
} from "../../helpers/mock-api.js";

test("User enters correct username with incorrect PIN and receives clear error message", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("login_incorrect_pin_display_error", "User enters correct username with incorrect PIN and receives clear error message");

  await recorder.step("Mock API startup and invalid credentials response");
  await setupRepoAppReady(page);
  await setupUnauthenticatedSession(page);
  await mockIdentifyInvalidCredentials(page, { message: "Name or PIN is incorrect." });

  await recorder.step("Open the login page");
  await page.goto("/login");

  await recorder.step("Enter the existing rider name");
  await page.locator("#login-name").fill("JaneDoe");

  await recorder.step("Enter an incorrect PIN");
  await page.locator("#login-pin").fill("9999");

  await recorder.step("Submit the login form");
  await page.getByRole("button", { name: "Log in" }).click();

  await recorder.step("Verify the error remains on the login page");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByText("Name or PIN is incorrect.")).toBeVisible();

  console.log("CODEVALID_TEST_ASSERTION_OK:login_incorrect_pin_display_error");
  await recorder.save(testInfo);
});
