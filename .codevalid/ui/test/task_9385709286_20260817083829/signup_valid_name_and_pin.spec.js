import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupUnauthenticatedSession,
  mockSignupSuccess,
} from "../../helpers/mock-api.js";

test("User successfully signs up with valid name and PIN", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("signup_valid_name_and_pin", "User successfully signs up with valid name and PIN");

  await setupUnauthenticatedSession(page);

  let submittedBody;
  await mockSignupSuccess(page, {
    response: {
      userId: 101,
      userName: "JohnDoe",
      createdAtUtc: "2026-08-17T08:38:29.000Z",
      eventStatus: "queued",
    },
    onRequest: (body) => {
      submittedBody = body;
    },
  });

  recorder.recordStep("Open the create account page");
  await page.goto("/signup");
  await expect(page.getByRole("heading", { name: "Create account" })).toBeVisible();

  recorder.recordStep("Enter a valid name and PIN");
  await page.locator("#signup-name").fill("JohnDoe");
  await page.locator("#signup-pin").fill("1234");

  recorder.recordStep("Submit signup");
  await page.getByRole("button", { name: "Create account" }).click();

  recorder.recordStep("Verify redirect to login with no validation errors");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Log in" })).toBeVisible();
  await expect(page.getByText("Name is required.")).toHaveCount(0);
  await expect(page.getByText("PIN must be numeric and 4 to 8 digits long.")).toHaveCount(0);
  await expect(page.locator("#login-name")).toHaveValue("JohnDoe");

  expect(submittedBody).toEqual({ name: "JohnDoe", pin: "1234" });

  console.log("CODEVALID_TEST_ASSERTION_OK:signup_valid_name_and_pin");
  await recorder.save(testInfo);
});
