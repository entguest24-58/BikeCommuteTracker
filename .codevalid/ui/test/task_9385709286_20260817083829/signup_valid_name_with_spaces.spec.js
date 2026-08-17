import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupUnauthenticatedSession,
  mockSignupSuccess,
} from "../../helpers/mock-api.js";

test("Signup succeeds with valid name containing internal or leading/trailing spaces", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("signup_valid_name_with_spaces", "Signup succeeds with valid name containing internal or leading/trailing spaces");

  await setupUnauthenticatedSession(page);

  let submittedBody;
  await mockSignupSuccess(page, {
    response: {
      userId: 202,
      userName: "Jane Doe",
      createdAtUtc: "2026-08-17T08:38:29.000Z",
      eventStatus: "queued",
    },
    onRequest: (body) => {
      submittedBody = body;
    },
  });

  recorder.recordStep("Open the create account page");
  await page.goto("/signup");

  recorder.recordStep("Enter spaced name and valid PIN");
  await page.locator("#signup-name").fill("  Jane  Doe  ");
  await page.locator("#signup-pin").fill("4321");

  recorder.recordStep("Submit signup");
  await page.getByRole("button", { name: "Create account" }).click();

  recorder.recordStep("Verify redirect to login with prefilled original name value");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Log in" })).toBeVisible();
  await expect(page.locator("#login-name")).toHaveValue("  Jane  Doe  ");
  expect(submittedBody).toEqual({ name: "  Jane  Doe  ", pin: "4321" });

  console.log("CODEVALID_TEST_ASSERTION_OK:signup_valid_name_with_spaces");
  await recorder.save(testInfo);
});
