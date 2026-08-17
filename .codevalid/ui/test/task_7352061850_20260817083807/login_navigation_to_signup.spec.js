import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupUnauthenticatedSession } from "../../helpers/mock-api.js";

test("Login page provides clear link to SignupPage for new users", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("login_navigation_to_signup", test.info().title);

  await recorder.step("Prepare unauthenticated browser session");
  await setupUnauthenticatedSession(page);

  await recorder.step("Open the login page");
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Log in" })).toBeVisible();

  await recorder.step("Click the create account navigation link");
  await page.getByRole("link", { name: "Create an account" }).click();

  await recorder.step("Verify navigation to signup page");
  await expect(page).toHaveURL(/\/signup$/);
  await expect(page.getByRole("heading", { name: "Create account" })).toBeVisible();
  await expect(page.locator("#signup-name")).toBeVisible();
  await expect(page.locator("#signup-pin")).toBeVisible();

  console.log("CODEVALID_TEST_ASSERTION_OK:login_navigation_to_signup");
  await recorder.save(testInfo);
});
