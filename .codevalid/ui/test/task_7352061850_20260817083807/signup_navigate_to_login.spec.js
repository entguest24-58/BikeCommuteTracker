import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupUnauthenticatedSession } from "../../helpers/mock-api.js";

test("Signup page provides clear navigation to Login page", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "signup_navigate_to_login",
    testTitle: "Signup page provides clear navigation to Login page",
  });

  await recorder.step("setup unauthenticated session", async () => {
    await setupUnauthenticatedSession(page);
  });

  await recorder.step("open signup page", async () => {
    await page.goto("/signup");
    await expect(page.getByRole("heading", { name: "Create account" })).toBeVisible();
  });

  await recorder.step("click login navigation link", async () => {
    await page.getByRole("link", { name: "Log in" }).click();
  });

  await recorder.step("assert redirect to login page", async () => {
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("heading", { name: "Log in" })).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:signup_navigate_to_login");
  await recorder.save(testInfo);
});
