import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupUnauthenticatedSession,
  mockLocalIdentityLoginFailure,
} from "../../helpers/mock-api.js";

test("Login fails with general error when PIN does not match stored hash", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("login_incorrect_pin", test.info().title);

  await recorder.step("Prepare unauthenticated browser session and failed login mock");
  await setupUnauthenticatedSession(page);
  await mockLocalIdentityLoginFailure(page, {
    status: 401,
    message: "Name or PIN is incorrect.",
  });

  await recorder.step("Open the login page");
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Log in" })).toBeVisible();

  await recorder.step("Enter existing rider name");
  await page.locator("#login-name").fill("Alice");

  await recorder.step("Enter incorrect PIN");
  await page.locator("#login-pin").fill("4321");

  await recorder.step("Submit the login form");
  await page.getByRole("button", { name: "Log in" }).click();

  await recorder.step("Verify general authentication error and preserved form values");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByText("Name or PIN is incorrect.")).toBeVisible();
  await expect(page.locator("#login-name")).toHaveValue("Alice");
  await expect(page.locator("#login-pin")).toHaveValue("4321");

  console.log("CODEVALID_TEST_ASSERTION_OK:login_incorrect_pin");
  await recorder.save(testInfo);
});
