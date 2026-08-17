import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupUnauthenticatedSession } from "../../helpers/mock-api.js";

test("Login page provides clear navigation to Signup page", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "login_navigate_to_signup",
    testTitle: "Login page provides clear navigation to Signup page",
  });

  await recorder.step("setup unauthenticated session", async () => {
    await setupUnauthenticatedSession(page);
  });

  await recorder.step("open login page", async () => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Log in" })).toBeVisible();
  });

  await recorder.step("click create account navigation link", async () => {
    await page.getByRole("link", { name: "Create an account" }).click();
  });

  await recorder.step("assert redirect to signup page", async () => {
    await expect(page).toHaveURL(/\/signup$/);
    await expect(page.getByRole("heading", { name: "Create account" })).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:login_navigate_to_signup");
  await recorder.save(testInfo);
});
