import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupUnauthenticatedSession,
  mockLocalIdentityLoginFailure,
} from "../../helpers/mock-api.js";

test("Form input values are preserved after failed login submission", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("login_preserves_form_data_on_validation_failure", test.info().title);

  await recorder.step("Prepare unauthenticated browser session and failed login mock");
  await setupUnauthenticatedSession(page);
  await mockLocalIdentityLoginFailure(page, {
    status: 401,
    message: "Name or PIN is incorrect.",
  });

  await recorder.step("Open the login page");
  await page.goto("/login");

  await recorder.step("Enter rider name");
  await page.locator("#login-name").fill("Alice");

  await recorder.step("Enter incorrect PIN");
  await page.locator("#login-pin").fill("4321");

  await recorder.step("Submit the login form");
  await page.getByRole("button", { name: "Log in" }).click();

  await recorder.step("Verify error appears and field values are preserved");
  await expect(page.getByText("Name or PIN is incorrect.")).toBeVisible();
  await expect(page.locator("#login-name")).toHaveValue("Alice");
  await expect(page.locator("#login-pin")).toHaveValue("4321");

  console.log("CODEVALID_TEST_ASSERTION_OK:login_preserves_form_data_on_validation_failure");
  await recorder.save(testInfo);
});
