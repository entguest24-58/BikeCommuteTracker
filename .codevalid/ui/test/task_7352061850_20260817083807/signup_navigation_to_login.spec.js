import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupUnauthenticatedSession } from "../../helpers/mock-api.js";

test("SignupPage provides clear link back to LoginPage", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("signup_navigation_to_login", test.info().title);

  await recorder.step("Prepare unauthenticated browser session");
  await setupUnauthenticatedSession(page);

  await recorder.step("Open the signup page");
  await page.goto("/signup");
  await expect(page.getByRole("heading", { name: "Create account" })).toBeVisible();

  await recorder.step("Click the log in navigation link");
  await page.getByRole("link", { name: "Log in" }).click();

  await recorder.step("Verify navigation to login page");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Log in" })).toBeVisible();

  console.log("CODEVALID_TEST_ASSERTION_OK:signup_navigation_to_login");
  await recorder.save(testInfo);
});
