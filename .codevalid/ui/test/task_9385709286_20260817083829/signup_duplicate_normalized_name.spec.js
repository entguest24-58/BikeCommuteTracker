import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupUnauthenticatedSession,
  mockSignupDuplicateName,
} from "../../helpers/mock-api.js";

test("Signup fails when normalized name already exists", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("signup_duplicate_normalized_name", "Signup fails when normalized name already exists");

  await setupUnauthenticatedSession(page);
  await mockSignupDuplicateName(page, { message: "Name already exists" });

  recorder.recordStep("Open the create account page");
  await page.goto("/signup");

  recorder.recordStep("Enter duplicate normalized name and valid PIN");
  await page.locator("#signup-name").fill("JOHNDOE");
  await page.locator("#signup-pin").fill("5678");

  recorder.recordStep("Submit signup");
  await page.getByRole("button", { name: "Create account" }).click();

  recorder.recordStep("Verify duplicate-name error and stay on signup page");
  await expect(page).toHaveURL(/\/signup$/);
  await expect(page.getByText("Name already exists")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Create account" })).toBeVisible();

  console.log("CODEVALID_TEST_ASSERTION_OK:signup_duplicate_normalized_name");
  await recorder.save(testInfo);
});
