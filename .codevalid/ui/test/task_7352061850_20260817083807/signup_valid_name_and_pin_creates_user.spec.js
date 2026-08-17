import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupUnauthenticatedSession, mockLocalIdentitySignupSuccess } from "../../helpers/mock-api.js";

test("Valid name and PIN create new user and redirect to login", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "signup_valid_name_and_pin_creates_user",
    testTitle: "Valid name and PIN create new user and redirect to login",
  });

  await recorder.step("setup unauthenticated session and signup success mock", async () => {
    await setupUnauthenticatedSession(page);
    await mockLocalIdentitySignupSuccess(page, {
      userId: 101,
      userName: "Alex",
      createdAtUtc: "2026-08-17T08:38:07.000Z",
      eventStatus: "queued",
    });
  });

  await recorder.step("open signup page", async () => {
    await page.goto("/signup");
    await expect(page.getByRole("heading", { name: "Create account" })).toBeVisible();
  });

  await recorder.step("enter valid trimmed name and pin", async () => {
    await page.locator("#signup-name").fill("Alex ");
    await page.locator("#signup-pin").fill("1234");
  });

  await recorder.step("submit signup form", async () => {
    await page.getByRole("button", { name: "Create account" }).click();
  });

  await recorder.step("assert redirect to login without ui error", async () => {
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("heading", { name: "Log in" })).toBeVisible();
    await expect(page.getByText("Name is required.")).toHaveCount(0);
    await expect(page.getByText("PIN must be numeric and 4 to 8 digits long.")).toHaveCount(0);
    await expect(page.getByText("name already exists", { exact: false })).toHaveCount(0);
    await expect(page.locator("#login-name")).toHaveValue("Alex ");
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:signup_valid_name_and_pin_creates_user");
  await recorder.save(testInfo);
});
